/**
 * 匯出匯入核心功能
 * Export/Import Core Functionality
 *
 * 獨立於 VSCode 的核心匯出匯入邏輯，便於測試和重用
 * Core export/import logic independent of VSCode for testing and reusability
 */

import { EnumShowMessageType } from '../../webview/src/types';
import {
	ExportImportType,
	IExportImportData,
	ICustomIDEExport,
	ISelectedSettingExport,
	IImportOptions,
	IImportResult,
	EnumGlobalStateName,
} from '../types';

export interface IStorageProvider
{
	get<T>(key: string, defaultValue?: T): T;

	update(key: string, value: any): Promise<void>;
}

export interface IFileSystemProvider
{
	readFile(path: string): Promise<string>;

	writeFile(path: string, content: string): Promise<void>;
}

export interface IDialogProvider
{
	showSaveDialog(options: any): Promise<string | undefined>;

	showOpenDialog(options: any): Promise<string[] | undefined>;

	showQuickPick(items: any[], options: any): Promise<any[] | undefined>;

	showMessage(message: string, type: EnumShowMessageType): Promise<void>;
}

export class ExportImportCore
{
	private readonly VERSION = '1.0.0';
	private storageProvider: IStorageProvider;
	private fileSystemProvider: IFileSystemProvider;
	private dialogProvider: IDialogProvider;

	constructor(
		storageProvider: IStorageProvider,
		fileSystemProvider: IFileSystemProvider,
		dialogProvider: IDialogProvider,
	)
	{
		this.storageProvider = storageProvider;
		this.fileSystemProvider = fileSystemProvider;
		this.dialogProvider = dialogProvider;
	}

	/**
	 * 匯出自訂 IDE 清單
	 * Export custom IDEs list
	 */
	async exportCustomIDEs(): Promise<string>
	{
		const customIDEs = this.storageProvider.get<Array<{ name: string; path: string }>>(
			EnumGlobalStateName.customIDEs,
			[],
		);

		const exportData: IExportImportData = {
			version: this.VERSION,
			exportedAt: new Date().toISOString(),
			exportedBy: 'IDE Settings Sync',
			type: ExportImportType.customIDEs,
			customIDEs: customIDEs.map(ide => ({
				name: ide.name,
				path: ide.path,
				exportedAt: new Date().toISOString(),
				detected: false,
			})),
			metadata: {
				totalCustomIDEs: customIDEs.length,
				totalSelectedSettings: 0,
				knownIDEsExcluded: [], // Will be populated by caller
			},
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * 匯出選擇的設定清單
	 * Export selected settings list
	 */
	async exportSelectedSettings(): Promise<string>
	{
		const selectedSettings = this.storageProvider.get<Record<string, boolean>>(
			EnumGlobalStateName.selectedSettings,
			{},
		);

		const exportSettings: ISelectedSettingExport[] = Object.entries(selectedSettings)
			.filter(([_, selected]) => selected)
			.map(([key, _]) => ({
				key,
				display: this.getSettingDisplay(key),
				description: this.getSettingDescription(key),
				values: {},
				exportedAt: new Date().toISOString(),
			}));

		const exportData: IExportImportData = {
			version: this.VERSION,
			exportedAt: new Date().toISOString(),
			exportedBy: 'IDE Settings Sync',
			type: ExportImportType.selectedSettings,
			selectedSettings: exportSettings,
			metadata: {
				totalCustomIDEs: 0,
				totalSelectedSettings: exportSettings.length,
				knownIDEsExcluded: [], // Will be populated by caller
			},
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * 匯出自訂 IDE 和選擇設定
	 * Export both custom IDEs and selected settings
	 */
	async exportAll(): Promise<string>
	{
		const customIDEs = this.storageProvider.get<Array<{ name: string; path: string }>>(
			EnumGlobalStateName.customIDEs,
			[],
		);

		const selectedSettings = this.storageProvider.get<Record<string, boolean>>(
			EnumGlobalStateName.selectedSettings,
			{},
		);

		const exportSettings: ISelectedSettingExport[] = Object.entries(selectedSettings)
			.filter(([_, selected]) => selected)
			.map(([key, _]) => ({
				key,
				display: this.getSettingDisplay(key),
				description: this.getSettingDescription(key),
				values: {},
				exportedAt: new Date().toISOString(),
			}));

		const exportData: IExportImportData = {
			version: this.VERSION,
			exportedAt: new Date().toISOString(),
			exportedBy: 'IDE Settings Sync',
			type: ExportImportType.both,
			customIDEs: customIDEs.map(ide => ({
				name: ide.name,
				path: ide.path,
				exportedAt: new Date().toISOString(),
				detected: false,
			})),
			selectedSettings: exportSettings,
			metadata: {
				totalCustomIDEs: customIDEs.length,
				totalSelectedSettings: exportSettings.length,
				knownIDEsExcluded: [], // Will be populated by caller
			},
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * 匯入設定
	 * Import settings
	 */
	async importData(jsonData: string, options: IImportOptions): Promise<IImportResult>
	{
		const result: IImportResult = {
			success: true,
			importedCustomIDEs: 0,
			importedSelectedSettings: 0,
			skippedCustomIDEs: 0,
			skippedSelectedSettings: 0,
			errors: [],
			warnings: [],
		};

		try
		{
			const data: IExportImportData = JSON.parse(jsonData);

			if (!this.isVersionCompatible(data.version))
			{
				result.success = false;
				result.errors.push(`不支援的版本: ${data.version}`);
				return result;
			}

			if (options.includeCustomIDEs && data.customIDEs)
			{
				await this.importCustomIDEs(data.customIDEs, options, result);
			}

			if (options.includeSelectedSettings && data.selectedSettings)
			{
				await this.importSelectedSettings(data.selectedSettings, options, result);
			}
		}
		catch (error)
		{
			result.success = false;
			result.errors.push(`匯入失敗: ${error instanceof Error ? error.message : String(error)}`);
		}

		return result;
	}

	/**
	 * 匯入自訂 IDE
	 * Import custom IDEs
	 */
	private async importCustomIDEs(
		customIDEs: ICustomIDEExport[],
		options: IImportOptions,
		result: IImportResult,
	): Promise<void>
	{
		const existingCustomIDEs = this.storageProvider.get<Array<{ name: string; path: string }>>(
			EnumGlobalStateName.customIDEs,
			[],
		);

		const existingNames = new Set(existingCustomIDEs.map(ide => ide.name));
		const knownIDENames = new Set(options.knownIDEsExcluded || []);

		for (const customIDE of customIDEs)
		{
			if (options.excludeKnownIDEs && knownIDENames.has(customIDE.name))
			{
				result.skippedCustomIDEs++;
				result.warnings.push(`跳過已知 IDE: ${customIDE.name}`);
				continue;
			}

			if (existingNames.has(customIDE.name) && !options.overwriteExisting)
			{
				result.skippedCustomIDEs++;
				result.warnings.push(`跳過已存在的自訂 IDE: ${customIDE.name}`);
				continue;
			}

			const updatedCustomIDEs = existingCustomIDEs.filter(ide => ide.name !== customIDE.name);
			updatedCustomIDEs.push({
				name: customIDE.name,
				path: customIDE.path,
			});

			await this.storageProvider.update(EnumGlobalStateName.customIDEs, updatedCustomIDEs);
			result.importedCustomIDEs++;
		}
	}

	/**
	 * 匯入選擇的設定
	 * Import selected settings
	 */
	private async importSelectedSettings(
		selectedSettings: ISelectedSettingExport[],
		options: IImportOptions,
		result: IImportResult,
	): Promise<void>
	{
		const existingSelectedSettings = this.storageProvider.get<Record<string, boolean>>(
			EnumGlobalStateName.selectedSettings,
			{},
		);

		const settingsToImport = options.selectedSettingKeys
			? selectedSettings.filter(setting => options.selectedSettingKeys!.includes(setting.key))
			: selectedSettings;

		for (const setting of settingsToImport)
		{
			if (existingSelectedSettings[setting.key] !== undefined && !options.overwriteExisting)
			{
				result.skippedSelectedSettings++;
				result.warnings.push(`跳過已存在的設定: ${setting.key}`);
				continue;
			}

			existingSelectedSettings[setting.key] = true;
			result.importedSelectedSettings++;
		}

		await this.storageProvider.update(EnumGlobalStateName.selectedSettings, existingSelectedSettings);
	}

	/**
	 * 檢查版本相容性
	 * Check version compatibility
	 */
	private isVersionCompatible(version: string): boolean
	{
		const supportedVersions = ['1.0.0'];
		return supportedVersions.includes(version);
	}

	/**
	 * 取得設定顯示名稱
	 * Get setting display name
	 */
	private getSettingDisplay(key: string): string
	{
		return key.split('.').map(part =>
			part.charAt(0).toUpperCase() + part.slice(1),
		).join(' ');
	}

	/**
	 * 取得設定描述
	 * Get setting description
	 */
	private getSettingDescription(key: string): string
	{
		return `Setting for ${key}`;
	}

	/**
	 * 儲存匯出檔案
	 * Save export file
	 */
	async saveExportFile(content: string, defaultName: string): Promise<string | undefined>
	{
		const path = await this.dialogProvider.showSaveDialog({
			defaultName,
			filters: {
				'JSON Files': ['json'],
				'All Files': ['*'],
			},
		});

		if (path)
		{
			try
			{
				await this.fileSystemProvider.writeFile(path, content);
				await this.dialogProvider.showMessage(`匯出成功: ${path}`, EnumShowMessageType.INFO);
				return path;
			}
			catch (error)
			{
				await this.dialogProvider.showMessage(`儲存失敗: ${error instanceof Error
					? error.message
					: String(error)}`, EnumShowMessageType.ERROR);
			}
		}

		return undefined;
	}

	/**
	 * 讀取匯入檔案
	 * Read import file
	 */
	async readImportFile(): Promise<string | undefined>
	{
		const paths = await this.dialogProvider.showOpenDialog({
			canSelectMany: false,
			filters: {
				'JSON Files': ['json'],
				'All Files': ['*'],
			},
		});

		if (paths && paths[0])
		{
			try
			{
				const content = await this.fileSystemProvider.readFile(paths[0]);
				return content;
			}
			catch (error)
			{
				await this.dialogProvider.showMessage(`讀取失敗: ${error instanceof Error
					? error.message
					: String(error)}`, EnumShowMessageType.ERROR);
			}
		}

		return undefined;
	}

	/**
	 * 顯示匯入選項對話框
	 * Show import options dialog
	 */
	async showImportOptionsDialog(data: IExportImportData): Promise<IImportOptions | undefined>
	{
		const options: any[] = [];

		if (data.customIDEs && data.customIDEs.length > 0)
		{
			options.push({
				label: '📁 匯入自訂 IDE',
				description: `匯入 ${data.customIDEs.length} 個自訂 IDE`,
				picked: true,
			});
		}

		if (data.selectedSettings && data.selectedSettings.length > 0)
		{
			options.push({
				label: '⚙️ 匯入選擇的設定',
				description: `匯入 ${data.selectedSettings.length} 個選擇的設定`,
				picked: true,
			});
		}

		if (options.length === 0)
		{
			await this.dialogProvider.showMessage('匯入檔案中沒有可匯入的資料', EnumShowMessageType.WARNING);
			return undefined;
		}

		const selectedOptions = await this.dialogProvider.showQuickPick(options, {
			placeHolder: '選擇要匯入的項目',
			canPickMany: true,
		});

		if (!selectedOptions || selectedOptions.length === 0)
		{
			return undefined;
		}

		const includeCustomIDEs = selectedOptions.some(option =>
			option.label.includes('自訂 IDE'),
		);
		const includeSelectedSettings = selectedOptions.some(option =>
			option.label.includes('選擇的設定'),
		);

		const advancedOptions = await this.dialogProvider.showQuickPick([
			{
				label: '✅ 排除內建 IDE',
				description: '自動排除已知的內建 IDE',
				picked: true,
			},
			{
				label: '🔄 覆蓋現有設定',
				description: '覆蓋已存在的自訂 IDE 和設定',
				picked: false,
			},
		], {
			placeHolder: '選擇進階選項',
			canPickMany: true,
		});

		const excludeKnownIDEs = advancedOptions?.some(option =>
			option.label.includes('排除內建 IDE'),
		) ?? true;
		const overwriteExisting = advancedOptions?.some(option =>
			option.label.includes('覆蓋現有設定'),
		) ?? false;

		let selectedSettingKeys: string[] | undefined;
		if (includeSelectedSettings && data.selectedSettings)
		{
			selectedSettingKeys = await this.showSettingSelectionDialog(data.selectedSettings);
		}

		return {
			includeCustomIDEs,
			includeSelectedSettings,
			excludeKnownIDEs,
			selectedSettingKeys,
			overwriteExisting,
			knownIDEsExcluded: data.metadata?.knownIDEsExcluded || [],
		};
	}

	/**
	 * 顯示設定選擇對話框
	 * Show setting selection dialog
	 */
	private async showSettingSelectionDialog(
		settings: ISelectedSettingExport[],
	): Promise<string[] | undefined>
	{
		const quickPickItems: any[] = settings.map(setting => ({
			label: setting.key,
			description: setting.display,
			detail: setting.description,
			picked: true,
		}));

		const allButton = { label: '✅ 全選', description: '選擇所有設定' };
		const noneButton = { label: '❌ 取消選取', description: '取消選擇所有設定' };
		const invertButton = { label: '🔄 反選', description: '反轉選擇' };

		const selectedItems = await this.dialogProvider.showQuickPick(
			[allButton, noneButton, invertButton, ...quickPickItems],
			{
				placeHolder: '選擇要匯入的設定 (可使用搜尋過濾)',
				canPickMany: true,
				matchOnDescription: true,
				matchOnDetail: true,
			},
		);

		if (!selectedItems)
		{
			return undefined;
		}

		if (selectedItems.includes(allButton))
		{
			return settings.map(s => s.key);
		}
		else if (selectedItems.includes(noneButton))
		{
			return [];
		}
		else if (selectedItems.includes(invertButton))
		{
			return settings.filter(s => !selectedItems.some(item => item.label === s.key)).map(s => s.key);
		}

		return selectedItems
			.filter(item => !item.label.includes('全選') && !item.label.includes('取消選取') && !item.label.includes('反選'))
			.map(item => item.label);
	}
}
