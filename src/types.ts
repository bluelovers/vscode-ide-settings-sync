// 語言代碼類型
export type ILanguageCode = 'en' | 'zh-tw' | 'zh-cn' | 'ja' | 'de' | 'fr';

// IDE 信息接口
export interface IIDEInfo {
  name: string;
  settingsPath: string;
  settingsJsonPath: string;
  settings: ISettingsData;
  type: 'known' | 'custom';
  // 是否已檢測到
  available: boolean;
  // 實際路徑（用於顯示）
  nativePath: string;
  // IDE 的語言標識
  languageId?: string;
  // i18n 資源路徑
  i18nPath?: string;
}

// 未檢測到的 IDE 信息（灰顯用）
export interface IUnavailableIDE {
  name: string;
  type: 'known' | 'custom';
  expectedPath: string;
}

// 設定資料
export interface ISettingsData {
  [key: string]: any;
}

// 設定項目
export interface ISettingEntry {
  key: string;
  display: string;
  description: string;
  // 當前 IDE 的設定值
  currentIDEValue?: any;
  // IDE name -> value
  values: Map<string, any>;
}

// 同步操作
export interface ISyncAction {
  settingKey: string;
  targetIDEs: number[];
  sourceIDE: number;
  action: 'sync' | 'delete';
}

// 語言選項
export interface ILanguageOption {
  id: string;
  name: string;
  source: 'builtin' | 'extension' | 'custom';
  // 回退語言列表
  fallbacks?: string[];
}

// 語言配置
export interface ILanguageConfig {
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
export interface ILanguageSourceInfo {
  code: string;
  name: string;
  nativeName?: string;
  locale?: string;
  available: boolean;
  source: 'builtin' | 'ide' | 'extension';
  // 如果來自IDE，記錄是哪一個IDE
  ideIndex?: number;
}
