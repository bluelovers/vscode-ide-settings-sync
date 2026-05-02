import * as vscode from 'vscode';
import { IDEProvider } from '../providers/ideProvider';
import { ILanguageConfig, EnumGlobalStateName } from '../types';
import {
	getSupportedLanguages,
	ILanguageCode,
	getSettingDescriptionBilingual,
	getAllSettingKeys,
} from '../utils/settingsDescriptions';
import { getDefaultLanguageConfig } from '../utils/languageConfig';
// @ts-ignore
import cssContent from './settingsSyncPanel.scss';
import { renderJsxToString } from '../utils/render-jsx';
import { saveIDECache, loadIDECache, exportIDECache, importIDECache } from '../utils/ideCache';
import { _performSyncCore } from '../utils/settingsSync';
import { WebviewCommand, HostCommand, IWebviewMessage, IHostMessage } from './webviewMessages';
// @ts-ignore — webview/src/app.tsx uses automatic JSX; imported here for SSR only
import { App, IAppProps } from '../../webview/src/app';

export class SettingsSyncPanel
{
	public readonly panel: vscode.WebviewPanel;
	private disposables: vscode.Disposable[] = [];
	private ideProvider: IDEProvider;
	private context: vscode.ExtensionContext;
	private onDisposeCallback?: () => void;
	private languageConfig: ILanguageConfig;
	private currentLanguage: ILanguageCode;

	constructor(context: vscode.ExtensionContext, ideProvider: IDEProvider, languageConfig?: ILanguageConfig)
	{
		this.context = context;
		this.ideProvider = ideProvider;
		// 使用工具函數取得預設語言配置，避免重複
		// Use utility to get default language config to avoid duplication
		this.languageConfig = languageConfig || getDefaultLanguageConfig();
		this.currentLanguage = this.languageConfig.primary;

		const extensionUri = context.extensionUri;
		const distUri = vscode.Uri.joinPath(extensionUri, 'dist');

		this.panel = vscode.window.createWebviewPanel(
			'settingsSyncPanel',
			'IDE Settings Sync',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				// 必須明確授權 Webview 存取 dist 資料夾
				localResourceRoots: [distUri],
			},
		);

		this.panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'icon.svg');

		// 嘗試從檔案快取載入來源 IDE UUID
		// Try to load source IDE UUID from file cache
		const cachedData = loadIDECache(context.extensionPath);
		if (cachedData?.sourceIDEUuid)
		{
			// 如果 globalState 中沒有來源 IDE，則使用檔案快取中的值
			const globalSourceIDEUuid = this.context.globalState.get<string>(EnumGlobalStateName.sourceIDEUuid);
			if (!globalSourceIDEUuid)
			{
				this.context.globalState.update(EnumGlobalStateName.sourceIDEUuid, cachedData.sourceIDEUuid);
				console.log(`[IDE Cache] 從檔案快取恢復來源 IDE UUID: ${cachedData.sourceIDEUuid}`);
				console.log(`[IDE Cache] Restored source IDE UUID from file cache: ${cachedData.sourceIDEUuid}`);
			}
		}

		this.updateWebview();
		this.setupMessageHandler();

		this.panel.onDidDispose(() =>
		{
			this.dispose();
			this.onDisposeCallback?.();
		}, null, this.disposables);
	}

	/**
	 * Update the webview HTML. By default this will also refresh the IDE
	 * list from disk, but callers can opt-out if they only need to reload
	 * settings for the already-detected IDEs.
	 *
	 * / 更新 webview 的 HTML。預設會連同重新讀取 IDE 列表，但呼叫方
	 * 可以選擇只重新載入現有 IDE 的設定值。
	 *
	 * @param refreshIDEList whether to refresh the IDE list (default true)
	 */
	private postToWebview(message: IHostMessage): void
	{
		this.panel.webview.postMessage(message);
	}

	private async updateWebview(refreshIDEList: boolean = true): Promise<void>
	{
		if (refreshIDEList)
		{
			await this.ideProvider.refreshIDEList();
		}

		// 儲存 IDE 列表到檔案快取
		// Save IDE list to file cache
		const ideList = this.ideProvider.getIDEList();
		const savedSourceIDEUuid = this.context.globalState.get<string>(EnumGlobalStateName.sourceIDEUuid) || '';
		saveIDECache(this.context.extensionPath, ideList, savedSourceIDEUuid);

		this.panel.webview.html = this.getWebviewContent();
	}

	/**
	 * 推送最新的 IDE 設定資料至 Webview，不重繪整頁 HTML。
	 * Push the latest IDE settings data to the Webview without redrawing the entire HTML.
	 *
	 * 適用於只有設定值改變（sync / delete / refreshData）的情況：
	 * - IDE 列表結構不變（沒有新增/移除 IDE）
	 * - Webview 端收到 `dataRefreshed` 訊息後更新 `ideList` signal
	 * - Preact 組件自動重新渲染，checkbox 勾選狀態保留
	 * - 分頁位置、搜尋字串等 UI 狀態不受影響
	 *
	 * Use when only setting values change (sync / delete / refreshData):
	 * - IDE list structure unchanged (no IDEs added or removed)
	 * - Webview receives `dataRefreshed` message and updates the `ideList` signal
	 * - Preact components re-render automatically, checkbox state preserved
	 * - Tab position, search string, and other UI state unaffected
	 *
	 * 若需要重新掃描 IDE 安裝或 IDE 列表結構改變，仍需呼叫 updateWebview()。
	 * If IDE installations need to be re-scanned or the IDE list structure changes,
	 * updateWebview() must still be called.
	 */
	private async pushDataRefresh(): Promise<void>
	{
		/**
		 * 重新讀取各 IDE 的 settings.json（完整重新掃描，確保資料最新）
		 * Reload each IDE's settings.json (full re-scan to ensure data is up to date)
		 */
		await this.ideProvider.refreshIDEList();

		const ideList = this.ideProvider.getIDEListToWebviewContent();
		const savedSourceIDEUuid = this.context.globalState.get<string>(EnumGlobalStateName.sourceIDEUuid) || '';

		/**
		 * 儲存 IDE 列表到檔案快取（與 updateWebview 保持一致）
		 * Save IDE list to file cache (consistent with updateWebview)
		 */
		saveIDECache(this.context.extensionPath, this.ideProvider.getIDEList(), savedSourceIDEUuid);

		/**
		 * 推送資料至 Webview：Webview 端的 messages.ts 收到後
		 * 更新 ideList signal，Preact 組件自動重新渲染。
		 * Push data to Webview: messages.ts on the Webview side receives this,
		 * updates the ideList signal, and Preact components re-render automatically.
		 */
		this.postToWebview({
			command: HostCommand.DataRefreshed,
			ideList,
		});
	}

	private getWebviewContent(): string
	{
		const ideList = this.ideProvider.getIDEList();
		const unavailableIDEs = this.ideProvider.getUnavailableIDEs();
		/**
		 * Determine which IDE corresponds to the running host (by name)
		 * e.g. "Visual Studio Code" or "Visual Studio Code - Insiders"
		 */
		const currentIDEName = vscode.env.appName;
		const currentIDEUuid = ideList.find(ide => ide.name === currentIDEName)?.uuid;

		// 👇 從 globalState 中獲取已保存的值
		const savedSearchHistory = this.context.globalState.get<string>(EnumGlobalStateName.searchHistory) || '';
		const savedSelectedSettings = this.context.globalState.get<string[]>(EnumGlobalStateName.selectedSettings) || [];
		const savedSelectedIDEs = this.context.globalState.get<number[]>(EnumGlobalStateName.selectedIDEs) || [];
		const savedSourceIDEUuid = this.context.globalState.get<string>(EnumGlobalStateName.sourceIDEUuid) || '';

		// 解析 webview script URI
		const scriptUri = this.panel.webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'index.js'),
		);

		if (!scriptUri)
		{
			console.error('[SettingsSyncPanel] Failed to resolve webview script URI for dist/webview/index.js');
		}

		const props: IAppProps = {
			ideList,
			unavailableIDEs,
			currentIDEName,
			sourceIDEUuid: savedSourceIDEUuid,
			languageConfig: this.languageConfig,
			supportedLanguages: getSupportedLanguages(),
			currentLanguage: this.currentLanguage,
			cssContent,
			cspSource: this.panel.webview.cspSource,
			webviewScriptUri: scriptUri?.toString() ?? '',
			initialState: {
				ideList: this.ideProvider.getIDEListToWebviewContent(),
				currentLanguage: this.currentLanguage,
				languageConfig: this.languageConfig,
				currentIDEName,
				currentIDEUuid: currentIDEUuid ?? '',
				savedSearchHistory,
				savedSelectedSettings,
				savedSelectedIDEs,
				settingDescriptions: this.generateMultilingualDescriptions(),
			},
		};

		return renderJsxToString(App, props);
	}

	/**
	 * 生成多語言設定描述對象
	 * Generate multi-language setting descriptions object for WebView injection
	 */
	private generateMultilingualDescriptions(): Record<string, { primary: string; secondary?: string }>
	{
		const descriptions: Record<string, { primary: string; secondary?: string }> = {};
		const allKeys = getAllSettingKeys();

		for (const key of allKeys)
		{
			const bilingual = getSettingDescriptionBilingual(
				key,
				this.currentLanguage,
				this.languageConfig.secondary,
				this.languageConfig.fallbackList || [],
			);
			descriptions[key] = bilingual;
		}

		return descriptions;
	}

	private setupMessageHandler(): void
	{
		this.panel.webview.onDidReceiveMessage(
			async (message: IWebviewMessage) =>
			{
				switch (message.command)
				{
					case WebviewCommand.RequestAddCustomIDE: {
						const path = await vscode.window.showInputBox({
							prompt: 'Enter the path to the IDE settings folder (containing settings.json)',
							placeHolder: 'e.g., C:\\Users\\User\\AppData\\Roaming\\Code\\User',
						});
						if (!path) break;
						const name = await vscode.window.showInputBox({
							prompt: 'Enter a name for this IDE',
							placeHolder: 'e.g., My VS Code',
						});
						if (!name) break;
						try
						{
							await this.ideProvider.addCustomIDE(name, path);
							await this.updateWebview();
							this.postToWebview({ command: HostCommand.AddCustomIDEComplete, success: true, name });
						}
						catch (error)
						{
							this.postToWebview({ command: HostCommand.AddCustomIDEComplete, success: false, error: String(error instanceof Error ? error.message : error) });
						}
						break;
					}

					case WebviewCommand.AddCustomIDE:
						try
						{
							await this.ideProvider.addCustomIDE(message.name, message.path);
							await this.updateWebview();
							this.postToWebview({ command: HostCommand.AddCustomIDEComplete, success: true, name: message.name });
						}
						catch (error)
						{
							this.postToWebview({ command: HostCommand.AddCustomIDEComplete, success: false, error: String(error instanceof Error ? error.message : error) });
						}
						break;

					case WebviewCommand.RemoveCustomIDE: {
						const confirmRemove = await vscode.window.showWarningMessage(
							`Remove custom IDE "${message.name}"?`,
							{ modal: true },
							'Remove',
							'Cancel',
						);
						if (confirmRemove === 'Remove')
						{
							await this.ideProvider.removeCustomIDEByUuid(message.uuid);
							await this.updateWebview();
						}
						break;
					}

					case WebviewCommand.OpenSettingsJson:
						await this.openSettingsJsonFile(message.idePath, message.ideName);
						break;

					case WebviewCommand.SyncSettings:
						await this.performSync(
							message.sourceIDE !== undefined ? parseInt(message.sourceIDE) : NaN,
							message.targetIDEs,
							message.settings,
						);
						this.postToWebview({ command: HostCommand.SyncComplete });
						await this.pushDataRefresh();
						break;

					case WebviewCommand.DeleteSettings:
						await this.performDelete(message.ideIndices, message.settings);
						this.postToWebview({ command: HostCommand.DeleteComplete });
						await this.pushDataRefresh();
						break;

					case WebviewCommand.RefreshIDEs:
						await this.updateWebview(true);
						break;

					case WebviewCommand.RefreshData:
						await this.pushDataRefresh();
						break;

					case WebviewCommand.ChangePrimaryLanguage:
						if (message.language)
						{
							this.languageConfig.primary = message.language as ILanguageCode;
							this.currentLanguage = message.language as ILanguageCode;
						}
						break;

					case WebviewCommand.OpenLanguageConfig:
						vscode.commands.executeCommand('vscode-ide-settings-sync.configLanguage');
						break;

					case WebviewCommand.OpenIDEFolder:
						if (message.path)
						{
							vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(message.path));
						}
						break;

					case WebviewCommand.SaveSearchHistory:
						this.context.globalState.update(EnumGlobalStateName.searchHistory, message.searchText);
						break;

					case WebviewCommand.SaveSelectedSettings:
						this.context.globalState.update(EnumGlobalStateName.selectedSettings, message.selectedSettings);
						break;

					case WebviewCommand.SaveSelectedIDEs:
						this.context.globalState.update(EnumGlobalStateName.selectedIDEs, message.selectedIDEs);
						break;

					case WebviewCommand.SelectSourceIDE:
						this.context.globalState.update(EnumGlobalStateName.sourceIDEUuid, message.uuid);
						break;

					case WebviewCommand.BrowseExportPath: {
						const exportPath = await vscode.window.showOpenDialog({
							canSelectFiles: false,
							canSelectFolders: true,
							canSelectMany: false,
							openLabel: 'Select Export Folder',
							title: 'Select folder to save export file',
						});
						if (exportPath && exportPath[0])
						{
							this.postToWebview({ command: HostCommand.ExportPathSelected, path: exportPath[0].fsPath });
						}
						break;
					}

					case WebviewCommand.BrowseImportPath: {
						const importPath = await vscode.window.showOpenDialog({
							canSelectFiles: true,
							canSelectFolders: false,
							canSelectMany: false,
							filters: { 'JSON Files': ['json'] },
							openLabel: 'Select Import File',
							title: 'Select file to import',
						});
						if (importPath && importPath[0])
						{
							this.postToWebview({ command: HostCommand.ImportPathSelected, path: importPath[0].fsPath });
						}
						break;
					}

					case WebviewCommand.ExportCustomIDEs:
						try
						{
							await vscode.commands.executeCommand('ide-sync.exportCustomIDEs');
							this.postToWebview({ command: HostCommand.ExportComplete, success: true });
						}
						catch (error)
						{
							this.postToWebview({ command: HostCommand.ExportComplete, success: false, error: String(error instanceof Error ? error.message : error) });
						}
						break;

					case WebviewCommand.ExportSelectedSettings:
						try
						{
							await vscode.commands.executeCommand('ide-sync.exportSelectedSettings');
							this.postToWebview({ command: HostCommand.ExportComplete, success: true });
						}
						catch (error)
						{
							this.postToWebview({ command: HostCommand.ExportComplete, success: false, error: String(error instanceof Error ? error.message : error) });
						}
						break;

					case WebviewCommand.ExportAll:
						try
						{
							await vscode.commands.executeCommand('ide-sync.exportAll');
							this.postToWebview({ command: HostCommand.ExportComplete, success: true });
						}
						catch (error)
						{
							this.postToWebview({ command: HostCommand.ExportComplete, success: false, error: String(error instanceof Error ? error.message : error) });
						}
						break;

					case WebviewCommand.Import:
						try
						{
							await vscode.commands.executeCommand('ide-sync.import');
							this.postToWebview({ command: HostCommand.ImportComplete, success: true });
						}
						catch (error)
						{
							this.postToWebview({ command: HostCommand.ImportComplete, success: false, error: String(error instanceof Error ? error.message : error) });
						}
						break;
				}
			},
			undefined,
			this.disposables,
		);
	}

	private async performSync(
		sourceIDEIndex: number,
		targetIDEIndices: number[],
		settingKeys: string[],
	): Promise<void>
	{
		return _performSyncCore(this.ideProvider, sourceIDEIndex, targetIDEIndices, settingKeys);
	}

	private async performDelete(ideIndices: number[], settingKeys: string[]): Promise<void>
	{
		for (const settingKey of settingKeys)
		{
			for (const ideIndex of ideIndices)
			{
				await this.ideProvider.deleteSetting(ideIndex, settingKey);
			}
		}
	}

	refreshData(): void
	{
		this.updateWebview();
	}

	reveal(): void
	{
		this.panel.reveal();
	}

	dispose(): void
	{
		this.panel.dispose();
		this.disposables.forEach((d) => d.dispose());
	}

	onDispose(callback: () => void): void
	{
		this.onDisposeCallback = callback;
	}

	async syncSelectedSettings(): Promise<void>
	{
		// This would be called by the extension when user clicks sync
		// The actual sync is handled by the WebView message handler
	}

	/**
	 * Open settings.json file for the specified IDE
	 * @param idePath - The IDE path
	 * @param ideName - The IDE name
	 */
	private async openSettingsJsonFile(idePath: string, ideName: string): Promise<void>
	{
		try
		{
			const path = require('path');
			const fs = require('fs');

			// Try multiple possible settings.json paths
			const possiblePaths = [
				path.join(idePath, 'settings.json'),
				path.join(idePath, 'User', 'settings.json'),
			];

			let settingsPath: string | null = null;

			for (const possiblePath of possiblePaths)
			{
				if (fs.existsSync(possiblePath))
				{
					settingsPath = possiblePath;
					break;
				}
			}

			if (!settingsPath)
			{
				vscode.window.showWarningMessage(
					`settings.json not found for ${ideName}. Checked paths:\n${possiblePaths.join('\n')}`,
				);
				return;
			}

			// Open the settings.json file in VS Code editor
			const document = await vscode.workspace.openTextDocument(settingsPath);
			await vscode.window.showTextDocument(document);
		}
		catch (error)
		{
			const errorMessage = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to open settings.json for ${ideName}: ${errorMessage}`);
		}
	}
}
