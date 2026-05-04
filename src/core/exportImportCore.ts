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

/**
 * @deprecated 已棄用：此邏輯不再使用，僅保留供參考
 * @deprecated Deprecated: This logic is no longer in use, kept only for reference.
 *
 * 儲存提供者介面：定義全域狀態儲存的讀寫操作
 * Storage provider interface: defines read/write operations for global state storage
 */
export interface IStorageProvider
{
	/**
	 * 從儲存中取得指定鍵的值，若不存在則回傳預設值
	 * Get value from storage by key, return default if not exists
	 */
	get<T>(key: string, defaultValue?: T): T;

	/**
	 * 更新儲存中指定鍵的值
	 * Update value in storage for the given key
	 */
	update(key: string, value: any): Promise<void>;
}

/**
 * @deprecated 已棄用：此邏輯不再使用，僅保留供參考
 * @deprecated Deprecated: This logic is no longer in use, kept only for reference.
 *
 * 檔案系統提供者介面：定義檔案讀寫操作
 * File system provider interface: defines file read/write operations
 */
export interface IFileSystemProvider
{
	/**
	 * 非同步讀取指定路徑的檔案內容
	 * Asynchronously read file content from given path
	 */
	readFile(path: string): Promise<string>;

	/**
	 * 非同步將內容寫入指定路徑的檔案
	 * Asynchronously write content to file at given path
	 */
	writeFile(path: string, content: string): Promise<void>;
}

/**
 * @deprecated 已棄用：此邏輯不再使用，僅保留供參考
 * @deprecated Deprecated: This logic is no longer in use, kept only for reference.
 * 
 * 對話框提供者介面：定義使用者互動對話框的操作
 * Dialog provider interface: defines user interaction dialog operations
 */
export interface IDialogProvider
{
	/**
	 * 顯示儲存檔案對話框，讓使用者選擇儲存位置
	 * Show save file dialog for user to choose save location
	 */
	showSaveDialog(options: any): Promise<string | undefined>;

	/**
	 * 顯示開啟檔案對話框，讓使用者選擇要匯入的檔案
	 * Show open file dialog for user to choose import file
	 */
	showOpenDialog(options: any): Promise<string[] | undefined>;

	/**
	 * 顯示快速選擇對話框，讓使用者選擇設定項目
	 * Show quick pick dialog for user to select setting items
	 */
	showQuickPick(items: any[], options: any): Promise<any[] | undefined>;

	/**
	 * 顯示訊息提示，根據類型顯示不同樣式
	 * Show message notification with different styles based on type
	 */
	showMessage(message: string, type: EnumShowMessageType): Promise<void>;
}

/**
 * @deprecated 已棄用：此邏輯不再使用，僅保留供參考
 * @deprecated Deprecated: This logic is no longer in use, kept only for reference.
 *
 * 匯出匯入核心類別
 * Export/Import Core class
 *
 * 獨立於 VSCode 的核心匯出匯入邏輯，便於測試和重用
 * Core export/import logic independent of VSCode for testing and reusability
 */
export class ExportImportCore
{
	/**
	 * 匯出匯入資料版本號
	 * Export/import data version number
	 *
	 * 用於版本相容性檢查，確保匯入的資料格式可被當前系統解析
	 * Used for version compatibility check to ensure imported data format is parseable by current system
	 */
	private readonly VERSION = '1.0.0';

	/**
	 * 儲存體提供者實例
	 * Storage provider instance
	 *
	 * 用於存取全域狀態（如自訂 IDE 清單、選擇的設定等）
	 * Used to access global state (e.g., custom IDE list, selected settings)
	 */
	private storageProvider: IStorageProvider;

	/**
	 * 檔案系統提供者實例
	 * File system provider instance
	 *
	 * 用於讀寫匯出匯入的 JSON 檔案
	 * Used to read/write export/import JSON files
	 */
	private fileSystemProvider: IFileSystemProvider;

	/**
	 * 對話框提供者實例
	 * Dialog provider instance
	 *
	 * 用於顯示保存、開啟檔案對話框與快速選擇對話框
	 * Used to show save/open file dialogs and quick pick dialogs
	 */
	private dialogProvider: IDialogProvider;

		/**
	 * 建構子：初始化核心服務並注入依賴提供者
	 * Constructor: initializes core service and injects dependency providers
	 *
	 * @param storageProvider - 儲存體提供者，用於存取全域狀態 / Storage provider for accessing global state
	 * @param fileSystemProvider - 檔案系統提供者，用於讀寫檔案 / File system provider for read/write operations
	 * @param dialogProvider - 對話框提供者，用於顯示使用者介面 / Dialog provider for UI interactions
	 */
	constructor(
		/** 儲存體提供者 / Storage provider */
		storageProvider: IStorageProvider,
		/** 檔案系統提供者 / File system provider */
		fileSystemProvider: IFileSystemProvider,
		/** 對話框提供者 / Dialog provider */
		dialogProvider: IDialogProvider,
	)
	{
		/** 初始化儲存體提供者 / Initialize storage provider */
		this.storageProvider = storageProvider;
		/** 初始化檔案系統提供者 / Initialize file system provider */
		this.fileSystemProvider = fileSystemProvider;
		/** 初始化對話框提供者 / Initialize dialog provider */
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
