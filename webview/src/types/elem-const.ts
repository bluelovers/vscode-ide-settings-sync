/**
 * Webview 前端共用列舉定義
 * Webview frontend shared enum definitions
 *
 * 集中管理所有 enum 與衍生常數，不得放置於 store.ts。
 * Centralizes all enums and derived constants; must not be placed in store.ts or types.ts.
 *
 * 此檔案不得 import 任何 VS Code 或 Node.js 相依模組。
 * This file must NOT import any VS Code or Node.js dependent modules.
 */

/**
 * Webview 元素選擇器列舉（單一事實來源）
 * Webview element selector enum (Single Source of Truth)
 *
 * 所有 DOM ID 選擇器應統一定義於此，避免各處硬編碼造成的維護困難。
 * All DOM ID selectors should be defined here to avoid maintenance issues from hardcoded strings.
 *
 * 使用 const enum 讓 esbuild 在編譯時直接 inline 字串值，
 * 避免在 Webview bundle 中產生額外的列舉查表程式碼。
 * Using const enum allows esbuild to inline string values at compile time,
 * avoiding extra enum lookup code in the Webview bundle.
 */
export const enum EnumWebviewElemId
{
	/** 搜尋結果容器 / Search results container */
	searchResults = 'searchResults',
	/** 所有設定列表 / All settings list */
	allSettings = 'allSettings',
	/** 已選設定列表 / Selected settings list */
	selectedSettingsList = 'selectedSettingsList',
	/** 搜尋輸入框 / Search input field */
	searchInput = 'searchInput',
	/** 訊息顯示容器 / Message display container */
	message = 'message',
	/** 匯出自訂路徑輸入框 / Export custom path input */
	exportCustomPath = 'exportCustomPath',
	/** 匯出包含已知 IDE 勾選框 / Export include known IDEs checkbox */
	exportIncludeKnownIDEs = 'exportIncludeKnownIDEs',
	/** 匯出已選設定路徑輸入框 / Export selected settings path input */
	exportSelectedPath = 'exportSelectedPath',
	/** 匯出全部包含已知 IDE 勾選框 / Export all include known IDEs checkbox */
	exportAllIncludeKnownIDEs = 'exportAllIncludeKnownIDEs',
	/** 匯出全部路徑輸入框 / Export all path input */
	exportAllPath = 'exportAllPath',
	/** 匯入路徑輸入框 / Import path input */
	importPath = 'importPath',
	/** 主語言選擇下拉選單 / Primary language select dropdown */
	primaryLang = 'primaryLang',
	/** 內建備份 IDE 路徑輸入框 / Built-in backup IDE path input */
	backupIDEPath = 'backup-ide-path',
}

/**
 * CSS 類別選擇器列舉（單一事實來源）
 * CSS class selector enum (Single Source of Truth)
 *
 * 所有 CSS 類別選擇器應統一定義於此，避免各處硬編碼。
 * All CSS class selectors should be defined here to avoid hardcoded strings.
 *
 * 集中管理 CSS 類別名稱，方便全域重新命名與樣式除錯。
 * Centralized CSS class names make global renaming and style debugging easier.
 */
export const enum EnumCssClassSelector
{
	/** 來源 IDE 指示器容器 / Source IDE indicator container */
	sourceIdeIndicator = 'source-ide-indicator',
	/** 分頁導航容器 / Tab navigation container */
	tabs = 'tabs',
	/** IDE 項目元素 / IDE item element */
	ideItem = 'ide-item',
	/** IDE 勾選框 / IDE checkbox */
	ideCheckbox = 'ide-checkbox',
	/** IDE 來源單選按鈕 / IDE source radio button */
	ideSourceRadio = 'ide-source-radio',
}

/**
 * 合法的分頁名稱列舉（單一事實來源）
 * Enum of valid tab names (Single Source of Truth)
 *
 * 所有需要列舉 tab 的地方（switchTab、effect、TABS 陣列）都從此衍生，
 * 避免各處硬編碼字串造成的 Shotgun Surgery 問題。
 *
 * All places that need to enumerate tabs (switchTab, effect, TABS array) derive from this,
 * avoiding Shotgun Surgery caused by hardcoded strings in multiple places.
 *
 * 使用 const enum 讓 esbuild 在編譯時直接 inline 字串值，
 * 減少 Webview bundle 體積並提升執行效能。
 * Using const enum lets esbuild inline string values at compile time,
 * reducing Webview bundle size and improving runtime performance.
 */
export const enum EnumTabName
{
	/** 同步設定分頁 / Sync settings tab */
	sync = 'sync',
	/** 檢視所有設定分頁 / View all settings tab */
	values = 'values',
	/** 已選設定分頁 / Selected settings tab */
	selected = 'selected',
	/** 匯出/匯入分頁 / Export/Import tab */
	exportImport = 'export-import',
}

/**
 * 所有分頁的有序陣列（從 EnumTabName 衍生，單一事實來源）
 * Ordered array of all tabs (derived from EnumTabName, Single Source of Truth)
 *
 * 新增分頁時只需在 EnumTabName 加一筆，此陣列同步更新。
 * To add a tab, only update EnumTabName; this array updates automatically.
 */
export const ALL_TAB_NAMES: EnumTabName[] = [
	EnumTabName.sync,
	EnumTabName.values,
	EnumTabName.selected,
	EnumTabName.exportImport,
];
