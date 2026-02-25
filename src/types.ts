// IDE 信息接口
export interface IDEInfo {
  name: string;
  settingsPath: string;
  settingsJsonPath: string;
  settings: SettingsData;
  type: 'known' | 'custom';
  available: boolean;        // 是否已檢測到
  nativePath: string;         // 實際路徑（用於顯示）
  languageId?: string;        // IDE 的語言標識
  i18nPath?: string;          // i18n 資源路徑
}

// 未檢測到的 IDE 信息（灰顯用）
export interface UnavailableIDE {
  name: string;
  type: 'known' | 'custom';
  expectedPath: string;
}

// 設定資料
export interface SettingsData {
  [key: string]: any;
}

// 設定項目
export interface SettingEntry {
  key: string;
  display: string;
  description: string;
  currentIDEValue?: any;      // 當前 IDE 的設定值
  values: Map<string, any>;   // IDE name -> value
}

// 同步操作
export interface SyncAction {
  settingKey: string;
  targetIDEs: number[];
  sourceIDE: number;
  action: 'sync' | 'delete';
}

// 語言選項
export interface LanguageOption {
  id: string;
  name: string;
  source: 'builtin' | 'extension' | 'custom';
  fallbacks?: string[];       // 回退語言列表
}

// 語言配置
export interface LanguageConfig {
  primary: string;            // 主顯示語言
  fallbackList: string[];     // Fallback 語言列表（依序查找）
  secondary?: string;         // 副顯示語言（可選）
  showSecondary: boolean;     // 是否顯示副語言描述
}

// 語言源系統
export interface LanguageSourceInfo {
  code: string;
  name: string;
  nativeName?: string;
  locale?: string;
  available: boolean;
  source: 'builtin' | 'ide' | 'extension';
  ideIndex?: number;          // 如果來自IDE，記錄是哪一個IDE
}
