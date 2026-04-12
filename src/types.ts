/**
 * 專案共用型別定義
 * 包含語言代碼、IDE 資訊介面與其他全域 enum 定義。
 */
import { IdeSettingProvider } from "./providers/ideSettingProvider";

/**
 * 語言代碼
 */
export type ILanguageCode = 'en' | 'zh-tw' | 'zh-cn' | 'ja' | 'de' | 'fr';

export const enum EnumIDEInfoType
{
	known = 'known',
	custom = 'custom',
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

export interface ICustomIDEExport
{
	name: string;
	path: string;
	exportedAt: string;
	detected?: boolean;
}

/**
 * 自訂 IDE 儲存類型（包含 UUID）
 * Custom IDE storage type (with UUID)
 */
export interface ICustomIDEWithUuid
{
	uuid: string;
	name: string;
	path: string;
}

export interface ISelectedSettingExport
{
	key: string;
	display: string;
	description: string;
	values: Record<string, any>;
	exportedAt: string;
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
 * IDE 資訊描述介面
 */
export interface IIDEInfo
{
	/**
	 * IDE 唯一識別符
	 */
	uuid: string;
	/**
	 * IDE 顯示名稱
	 */
	name: string;
	/**
	 * IDE 類型（已知或自訂）
	 */
	type: EnumIDEInfoType;
	/**
	 * 是否已偵測到並可用
	 */
	available: boolean;
	/**
	 * IDE 的實際資料夾路徑
	 */
	nativePath: string;
	/**
	 * IDE 本身的語言設定識別
	 */
	languageId?: string;
	/**
	 * i18n 資源路徑（若有）
	 */
	i18nPath?: string;
	/**
	 * IDE 設定供應商，用於讀寫設定
	 * 用於讀寫設定的提供者實例
	 */
	settingProvider: IdeSettingProvider;
}

/**
 * 未檢測到的 IDE 信息（灰顯用）
 */
export interface IUnavailableIDE
{
	name: string;
	type: EnumIDEInfoType;
	expectedPath: string;
	reason?: string;
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

// 同步操作
export interface ISyncAction
{
	settingKey: string;
	targetIDEs: number[];
	sourceIDE: number;
	action: 'sync' | 'delete';
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
	primary: ILanguageCode;
	// Fallback 語言列表（依序查找）
	fallbackList: ILanguageCode[];
	// 副顯示語言（可選）
	secondary?: ILanguageCode;
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
