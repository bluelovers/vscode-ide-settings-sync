
/** ─── 掛載所有函數至 window / Mount all functions to window ─── */

import { handleExportCustomIDEs, handleExportSelectedSettings, handleExportAll, handleImport, handleBrowseExportPath, handleBrowseImportPath } from "../scripts/export-import";
import { removeCustomIDE, openIDEFolder, openSettingsJson, addCustomIDE, refreshIDEs, handleSourceIDEChange } from "../scripts/ide";
import { changePrimaryLanguage, openLanguageConfig } from "../scripts/language";
import { saveSearchHistory, addSelectedSettingsListOnSearchPanel, addSelectedSettingsListOnAllPanel, saveSelectedIDEs } from "../scripts/memory";
import { showMessage } from "../scripts/messages";
import { createSettingHTML, getSettingDescription, clearSearch, removeFromSelectedSettings, clearAllSelectedSettings, refreshSettings, displayAllSettings, searchSettings, displaySelectedSettingsList } from "../scripts/settings";
import { syncSettings, deleteSettings } from "../scripts/sync";
import { switchTab } from "../scripts/tabs";
import { IWebviewState } from "../types";

/**
 * 將所有需要從 HTML `onclick`/`onchange`/`onkeyup` 字串屬性呼叫的函數掛載至 `window`
 * Mount all functions that need to be called from HTML `onclick`/`onchange`/`onkeyup` string attributes to `window`
 *
 * SSR 渲染的 HTML 中使用字串形式的事件屬性（如 `onclick="syncSettings()"`），
 * 這些字串在瀏覽器中執行時會查找 `window` 上的同名函數。
 * 因此必須在 bundle 載入時將所有函數掛載至 `window`，確保事件能正確觸發。
 *
 * The SSR-rendered HTML uses string-form event attributes (e.g. `onclick="syncSettings()"`),
 * which look up same-named functions on `window` when executed in the browser.
 * Therefore all functions must be mounted to `window` when the bundle loads,
 * ensuring events can be triggered correctly.
 */
const extendsApi = {
	/** UI 分頁切換 / UI tab switching */
	switchTab,
	/** 顯示狀態訊息 / Display status message */
	showMessage,

	/** 變更主顯示語言 / Change primary display language */
	changePrimaryLanguage,
	/** 開啟語言設定面板 / Open language configuration panel */
	openLanguageConfig,

	/** 儲存搜尋字串至 globalState / Save search string to globalState */
	saveSearchHistory,
	/** 儲存搜尋結果中已勾選的設定並添加到 globalState / Save checked settings from search results and add to globalState */
	addSelectedSettingsListOnSearchPanel,
	/** 儲存所有設定列表中已勾選的設定並添加到 globalState / Save checked settings from all settings list and add to globalState */
	addSelectedSettingsListOnAllPanel,
	/** 儲存已勾選的 IDE 索引 / Save checked IDE indices */
	saveSelectedIDEs,

	/** 依搜尋字串過濾並顯示設定（由 SearchResultsList 組件取代）/ Filter and display settings — replaced by SearchResultsList component */
	// searchSettings: removed, handled by Preact component
	/** 顯示所有 IDE 的設定值（由 AllSettingsList 組件取代）/ Display all IDE settings — replaced by AllSettingsList component */
	// displayAllSettings: removed, handled by Preact component
	/** 顯示已儲存的選取設定列表（由 SelectedSettingsList 組件取代）/ Display selected settings — replaced by SelectedSettingsList component */
	// displaySelectedSettingsList: removed, handled by Preact component
	/** 產生單一設定列的 HTML 字串 / Generate HTML string for a single setting row */
	createSettingHTML,
	/** 查找設定 key 的多語言描述 / Look up multilingual description for a setting key */
	getSettingDescription,
	/** 清除搜尋輸入框與結果 / Clear search input and results */
	clearSearch,
	/** 從已選設定列表中移除單一項目 / Remove a single item from the selected settings list */
	removeFromSelectedSettings,
	/** 清除所有已選設定 / Clear all selected settings */
	clearAllSelectedSettings,
	/** 重新載入設定資料 / Reload settings data */
	refreshSettings,

	/** 同步已選設定至目標 IDE / Sync selected settings to target IDEs */
	syncSettings,
	/** 從已選 IDE 刪除已選設定 / Delete selected settings from selected IDEs */
	deleteSettings,

	/** 移除自訂 IDE / Remove a custom IDE */
	removeCustomIDE,
	/** 在系統檔案總管中開啟 IDE 資料夾 / Open IDE folder in system file explorer */
	openIDEFolder,
	/** 在編輯器中開啟 IDE 的 settings.json / Open IDE's settings.json in editor */
	openSettingsJson,
	/** 新增自訂 IDE 路徑 / Add a custom IDE path */
	addCustomIDE,
	/** 重新掃描系統中的 IDE 安裝 / Re-scan system for IDE installations */
	refreshIDEs,
	/** 處理來源 IDE radio 按鈕的變更事件 / Handle source IDE radio button change event */
	handleSourceIDEChange,

	/** 匯出自訂 IDE 設定 / Export custom IDE configurations */
	handleExportCustomIDEs,
	/** 匯出已選設定 / Export selected settings */
	handleExportSelectedSettings,
	/** 匯出所有設定與 IDE 設定 / Export all settings and IDE configurations */
	handleExportAll,
	/** 從檔案匯入設定 / Import settings from file */
	handleImport,
	/** 開啟匯出路徑選擇對話框 / Open export path selection dialog */
	handleBrowseExportPath,
	/** 開啟匯入檔案選擇對話框 / Open import file selection dialog */
	handleBrowseImportPath,

	displayAllSettings,
	searchSettings,

	displaySelectedSettingsList,
}

type IWebviewWindowApi = typeof extendsApi;

/**
 * Webview 窗口接口，用于 TypeScript 类型安全
 * Webview window interface for TypeScript type safety
 */
export type IWebviewWindow = Window & typeof globalThis & {
	__INITIAL_STATE__: IWebviewState;
} & IWebviewWindowApi;

export const globalThisWindow = Object.assign(window, extendsApi) as IWebviewWindow;
