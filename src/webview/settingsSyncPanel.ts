import * as vscode from 'vscode';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { IDEProvider } from '../providers/ideProvider';
import { ILanguageConfig, EnumGlobalStateName, EnumLanguageCode } from '../types';
import {
	getSupportedLanguages,
	getSettingDescriptionBilingual,
	getAllSettingKeys,
} from '../utils/settingsDescriptions';
import { getDefaultLanguageConfig } from '../utils/languageConfig';
// @ts-ignore
import cssContent from './settingsSyncPanel.scss';
import { renderJsxToString } from '../utils/render-jsx';
import { saveIDECache, loadIDECache, exportIDECache, importIDECache } from '../utils/ideCache';
import { _performSyncCore } from '../utils/settingsSync';
import { EnumWebviewCommand, EnumHostCommand, IWebviewMessage, IHostMessage } from './webviewMessages';
// @ts-ignore — webview/src/app.tsx uses automatic JSX; imported here for SSR only
import { App, IAppProps } from '../../webview/src/app';
import { EnumVscodeCommands } from '../types/vscode/vscode-commands';
import { AbstractClassWithContextGlobalState } from '../providers/vscode/globalState';

export class SettingsSyncPanel extends AbstractClassWithContextGlobalState
{
	/** Webview 面板實例 / Webview panel instance */
	public readonly panel: vscode.WebviewPanel;
	/** 可釋放的資源列表 / List of disposable resources */
	protected disposables: vscode.Disposable[] = [];
	/** IDE 檢測與管理提供者 / IDE detection and management provider */
	protected ideProvider: IDEProvider;
	/** VS Code 擴充上下文 / VS Code extension context */
	protected context: vscode.ExtensionContext;
	/** 面板釋放時的回調函數 / Callback function when panel is disposed */
	protected onDisposeCallback?: () => void;
	/** 語言配置物件 / Language configuration object */
	protected languageConfig: ILanguageConfig;
	/** 當前選取的語言代碼 / Currently selected language code */
	protected currentLanguage: EnumLanguageCode;

	constructor(context: vscode.ExtensionContext, ideProvider: IDEProvider, languageConfig?: ILanguageConfig)
	{
		super();
		this.context = context;
		this.ideProvider = ideProvider;
		/**
		 * 使用工具函數取得預設語言配置，避免重複
		 * Use utility to get default language config to avoid duplication
		 */
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
				/** 必須明確授權 Webview 存取 dist 資料夾 */
				localResourceRoots: [distUri],
			},
		);

		this.panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'icon.svg');

		/**
		 * 嘗試從檔案快取載入來源 IDE UUID
		 * Try to load source IDE UUID from file cache
		 */
		const cachedData = loadIDECache(context.extensionPath);
		if (cachedData?.sourceIDEUuid)
		{
			/** 如果 globalState 中沒有來源 IDE，則使用檔案快取中的值 */
			const globalSourceIDEUuid = this.globalState.get(EnumGlobalStateName.sourceIDEUuid);
			if (!globalSourceIDEUuid)
			{
				this.globalState.update(EnumGlobalStateName.sourceIDEUuid, cachedData.sourceIDEUuid);
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
	 * 推送訊息至 Webview
	 * Post message to Webview
	 *
	 * @param message - 要推送的主機訊息 / Host message to post
	 */
	protected postToWebview(message: IHostMessage): void
	{
		console.log('[SettingsSyncPanel] Posting message to webview:', message.command, message);

		this.panel.webview.postMessage(message);
	}

	/**
	 * 更新 Webview HTML 內容（重新產生並設定 HTML）
	 * Update the webview HTML content (regenerate and set HTML)
	 *
	 * 預設會連同重新掃描 IDE 列表，但呼叫方可以選擇只重新載入現有 IDE 的設定值。
	 * By default this will also refresh the IDE list from disk, but callers can opt-out
	 * if they only need to reload settings for the already-detected IDEs.
	 *
	 * @param refreshIDEList - 是否重新整理 IDE 列表（預設 true）/ Whether to refresh the IDE list (default true)
	 */
	protected async updateWebview(refreshIDEList: boolean = true): Promise<void>
	{
		if (refreshIDEList)
		{
			await this.ideProvider.refreshIDEList();
		}

		/**
		 * 儲存 IDE 列表到檔案快取
		 * Save IDE list to file cache
		 */
		const ideList = this.ideProvider.getIDEList();
		const savedSourceIDEUuid = this.globalState.get(EnumGlobalStateName.sourceIDEUuid, '');
		saveIDECache(this.context.extensionPath, ideList, savedSourceIDEUuid);

		this.panel.webview.html = this.getWebviewContent();
	}

	/**
	 * 推送最新的 IDE 設定資料至 Webview，不重繪整個 HTML。
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
	 *
	 * @returns Promise<void>
	 */
	protected async pushDataRefresh(): Promise<void>
	{
		/**
		 * 重新讀取各 IDE 的 settings.json（完整重新掃描，確保資料最新）
		 * Reload each IDE's settings.json (full re-scan to ensure data is up to date)
		 */
		await this.ideProvider.refreshIDEList();

		const ideList = this.ideProvider.getIDEListToWebviewContent();
		const savedSourceIDEUuid = this.globalState.get(EnumGlobalStateName.sourceIDEUuid, '');

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
			command: EnumHostCommand.DataRefreshed,
			ideList,
		});
	}

	/**
	 * 取得 Webview HTML 內容（SSR 渲染）
	 * Get Webview HTML content (SSR rendering)
	 *
	 * 組裝所有必要的 props 並透過 renderJsxToString 產生 HTML 字串。
	 * Assembles all required props and generates HTML string via renderJsxToString.
	 *
	 * @returns 完整的 HTML 字串 / Complete HTML string
	 */
	protected getWebviewContent(): string
	{
		const availableIDEs = this.ideProvider.getIDEListToWebviewContent();
		const unavailableIDEs = this.ideProvider.getUnavailableIDEs();
		/**
		 * 根據 VS Code 應用程式名稱判斷當前運行的 IDE
		 * Determine which IDE corresponds to the running host (by name)
		 * e.g. "Visual Studio Code" or "Visual Studio Code - Insiders"
		 */
		const currentIDEName = vscode.env.appName;
		const currentIDEUuid = availableIDEs.find(ide => ide.name === currentIDEName)?.uuid;

		/** 👇 從 globalState 中獲取已保存的值 / Retrieve saved values from globalState */
		const savedSearchHistory = this.globalState.get(EnumGlobalStateName.searchHistory, '');
		const savedSelectedSettings = this.globalState.get(EnumGlobalStateName.selectedSettings, []);
		const savedSelectedIDEs = this.globalState.get(EnumGlobalStateName.selectedIDEs, []);
		const savedSourceIDEUuid = this.globalState.get(EnumGlobalStateName.sourceIDEUuid, '');
		const backupIDEPath = this.globalState.get(EnumGlobalStateName.backupIDEPath, '') || '';

		/** 解析 webview script URI / Resolve webview script URI */
		const scriptUri = this.panel.webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'index.js'),
		);

		if (!scriptUri)
		{
			console.error('[SettingsSyncPanel] Failed to resolve webview script URI for dist/webview/index.js');
		}

		const props: IAppProps = {
			availableIDEs,
			unavailableIDEs,
			currentIDEName,
			sourceIDEUuid: savedSourceIDEUuid,
			backupIDEPath,
			languageConfig: this.languageConfig,
			supportedLanguages: getSupportedLanguages(),
			currentLanguage: this.currentLanguage,
			cssContent,
			cspSource: this.panel.webview.cspSource,
			webviewScriptUri: scriptUri?.toString() ?? '',
			initialState: {
				ideList: availableIDEs,
				currentLanguage: this.currentLanguage,
				languageConfig: this.languageConfig,
				currentIDEName,
				currentIDEUuid: currentIDEUuid ?? '',
				savedSearchHistory,
				savedSelectedSettings,
				savedSelectedIDEs,
				backupIDEPath,
				settingDescriptions: this.generateMultilingualDescriptions(),
			},
		};

		return renderJsxToString(App, props);
	}

	/**
	 * 生成多語言設定描述對象
	 * Generate multi-language setting descriptions object for WebView injection
	 *
	 * 遍歷所有設定鍵值，取得雙語描述（主要語言 + 次要語言）。
	 * Iterates through all setting keys and gets bilingual descriptions (primary + secondary).
	 *
	 * @returns 設定鍵到雙語描述的映射 / Map of setting keys to bilingual descriptions
	 */
	protected generateMultilingualDescriptions(): Record<string, { primary: string; secondary?: string }>
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

	/**
	 * 設定 Webview 訊息處理器（監聽來自 Webview 的訊息）
	 * Setup Webview message handler (listen for messages from Webview)
	 *
	 * 根據訊息命令執行對應操作：新增/移除 IDE、同步/刪除設定、重新整理等。
	 * Execute corresponding operations based on message command: add/remove IDE, sync/delete settings, refresh, etc.
	 */
	protected setupMessageHandler(): void
	{
		this.panel.webview.onDidReceiveMessage(
			async (message: IWebviewMessage) =>
			{
				console.log('[SettingsSyncPanel] Received message:', 'command', message.command, message);

				switch (message.command)
				{
					/**
					 * 彈出 VS Code 輸入框，讓使用者輸入自訂 IDE 路徑與名稱
					 *  Show VS Code input boxes for custom IDE path and name
					 */
					case EnumWebviewCommand.RequestAddCustomIDE: {
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
							this.postToWebview({ command: EnumHostCommand.AddCustomIDEComplete, success: true, name });
						}
						catch (error)
						{
							this.postToWebview({ command: EnumHostCommand.AddCustomIDEComplete, success: false, error: String(error instanceof Error ? error.message : error) });
						}
						break;
					}

					/**
					 * 直接新增自訂 IDE（含路徑與名稱，不彈出輸入框）
					 *  Add custom IDE directly with path and name (no input box)
					 */
					case EnumWebviewCommand.AddCustomIDE:
						try
						{
							await this.ideProvider.addCustomIDE(message.name, message.path);
							await this.updateWebview();
							this.postToWebview({ command: EnumHostCommand.AddCustomIDEComplete, success: true, name: message.name });
						}
						catch (error)
						{
							this.postToWebview({ command: EnumHostCommand.AddCustomIDEComplete, success: false, error: String(error instanceof Error ? error.message : error) });
						}
						break;

					/**
					 * 移除指定的自訂 IDE 項目（需使用者確認）
					 *  Remove the specified custom IDE entry (requires user confirmation)
					 */
					case EnumWebviewCommand.RemoveCustomIDE: {
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

					/**
					 * 設定內建備份 IDE 的路徑
					 *  Set the path of the built-in backup IDE
					 *  完成後使用 updateWebview 整頁重繪，讓備份 IDE 以新路徑重新偵測
					 *  Uses updateWebview (full redraw) after completion to re-detect the backup IDE at the new path
					 */
					case EnumWebviewCommand.SetBackupIDEPath:
						try
						{
							await this.ideProvider.setBackupIDEPath(message.backupPath);
							await this.updateWebview();
							this.postToWebview({ command: EnumHostCommand.BackupIDEPathUpdated, success: true });
						}
						catch (error)
						{
							this.postToWebview({
								command: EnumHostCommand.BackupIDEPathUpdated,
								success: false,
								error: String(error instanceof Error ? error.message : error),
							});
						}
						break;

/**
				 * 開啟資料夾選擇對話框以選取內建備份 IDE 的路徑，回傳所選路徑
				 *  Open a folder selection dialog to pick the built-in backup IDE path; return the selected path
				 */
				case EnumWebviewCommand.BrowseBackupPath: {
					/**
					 * 已設定 Backup IDE Path 時，資料夾選擇對話框從該路徑開始
					 * When a Backup IDE Path is configured, the folder picker starts from that path
					 *
					 * 若該路徑尚不存在，則退回其父資料夾；兩者皆不存在時不設定 defaultUri，
					 * 由作業系統使用上次記住的資料夾。
					 * If the configured path does not exist yet, fall back to its parent folder;
					 * if neither exists, leave defaultUri unset so the OS uses its last-remembered folder.
					 */
					let defaultUri: vscode.Uri | undefined;
					const configuredBackupPath = this.ideProvider.getBackupIDEPath();
					if (configuredBackupPath)
					{
						const startFolder = existsSync(configuredBackupPath) ? configuredBackupPath : dirname(configuredBackupPath);
						if (existsSync(startFolder))
						{
							defaultUri = vscode.Uri.file(startFolder);
						}
					}

					const backupPath = await vscode.window.showOpenDialog({
						canSelectFiles: false,
						canSelectFolders: true,
						canSelectMany: false,
						openLabel: 'Select Backup Folder',
						title: 'Select the folder where backup settings will be stored (settings.json is auto-created)',
						defaultUri,
					});
					if (backupPath && backupPath[0])
					{
						this.postToWebview({ command: EnumHostCommand.BackupPathSelected, path: backupPath[0].fsPath });
					}
					break;
				}

				/**
				 * 在 VS Code 編輯器中開啟指定 IDE 的 settings.json
				 *  Open the specified IDE's settings.json in the VS Code editor
				 */
				case EnumWebviewCommand.OpenSettingsJson:
						await this.openSettingsJsonFile(message.idePath, message.ideName);
						break;

					/**
					 * 將來源 IDE 的已選設定同步至目標 IDE 列表
					 *  Sync selected settings from the source IDE to the target IDE list
					 *  完成後使用 pushDataRefresh 推送最新資料（不整頁重繪）
					 *  Uses pushDataRefresh after completion (no full page redraw)
					 */
					case EnumWebviewCommand.SyncSettings:
						await this.performSync(
							message.sourceIDE !== undefined ? parseInt(message.sourceIDE) : NaN,
							message.targetIDEs,
							message.settings,
						);
						this.postToWebview({ command: EnumHostCommand.SyncComplete });
						await this.pushDataRefresh();
						break;

					/**
					 * 從指定 IDE 列表中刪除已選設定
					 *  Delete selected settings from the specified IDE list
					 *  完成後使用 pushDataRefresh 推送最新資料（不整頁重繪）
					 *  Uses pushDataRefresh after completion (no full page redraw)
					 */
					case EnumWebviewCommand.DeleteSettings:
						await this.performDelete(message.ideIndices, message.settings);
						this.postToWebview({ command: EnumHostCommand.DeleteComplete });
						await this.pushDataRefresh();
						break;

					/**
					 * 重新掃描系統中的 IDE 安裝（IDE 列表結構可能改變，觸發整頁重繪）
					 *  Re-scan IDE installations (IDE list structure may change, triggers full redraw)
					 */
					case EnumWebviewCommand.RefreshIDEs:
						await this.updateWebview(true);
						break;

					/**
					 * 重新讀取各 IDE 的設定值（IDE 列表結構不變，使用 pushDataRefresh 推送更新）
					 *  Reload setting values for each IDE (structure unchanged, uses pushDataRefresh)
					 */
					case EnumWebviewCommand.RefreshData:
						await this.pushDataRefresh();
						break;

					/**
					 * 變更 Webview 的主顯示語言
					 *  Change the primary display language of the Webview
					 */
					case EnumWebviewCommand.ChangePrimaryLanguage:
						if (message.language)
						{
							this.languageConfig.primary = message.language as EnumLanguageCode;
							this.currentLanguage = message.language as EnumLanguageCode;
						}
						break;

					/**
					 * 透過 VS Code 指令開啟語言設定面板
					 *  Open the language configuration panel via VS Code command
					 */
					case EnumWebviewCommand.OpenLanguageConfig:
						vscode.commands.executeCommand(EnumVscodeCommands.configLanguage);
						break;

					/**
					 * 在系統檔案總管中開啟指定的 IDE 資料夾
					 *  Reveal the specified IDE folder in the OS file explorer
					 */
					case EnumWebviewCommand.OpenIDEFolder:
						if (message.path)
						{
							vscode.commands.executeCommand(EnumVscodeCommands.revealFileInOS, vscode.Uri.file(message.path));
						}
						break;

					/**
					 * 將搜尋輸入框的當前值儲存至 globalState
					 *  Save the current search input value to globalState
					 */
					case EnumWebviewCommand.SaveSearchHistory:
						this.globalState.update(EnumGlobalStateName.searchHistory, message.searchText);
						break;

					/**
					 * 將已勾選的設定 key 列表儲存至 globalState
					 *  Save the list of checked setting keys to globalState
					 */
					case EnumWebviewCommand.SaveSelectedSettings:
						this.globalState.update(EnumGlobalStateName.selectedSettings, message.selectedSettings);
						break;

					/**
					 * 將已勾選的 IDE 索引列表儲存至 globalState
					 *  Save the list of checked IDE indices to globalState
					 */
					case EnumWebviewCommand.SaveSelectedIDEs:
						this.globalState.update(EnumGlobalStateName.selectedIDEs, message.selectedIDEs);
						break;

					/**
					 * 選取來源 IDE 並將其 UUID 持久化至 globalState
					 *  Select the source IDE and persist its UUID to globalState
					 */
					case EnumWebviewCommand.SelectSourceIDE:
						this.globalState.update(EnumGlobalStateName.sourceIDEUuid, message.uuid);
						break;

					/**
					 * 開啟資料夾選擇對話框以選取匯出路徑，回傳所選路徑
					 *  Open folder selection dialog for export path; return selected path
					 */
					case EnumWebviewCommand.BrowseExportPath: {
						const exportPath = await vscode.window.showOpenDialog({
							canSelectFiles: false,
							canSelectFolders: true,
							canSelectMany: false,
							openLabel: 'Select Export Folder',
							title: 'Select folder to save export file',
						});
						if (exportPath && exportPath[0])
						{
							this.postToWebview({ command: EnumHostCommand.ExportPathSelected, path: exportPath[0].fsPath });
						}
						break;
					}

					/**
					 * 開啟檔案選擇對話框以選取匯入檔案，回傳所選路徑
					 *  Open file selection dialog for import file; return selected path
					 */
					case EnumWebviewCommand.BrowseImportPath: {
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
							this.postToWebview({ command: EnumHostCommand.ImportPathSelected, path: importPath[0].fsPath });
						}
						break;
					}

					/**
					 * 匯出自訂 IDE 設定至 JSON 檔案
					 *  Export custom IDE configurations to a JSON file
					 */
					case EnumWebviewCommand.ExportCustomIDEs:
						try
						{
							await vscode.commands.executeCommand(EnumVscodeCommands.exportCustomIDEs);
							this.postToWebview({ command: EnumHostCommand.ExportComplete, success: true });
						}
						catch (error)
						{
							this.postToWebview({ command: EnumHostCommand.ExportComplete, success: false, error: String(error instanceof Error ? error.message : error) });
						}
						break;

					/**
					 * 匯出使用者已選取的設定 key 列表至 JSON 檔案
					 *  Export the user's selected setting key list to a JSON file
					 */
					case EnumWebviewCommand.ExportSelectedSettings:
						try
						{
							await vscode.commands.executeCommand(EnumVscodeCommands.exportSelectedSettings);
							this.postToWebview({ command: EnumHostCommand.ExportComplete, success: true });
						}
						catch (error)
						{
							this.postToWebview({ command: EnumHostCommand.ExportComplete, success: false, error: String(error instanceof Error ? error.message : error) });
						}
						break;

					/**
					 * 匯出所有設定（自訂 IDE + 已選設定）至 JSON 檔案
					 *  Export all settings (custom IDEs + selected settings) to a JSON file
					 */
					case EnumWebviewCommand.ExportAll:
						try
						{
							await vscode.commands.executeCommand(EnumVscodeCommands.exportAll);
							this.postToWebview({ command: EnumHostCommand.ExportComplete, success: true });
						}
						catch (error)
						{
							this.postToWebview({ command: EnumHostCommand.ExportComplete, success: false, error: String(error instanceof Error ? error.message : error) });
						}
						break;

					/**
					 * 從指定的 JSON 檔案匯入設定
					 *  Import settings from the specified JSON file
					 */
					case EnumWebviewCommand.Import:
						try
						{
							await vscode.commands.executeCommand(EnumVscodeCommands.import);
							this.postToWebview({ command: EnumHostCommand.ImportComplete, success: true });
						}
						catch (error)
						{
							this.postToWebview({ command: EnumHostCommand.ImportComplete, success: false, error: String(error instanceof Error ? error.message : error) });
						}
						break;
				}
			},
			undefined,
			this.disposables,
		);
	}

	/**
	 * 執行設定同步：將來源 IDE 的指定設定同步至目標 IDE 列表
	 * Perform settings sync: sync specified settings from source IDE to target IDE list
	 *
	 * 實際同步邏輯由 _performSyncCore 處理。
	 * Actual sync logic is handled by _performSyncCore.
	 *
	 * @param sourceIDEIndex - 來源 IDE 的索引 / Source IDE index
	 * @param targetIDEIndices - 目標 IDE 的索引列表 / Target IDE indices list
	 * @param settingKeys - 要同步的設定鍵列表 / Setting keys to sync
	 * @returns Promise<void>
	 */
	protected async performSync(
		sourceIDEIndex: number,
		targetIDEIndices: number[],
		settingKeys: string[],
	): Promise<void>
	{
		return _performSyncCore(this.ideProvider, sourceIDEIndex, targetIDEIndices, settingKeys);
	}

	/**
	 * 從指定的 IDE 列表中刪除指定的設定鍵
	 * Delete specified setting keys from the specified IDE list
	 *
	 * 遍歷所有設定鍵與 IDE 索引，逐一刪除設定值。
	 * Iterates through all setting keys and IDE indices, deleting setting values one by one.
	 *
	 * @param ideIndices - IDE 索引列表 / IDE indices list
	 * @param settingKeys - 要刪除的設定鍵列表 / Setting keys to delete
	 * @returns Promise<void>
	 */
	protected async performDelete(ideIndices: number[], settingKeys: string[]): Promise<void>
	{
		for (const settingKey of settingKeys)
		{
			for (const ideIndex of ideIndices)
			{
				await this.ideProvider.deleteSetting(ideIndex, settingKey);
			}
		}
	}

	/**
	 * 重新整理 Webview 內容（公開方法，供外部呼叫）
	 * Refresh Webview content (public method, called externally)
	 *
	 * 會重新掃描 IDE 列表並更新整個 HTML 內容。
	 * Will re-scan IDE list and update the entire HTML content.
	 */
	refreshData(): void
	{
		this.updateWebview();
	}

	/**
	 * 顯示並聚焦 Webview 面板
	 * Reveal and focus the Webview panel
	 */
	reveal(): void
	{
		this.panel.reveal();
	}

	/**
	 * 釋放 Webview 面板與相關資源
	 * Dispose the Webview panel and related resources
	 *
	 * 釋放面板本身以及所有註冊的可釋放資源。
	 * Disposes the panel itself and all registered disposable resources.
	 */
	dispose(): void
	{
		this.panel.dispose();
		this.disposables.forEach((d) => d.dispose());
	}

	/**
	 * 註冊面板釋放時的回調函數
	 * Register callback function when panel is disposed
	 *
	 * @param callback - 釋放時執行的回調 / Callback to execute on dispose
	 */
	onDispose(callback: () => void): void
	{
		this.onDisposeCallback = callback;
	}

	/**
	 * 同步已選取的設定（預留方法，實際由 Webview 訊息處理器處理）
	 * Sync selected settings (placeholder method, actually handled by Webview message handler)
	 *
	 * 當使用者點擊同步按鈕時，擴充會呼叫此方法（但實際同步由訊息處理器完成）。
	 * When user clicks sync button, extension calls this (but actual sync is done by message handler).
	 */
	async syncSelectedSettings(): Promise<void>
	{
		/**
		 * 當使用者點擊同步時，擴充會呼叫此方法
		 * This would be called by the extension when user clicks sync
		 *
		 * 實際的同步邏輯由 WebView 訊息處理器處理。
		 * The actual sync is handled by the WebView message handler
		 */
	}

	/**
	 * 開啟指定 IDE 的 settings.json 檔案
	 * Open settings.json file for the specified IDE
	 *
	 * 嘗試多個可能的 settings.json 路徑，找到後在 VS Code 編輯器中開啟。
	 * Try multiple possible settings.json paths, open in VS Code editor when found.
	 *
	 * @param idePath - IDE 的路徑 / The IDE path
	 * @param ideName - IDE 的名稱 / The IDE name
	 * @returns Promise<void>
	 */
	protected async openSettingsJsonFile(idePath: string, ideName: string): Promise<void>
	{
		try
		{
			const path = require('path') as typeof import('path');
			const fs = require('fs') as typeof import('fs');

			/**
			 * Try multiple possible settings.json paths
			 */
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

			/** Open the settings.json file in VS Code editor */
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
