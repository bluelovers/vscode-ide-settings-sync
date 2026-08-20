/**
 * 專案共用型別定義
 * 包含語言代碼、IDE 資訊介面與其他全域 enum 定義。
 */
import { IdeSettingProvider } from "./providers/ideSettingProvider";

/**
 * 支援的語言代碼列舉（單一事實來源）
 * Enum of supported language codes (Single Source of Truth)
 *
 * 取代原本的 string union type ILanguageCode，
 * 確保語言代碼在編譯期即可驗證，避免拼寫錯誤。
 *
 * Replaces the original string union type ILanguageCode,
 * ensuring language codes are validated at compile time, preventing typos.
 */
export const enum EnumLanguageCode
{
	/** 英文 / English */
	en = 'en',
	/** 繁體中文 / Traditional Chinese */
	zhTw = 'zh-tw',
	/** 簡體中文 / Simplified Chinese */
	zhCn = 'zh-cn',
	/** 日文 / Japanese */
	ja = 'ja',
	/** 德文 / German */
	de = 'de',
	/** 法文 / French */
	fr = 'fr',
}

export const enum EnumIDEInfoType
{
	known = 'known',
	custom = 'custom',
	/** 內建備份 IDE（利用同步功能備份設定的專用 IDE）/ Built-in backup IDE (dedicated IDE for backing up settings via the sync feature) */
	backup = 'backup',
}

export const enum EnumLanguageOptionSource
{
	builtin = 'builtin',
	extension = 'extension',
	custom = 'custom',
	ide = 'ide',
}

export const enum EnumGlobalStateName
{
	customIDEs = 'customIDEs',
	languageConfig = 'languageConfig',
	searchHistory = 'searchHistory',
	selectedSettings = 'selectedSettings',
	selectedIDEs = 'selectedIDEs',
	sourceIDEUuid = 'sourceIDEUuid',
	/** 內建備份 IDE 的路徑設定 / Built-in backup IDE path setting */
	backupIDEPath = 'backupIDEPath',
}

/**
 * 匯出匯入相關型別定義
 * Export/Import related type definitions
 */

export const enum ExportImportType
{
	customIDEs = 'customIDEs',
	selectedSettings = 'selectedSettings',
	both = 'both',
}

/**
 * 自訂 IDE 基底介面（單一事實來源）
 * Custom IDE base interface (Single Source of Truth)
 *
 * ICustomIDEExport 與 ICustomIDEWithUuid 的共通欄位。
 * Common fields shared by ICustomIDEExport and ICustomIDEWithUuid.
 */
export interface ICustomIDEBase
{
	/** IDE 顯示名稱 / IDE display name */
	name: string;
	/** IDE 設定資料夾路徑 / IDE settings folder path */
	path: string;
}

/**
 * 自訂 IDE 匯出格式（繼承 ICustomIDEBase）
 * Custom IDE export format (extends ICustomIDEBase)
 */
export interface ICustomIDEExport extends ICustomIDEBase
{
	/** 匯出時間 ISO 字串 / Export timestamp ISO string */
	exportedAt: string;
	/** 匯出時是否已偵測到 / Whether detected at export time */
	detected?: boolean;
}

/**
 * 自訂 IDE 儲存類型（繼承 ICustomIDEBase，含 UUID）
 * Custom IDE storage type (extends ICustomIDEBase, with UUID)
 */
export interface ICustomIDEWithUuid extends ICustomIDEBase
{
	/** IDE 唯一識別符 / IDE unique identifier */
	uuid: string;
}

export interface ISelectedSettingExport
{
	key: string;
	display: string;
	description: string;
	values: Record<string, any>;
}

export interface IExportImportData
{
	version: string;
	exportedAt: string;
	exportedBy: string;
	type: ExportImportType;
	customIDEs?: ICustomIDEExport[];
	selectedSettings?: ISelectedSettingExport[];
	metadata?: {
		totalCustomIDEs: number;
		totalSelectedSettings: number;
		knownIDEsExcluded: string[];
	};
}

export interface IImportOptions
{
	includeCustomIDEs: boolean;
	includeSelectedSettings: boolean;
	excludeKnownIDEs: boolean;
	selectedSettingKeys?: string[];
	overwriteExisting: boolean;
	knownIDEsExcluded?: string[];
}

export interface IImportResult
{
	success: boolean;
	importedCustomIDEs: number;
	importedSelectedSettings: number;
	skippedCustomIDEs: number;
	skippedSelectedSettings: number;
	errors: string[];
	warnings: string[];
}

/**
 * IDE 資訊核心介面（可序列化，無 VS Code 相依）
 * IDE information base interface (serializable, no VS Code dependency)
 *
 * 包含所有可跨越 Extension host / Webview 邊界傳遞的欄位。
 * IIDEInfo、IIDEInfoWebview、IIDEInfoForMatch 均從此衍生，
 * 確保欄位定義只有一個事實來源。
 *
 * Contains all fields that can be passed across the Extension host / Webview boundary.
 * IIDEInfo, IIDEInfoWebview, and IIDEInfoForMatch all derive from this,
 * ensuring a single source of truth for field definitions.
 */
export interface IIDEInfoBase
{
	/** IDE 唯一識別符 / IDE unique identifier */
	uuid: string;
	/** IDE 顯示名稱 / IDE display name */
	name: string;
	/** IDE 類型（已知或自訂）/ IDE type (known or custom) */
	type: EnumIDEInfoType;
	/** 是否已偵測到並可用 / Whether detected and available */
	available: boolean;
	/** IDE 的實際資料夾路徑 / Actual IDE folder path */
	nativePath: string;
	/** IDE 本身的語言設定識別 / IDE language setting identifier */
	languageId?: string;
	/** i18n 資源路徑（若有）/ i18n resource path (if any) */
	i18nPath?: string;
	/**
	 * 是否可被選為同步來源 IDE（預設 true）
	 * Whether this IDE can be selected as the sync source IDE (defaults to true)
	 *
	 * 當為 false 時代表該 IDE 的 settings.json 不存在（尚未有資料可複製），
	 * 因此不能被選為來源，但仍可作為同步目標。
	 * When false, the IDE's settings.json does not exist yet (no data to copy),
	 * so it cannot be a source, but it can still be a sync target.
	 */
	canBeSource?: boolean;
}

/**
 * IDE 資訊描述介面（含 VS Code 設定供應商）
 * IDE information interface (with VS Code setting provider)
 *
 * 繼承 IIDEInfoBase，加上 Extension host 專用的 settingProvider。
 * Extends IIDEInfoBase, adding the Extension host-only settingProvider.
 */
export interface IIDEInfo extends IIDEInfoBase
{
	/**
	 * IDE 設定供應商，用於讀寫設定
	 * IDE setting provider for reading/writing settings
	 */
	settingProvider: IdeSettingProvider;
}

/**
 * 未檢測到的 IDE 信息核心介面（可序列化，無 VS Code 相依）
 * Unavailable IDE information base interface (serializable, no VS Code dependency)
 *
 * 作為 IUnavailableIDE（Extension host）與 IUnavailableIDEInfoWebview（Webview）的共通基底。
 * Serves as the common base for IUnavailableIDE (Extension host) and IUnavailableIDEInfoWebview (Webview).
 */
export interface IUnavailableIDEBase
{
	/** IDE 顯示名稱 / IDE display name */
	name: string;
	/** 預期的設定資料夾路徑 / Expected settings folder path */
	expectedPath: string;
	/** 不可用原因說明 / Reason why the IDE is unavailable */
	reason?: string;
}

/**
 * 未檢測到的 IDE 信息（Extension host 用，含 EnumIDEInfoType）
 * Unavailable IDE information (for Extension host, with EnumIDEInfoType)
 */
export interface IUnavailableIDE extends IUnavailableIDEBase
{
	/** IDE 類型 / IDE type */
	type: EnumIDEInfoType;
}

// 設定資料
export interface ISettingsData
{
	[key: string]: any;
}

// 設定項目
export interface ISettingEntry
{
	key: string;
	display: string;
	description: string;
	// 當前 IDE 的設定值
	currentIDEValue?: any;
	// IDE name -> value
	values: Map<string, any>;
}

/**
 * 同步操作類型列舉
 * Sync action type enum
 */
export const enum EnumSyncActionType
{
	/** 同步設定值 / Sync setting value */
	sync = 'sync',
	/** 刪除設定值 / Delete setting value */
	delete = 'delete',
}

// 同步操作
export interface ISyncAction
{
	settingKey: string;
	targetIDEs: number[];
	sourceIDE: number;
	action: EnumSyncActionType;
}

// 語言選項
export interface ILanguageOption
{
	id: string;
	name: string;
	source: EnumLanguageOptionSource;
	// 回退語言列表
	fallbacks?: string[];
}

// 語言配置
export interface ILanguageConfig
{
	// 主顯示語言
	primary: EnumLanguageCode;
	// Fallback 語言列表（依序查找）
	fallbackList: EnumLanguageCode[];
	// 副顯示語言（可選）
	secondary?: EnumLanguageCode;
	// 是否顯示副語言描述
	showSecondary: boolean;
}

// 語言源系統
export interface ILanguageSourceInfo
{
	code: string;
	name: string;
	nativeName?: string;
	locale?: string;
	available: boolean;
	source: EnumLanguageOptionSource;
	// 如果來自IDE，記錄是哪一個IDE
	ideIndex?: number;
}
