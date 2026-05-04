/**
 * 匯出匯入服務
 * Export/Import Service
 *
 * 處理 CustomIDEs 和選擇設定的匯出匯入功能
 * Handles export/import functionality for CustomIDEs and selected settings
 */

/**
 * VSCode API 模組：提供編輯器相關功能（視窗、工作區、URI 等）
 * VSCode API module: provides editor-related functionality (window, workspace, URI, etc.)
 */
import * as vscode from 'vscode';
/** Node.js 路徑處理模組：用於處理檔案路徑的拼接與解析 / Node.js path module: used for joining and resolving file paths */
import * as path from 'path';
/** Node.js 檔案系統模組：用於同步讀寫檔案操作 / Node.js file system module: used for synchronous file read/write operations */
import * as fs from 'fs';
/** 匯入共用型別定義：匯出匯入相關的介面與列舉 / Import shared type definitions: interfaces and enums related to export/import */
import {
	ExportImportType,
	IExportImportData,
	ICustomIDEExport,
	ISelectedSettingExport,
	IImportOptions,
	IImportResult,
	EnumGlobalStateName,
} from '../types';
/** 匯入已知 IDE 清單：內建支援的 IDE 資料，用於過濾排除 / Import known IDE list: built-in supported IDE data, used for filtering/exclusion */
import { knownIDEs } from '../data/knownIDEs';
/** 匯入全域狀態管理抽象類別：提供 VSCode 上下文與全域狀態存取的基底類別 / Import global state management abstract classes: base classes providing VSCode context and global state access */
import { AbstractClassWithContextGlobalState, AbstractClassWithGlobalState, VscodeExtensionContextGlobalState } from '../providers/vscode/globalState';

/**
 * 匯出匯入服務類別
 * Export/Import Service class
 *
 * 繼承自 AbstractClassWithContextGlobalState，提供 VSCode 上下文與全域狀態管理
 * Inherits from AbstractClassWithContextGlobalState, provides VSCode context and global state management
 */
export class ExportImportService extends AbstractClassWithContextGlobalState
{
	/** VSCode 擴充上下文：用於存取擴充的儲存空間與環境 / VSCode extension context: used to access extension storage and environment */
	protected context: vscode.ExtensionContext;
	/** 匯出資料版本號：用於版本相容性檢查 / Export data version number: used for version compatibility checking */
	protected readonly VERSION = '1.0.0';

	/**
	 * 建構子：初始化服務並設定 VSCode 上下文
	 * Constructor: initializes the service and sets up VSCode context
	 *
	 * @param context - VSCode 擴充上下文 / VSCode extension context
	 */
	constructor(context: vscode.ExtensionContext)
	{
		/** 呼叫父類別建構子以初始化全域狀態功能 / Call parent constructor to initialize global state functionality */
		super();
		/** 儲存 VSCode 上下文以供後續使用 / Store VSCode context for later use */
		this.context = context;
	}

	/**
	 * 匯出自訂 IDE 清單
	 * Export custom IDEs list
	 */
	async exportCustomIDEs(): Promise<string>
	{
		/** 從全域狀態取得自訂 IDE 清單，若無則預設為空陣列 / Retrieve custom IDE list from global state, default to empty array if not exists */
		const customIDEs = this.globalState.get(
			EnumGlobalStateName.customIDEs,
			[],
		);

		/** 建構匯出資料結構，包含版本、時間戳記、匯出來源與類型 / Construct export data structure with version, timestamp, export source and type */
		const exportData: IExportImportData = {
			version: this.VERSION,
			exportedAt: new Date().toISOString(),
			exportedBy: 'VSCode IDE Settings Sync',
			type: ExportImportType.customIDEs,
			/** 將自訂 IDE 清單轉換為匯出格式，並標記為未偵測 / Convert custom IDE list to export format, mark as undetected */
			customIDEs: customIDEs.map(ide => ({
				name: ide.name,
				path: ide.path,
				exportedAt: new Date().toISOString(),
				/** 將在匯入時更新 / Will be updated during import */
				detected: false,
			})),
			/** 中繼資料：記錄匯出時的統計資訊 / Metadata: record statistics at export time */
			metadata: {
				totalCustomIDEs: customIDEs.length,
				totalSelectedSettings: 0,
				/** 排除已知 IDE 名稱，避免重複匯入 / Exclude known IDE names to avoid duplicate import */
				knownIDEsExcluded: knownIDEs.map(ide => ide.name),
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
		const selectedSettings = this.globalState.get(
			EnumGlobalStateName.selectedSettings,
			[],
		);

		/** 除錯用：輸出選擇的設定清單到控制台以便檢查 / Debug: output selected settings list to console for inspection */
		console.dir(selectedSettings, { depth: null });

		/** 將選擇的設定轉換為匯出格式 / Convert selected settings to export format */
		const exportSettings: ISelectedSettingExport[] = selectedSettings
			.map((key) => ({
				key,
				display: this.getSettingDisplay(key),
				description: this.getSettingDescription(key),
				/**
				 * 匯出時暫時留空，實際值將在匯入時填充
				 * Will be populated with actual values during export
				 */
				values: {},
			}));

		const exportData: IExportImportData = {
			version: this.VERSION,
			exportedAt: new Date().toISOString(),
			exportedBy: 'VSCode IDE Settings Sync',
			type: ExportImportType.selectedSettings,
			selectedSettings: exportSettings,
			metadata: {
				totalCustomIDEs: 0,
				totalSelectedSettings: exportSettings.length,
				knownIDEsExcluded: knownIDEs.map(ide => ide.name),
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
		const customIDEs = this.globalState.get(
			EnumGlobalStateName.customIDEs,
			[],
		);

		const selectedSettings = this.globalState.get(
			EnumGlobalStateName.selectedSettings,
			[],
		);

		/**
		 * 將選擇的設定物件轉換為匯出格式：過濾出被選中的設定（value 為 true），再映射為匯出結構
		 * Convert selected settings object to export format: filter selected settings (value true), then map to export structure
		 *
		 * 1. Object.entries 將物件轉為 [key, value] 陣列
		 * 2. filter 保留 value 為 true 的項目（即被選中的設定）
		 * 3. map 轉換為 ISelectedSettingExport 格式，包含顯示名、描述和匯出時間戳記
		 */
		const exportSettings: ISelectedSettingExport[] = Object.entries(selectedSettings)
			.filter(([_, selected]) => selected)
			.map(([key, _]) => ({
				key,
				display: this.getSettingDisplay(key),
				description: this.getSettingDescription(key),
				/** 匯出時暫時留空，實際值將在匯入時填充 / Will be populated with actual values during import */
				values: {},
				/** 匯出時間戳記，記錄設定匯出的時間點 / Export timestamp to record export time */
				exportedAt: new Date().toISOString(),
			}));

		/**
		 * 建構完整匯出資料結構，包含自訂 IDE 和選擇的設定
		 * Construct complete export data structure with custom IDEs and selected settings
		 *
		 * 同時匯出自訂 IDE 和選擇的設定，提供完整的匯出封裝
		 * Export both custom IDEs and selected settings in one unified package
		 */
		const exportData: IExportImportData = {
			version: this.VERSION,
			/** 匯出時間戳記，記錄整體匯出的時間點 / Export timestamp to record overall export time */
			exportedAt: new Date().toISOString(),
			exportedBy: 'VSCode IDE Settings Sync',
			type: ExportImportType.both,
			/**
			 * 將自訂 IDE 清單轉換為匯出格式，標記為未偵測
			 * Convert custom IDE list to export format, mark as undetected
			 */
			customIDEs: customIDEs.map(ide => ({
				name: ide.name,
				path: ide.path,
				/** 匯出時間戳記 / Export timestamp */
				exportedAt: new Date().toISOString(),
				/** 匯入時將更新此欄位 / This field will be updated during import */
				detected: false,
			})),
			selectedSettings: exportSettings,
			/**
			 * 中繼資料：記錄匯出時的統計資訊
			 * Metadata: record statistics at export time
			 */
			metadata: {
				totalCustomIDEs: customIDEs.length,
				totalSelectedSettings: exportSettings.length,
				/** 排除已知 IDE 名稱，避免重複匯入 / Exclude known IDE names to avoid duplicate import */
				knownIDEsExcluded: knownIDEs.map(ide => ide.name),
			},
		};

		/**
		 * 將資料序列化為格式化的 JSON 字串，便於閱讀和儲存
		 * Serialize data to formatted JSON string for readability and storage
		 */
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

			/**
			 * 驗證版本相容性：檢查匯入資料版本是否受支援
			 * Validate version compatibility: check if import data version is supported
			 */
			if (!this.isVersionCompatible(data.version))
			{
				result.success = false;
				result.errors.push(`不支援的版本: ${data.version}`);
				return result;
			}

			/**
			 * 匯入自訂 IDE：若選項允許且資料中存在自訂 IDE，則執行匯入
			 * Import custom IDEs: if option enabled and data contains custom IDEs, proceed with import
			 */
			if (options.includeCustomIDEs && data.customIDEs)
			{
				await this.importCustomIDEs(data.customIDEs, options, result);
			}

			/**
			 * 匯入選取的設定：若選項允許且資料中存在選取設定，則執行匯入
			 * Import selected settings: if option enabled and data contains selected settings, proceed with import
			 */
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
		/**
		 * 從全域狀態取得現有的自訂 IDE 清單，若無則預設為空陣列
		 * Retrieve existing custom IDE list from global state, default to empty array if not exists
		 */
		const existingCustomIDEs = this.globalState.get(
			EnumGlobalStateName.customIDEs,
			[],
		);

		/**
		 * 建立名稱集合以便快速查詢重複項目
		 * Create name sets for fast duplicate checking
		 *
		 * - existingNames：現有自訂 IDE 的名稱集合
		 * - knownIDENames：內建已知 IDE 的名稱集合（用於排除）
		 */
		const existingNames = new Set(existingCustomIDEs.map(ide => ide.name));
		const knownIDENames = new Set(knownIDEs.map(ide => ide.name as string));

		/**
		 * 迭代處理每個待匯入的自訂 IDE
		 * Iterate through each custom IDE to be imported
		 */
		for (const customIDE of customIDEs)
		{
			/**
			 * 排除已知 IDE：若啟用排除選項且該 IDE 名稱存在於已知清單中，則跳過
			 * Skip known IDEs: if exclude option enabled and IDE name exists in known list, skip it
			 */
			if (options.excludeKnownIDEs && knownIDENames.has(customIDE.name))
			{
				result.skippedCustomIDEs++;
				result.warnings.push(`跳過已知 IDE: ${customIDE.name}`);
				continue;
			}

			/**
			 * 跳過已存在的項目：若 IDE 名稱已存在且未啟用覆寫選項，則跳過避免重複
			 * Skip if already exists: if IDE name already exists and overwrite option is disabled, skip to avoid duplicates
			 */
			if (existingNames.has(customIDE.name) && !options.overwriteExisting)
			{
				result.skippedCustomIDEs++;
				result.warnings.push(`跳過已存在的自訂 IDE: ${customIDE.name}`);
				continue;
			}

			/**
			 * 新增或更新自訂 IDE：先過濾掉同名稱的舊項目，再加入新的 IDE 資料
			 * Add or update custom IDE: first filter out old entry with same name, then add new IDE data
			 */
			const updatedCustomIDEs = existingCustomIDEs.filter(ide => ide.name !== customIDE.name);
			updatedCustomIDEs.push({
				name: customIDE.name,
				path: customIDE.path,
			});

			await this.globalState.update(EnumGlobalStateName.customIDEs, updatedCustomIDEs);
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
		/**
		 * 未實作功能：此函式需要實作或修復後才能使用
		 * Unimplemented feature: this function requires implementation or fix before it can be used.
		 */
		throw new Error("Unimplemented feature: this function requires implementation or fix before it can be used.");

		/**
		 * 從全域狀態取得現有的選取設定清單，若無則預設為空物件
		 * Retrieve existing selected settings from global state, default to empty object if not exists
		 */
		const existingSelectedSettings = this.globalState.get(
			EnumGlobalStateName.selectedSettings,
			[],
		);

		/**
		 * 根據提供的選取鍵值過濾設定：若有指定鍵值則只匯入指定的設定
		 * Filter settings based on selected keys: if keys provided, only import specified settings
		 */
		const settingsToImport = options.selectedSettingKeys
			? selectedSettings.filter(setting => options.selectedSettingKeys!.includes(setting.key))
			: selectedSettings;

		/**
			 * 迭代處理每個待匯入的選取設定
			 * Iterate through each selected setting to be imported
			 */
			for (const setting of settingsToImport)
		{
			/**
			 * 跳過已存在的設定：若設定已存在且未啟用覆寫選項，則跳過避免重複
			 * Skip if already exists: if setting already exists and overwrite option is disabled, skip to avoid duplicates
			 *
			 * @FIXME: 此處 existingSelectedSettings 應為物件格式，檢查邏輯需確認
			 * @FIXME: existingSelectedSettings should be an object; check logic needs verification
			 */
			// @ts-expect-error
			if (existingSelectedSettings[setting.key] !== undefined && !options.overwriteExisting)
			{
				result.skippedSelectedSettings++;
				result.warnings.push(`跳過已存在的設定: ${setting.key}`);
				continue;
			}

			/**
			 * 新增或更新選取的設定：將設定標記為已選取（值為 true）
			 * Add or update selected setting: mark setting as selected (value = true)
			 *
			 * @FIXME: 此處應確認 existingSelectedSettings 的資料結構是否為 key-value 物件
			 * @FIXME: verify if existingSelectedSettings data structure is key-value object
			 */
			// @ts-expect-error
			existingSelectedSettings[setting.key] = true;
			result.importedSelectedSettings++;
		}

		await this.globalState.update(EnumGlobalStateName.selectedSettings, existingSelectedSettings);
	}

	/**
	 * 檢查版本相容性
	 * Check version compatibility
	 */
	private isVersionCompatible(version: string): boolean
	{
		// Simple version check - in real implementation, might be more complex
		const supportedVersions = ['1.0.0'];
		return supportedVersions.includes(version);
	}

	/**
	 * 取得設定顯示名稱
	 * Get setting display name
	 */
	private getSettingDisplay(key: string): string
	{
		// This would be implemented based on actual setting definitions
		// For now, return the key as display name
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
		// This would be implemented based on actual setting definitions
		// For now, return a generic description
		return `Setting for ${key}`;
	}

	/**
	 * 顯示匯入選項對話框
	 * Show import options dialog
	 */
	async showImportOptionsDialog(data: IExportImportData): Promise<IImportOptions | undefined>
	{
		/**
		 * 匯入選項清單：用於 quickPick 對話框顯示可用的匯入項目
		 * Import options list: used for quickPick dialog to display available import items
		 */
		const options: vscode.QuickPickItem[] = [];

		/**
		 * 根據資料類型動態新增選項：若資料包含自訂 IDE 則新增相應選項
		 * Add options based on data type: if data contains custom IDEs, add corresponding option
		 */
		if (data.customIDEs && data.customIDEs.length > 0)
		{
			options.push({
				label: '$(file-directory) 匯入自訂 IDE',
				description: `匯入 ${data.customIDEs.length} 個自訂 IDE`,
				picked: true,
			});
		}

		if (data.selectedSettings && data.selectedSettings.length > 0)
		{
			options.push({
				label: '$(gear) 匯入選擇的設定',
				description: `匯入 ${data.selectedSettings.length} 個選擇的設定`,
				picked: true,
			});
		}

		if (options.length === 0)
		{
			vscode.window.showWarningMessage('匯入檔案中沒有可匯入的資料');
			return undefined;
		}

		/**
		 * 顯示匯入項目選擇對話框：允許使用者多選要匯入的項目
		 * Show import items selection dialog: allow user to multi-select items to import
		 */
		const selectedOptions = await vscode.window.showQuickPick(options, {
			placeHolder: '選擇要匯入的項目',
			canPickMany: true,
		});

		/**
		 * 若使用者取消選擇（未選取任何項目），則返回 undefined
		 * If user cancels (no items selected), return undefined
		 */
		if (!selectedOptions || selectedOptions.length === 0)
		{
			return undefined;
		}

		/**
		 * 解析使用者選擇：根據選項標籤判斷是否匯入自訂 IDE 或選取的設定
		 * Parse user selection: determine whether to import custom IDEs or selected settings based on option labels
		 */
		const includeCustomIDEs = selectedOptions.some(option =>
			option.label.includes('自訂 IDE'),
		);
		const includeSelectedSettings = selectedOptions.some(option =>
			option.label.includes('選取的設定'),
		);

		/**
		 * 顯示進階選項對話框：提供排除內建 IDE、覆寫現有設定等選項
		 * Show advanced options dialog: provide options like excluding built-in IDEs, overwriting existing settings
		 */
		const advancedOptions = await vscode.window.showQuickPick([
			{
				label: '$(check) 排除內建 IDE',
				description: '自動排除已知的內建 IDE',
				picked: true,
			},
			{
				label: '$(discard) 覆蓋現有設定',
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

		/**
		 * 若選取了設定匯入且資料中有選取的設定，則顯示設定選取對話框
		 * If selected settings import and data contains selected settings, show setting selection dialog
		 */
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
		/**
		 * 建構快速選取項目清單：將設定清單轉換為 QuickPick 可顯示格式
		 * Construct quick pick items: convert settings list to QuickPick display format
		 *
		 * - label: 設定鍵值（唯一識別符）
		 * - description: 設定顯示名稱
		 * - detail: 設定描述
		 * - picked: 預設為選取狀態
		 */
		const quickPickItems: vscode.QuickPickItem[] = settings.map(setting => ({
			label: setting.key,
			description: setting.display,
			detail: setting.description,
			picked: true,
		}));

		/**
		 * 新增操作按鈕：全選、取消選取、反選
		 * Add action buttons: select all, cancel selection, invert selection
		 *
		 * 這些按鈕提供批次操作功能，提升使用者體驗
		 * These buttons provide batch operation functionality to improve user experience
		 */
		const allButton = { label: '$(check-all) 全選', description: '選擇所有設定' };
		const noneButton = { label: '$(x) 取消選取', description: '取消選擇所有設定' };
		const invertButton = { label: '$(diff) 反選', description: '反轉選擇' };

		/**
		 * 顯示設定選擇對話框：允許使用者多選要匯入的設定，並可使用搜尋過濾
		 * Show setting selection dialog: allow user multi-select settings to import, with search filtering
		 *
		 * - matchOnDescription: 允許在描述中搜尋
		 * - matchOnDetail: 允許在詳細資訊中搜尋
		 */
		const selectedItems = await vscode.window.showQuickPick(
			[allButton, noneButton, invertButton, ...quickPickItems],
			{
				placeHolder: '選擇要匯入的設定 (可使用搜尋過濾)',
				canPickMany: true,
				matchOnDescription: true,
				matchOnDetail: true,
			},
		);

		/**
		 * 若使用者取消選擇（按下 Esc 或關閉對話框），則返回 undefined
		 * If user cancels (presses Esc or closes dialog), return undefined
		 */
		if (!selectedItems)
		{
			return undefined;
		}

		/**
		 * 處理操作按鈕：根據使用者點擊的按鈕執行相應動作
		 * Handle action buttons: perform corresponding action based on which button user clicked
		 */
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
			// Invert selection (simplified - would need more complex logic for actual implementation)
			return settings.filter(s => !selectedItems.some(item => item.label === s.key)).map(s => s.key);
		}

		// Return selected setting keys
		return selectedItems
			.filter(item => !item.label.includes('全選') && !item.label.includes('取消選取') && !item.label.includes('反選'))
			.map(item => item.label);
	}

	/**
	 * 儲存匯出檔案
	 * Save export file
	 */
	async saveExportFile(content: string, defaultName: string): Promise<string | undefined>
	{
		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath || '', defaultName)),
			filters: {
				'JSON Files': ['json'],
				'All Files': ['*'],
			},
		});

		if (uri)
		{
			try
			{
				fs.writeFileSync(uri.fsPath, content, 'utf8');
				vscode.window.showInformationMessage(`匯出成功: ${uri.fsPath}`);
				return uri.fsPath;
			}
			catch (error)
			{
				vscode.window.showErrorMessage(`儲存失敗: ${error instanceof Error ? error.message : String(error)}`);
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
		const uri = await vscode.window.showOpenDialog({
			canSelectMany: false,
			openLabel: '匯入',
			filters: {
				'JSON Files': ['json'],
				'All Files': ['*'],
			},
		});

		if (uri && uri[0])
		{
			try
			{
				const content = fs.readFileSync(uri[0].fsPath, 'utf8');
				return content;
			}
			catch (error)
			{
				vscode.window.showErrorMessage(`讀取失敗: ${error instanceof Error ? error.message : String(error)}`);
			}
		}

		return undefined;
	}
}
