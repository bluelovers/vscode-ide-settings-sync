/**
 * window 函數掛載模組（瀏覽器端專用）
 * Window function mounting module (browser-side only)
 *
 * 此檔案在瀏覽器環境中將必要函數掛載至 window，
 * 僅由 `index.tsx`（瀏覽器 bundle 入口）import，不得在 SSR 路徑中 import。
 *
 * This file mounts necessary functions to window in browser environments.
 * Only imported by `index.tsx` (browser bundle entry), must NOT be imported in SSR paths.
 */

/** 從設定腳本匯入：移除已選取設定的功能 / Import from settings scripts: function to remove selected settings */
import { removeFromSelectedSettings } from '../scripts/settings';
/** 從記憶腳本匯入：搜尋歷史、已選取設定列表（搜尋/全部面板）、已選取 IDE 索引的儲存功能
 * Import from memory scripts: save search history, selected settings lists (search/all panel), selected IDE indices */
import { saveSearchHistory, addSelectedSettingsListOnSearchPanel, addSelectedSettingsListOnAllPanel, saveSelectedIDEs } from '../scripts/memory';
/** 從訊息腳本匯入：顯示狀態訊息的功能 / Import from messages scripts: function to display status messages */
import { showMessage } from '../scripts/messages';
/** 匯入 Webview 初始狀態介面 / Import Webview initial state interface */
import { IWebviewState } from '../types';

/**
 * 要掛載至 window 的 API 方法集合
 * Collection of API methods to mount to window
 *
 * 包含 Webview 前端需要呼叫的各種功能函數，
 * 這些函數來自不同的腳本模組，統一掛載至 window 方便全域存取。
 * Contains various functional functions needed by the Webview frontend,
 * these functions come from different script modules, unified mounted to window for global access.
 */
const extendsApi = {
	/** 從選取設定列表中移除指定設定的函數 / Function to remove specified settings from the selected list */
	removeFromSelectedSettings,
	/** 儲存搜尋字串至 globalState（用於頁面重載後恢復搜尋狀態）/ Save search string to globalState (restore search state after page reload) */
	saveSearchHistory,
	/** 將搜尋面板中勾選的設定加入已選取列表 / Add checked settings from search panel to the selected list */
	addSelectedSettingsListOnSearchPanel,
	/** 將全部設定面板中勾選的設定加入已選取列表 / Add checked settings from all settings panel to the selected list */
	addSelectedSettingsListOnAllPanel,
	/** 儲存已勾選的 IDE 索引（記錄使用者選取的 IDE）/ Save checked IDE indices (record user-selected IDEs) */
	saveSelectedIDEs,
	/** 顯示狀態訊息（向使用者提示操作結果或錯誤）/ Display status message (notify user of operation results or errors) */
	showMessage,
} as const;

/**
 * Webview window 介面，用於 TypeScript 型別安全
 * Webview window interface for TypeScript type safety
 *
 * 僅用於型別轉換（`window as any as IWebviewWindow`），不包含執行時邏輯。
 * Used only for type casting (`window as any as IWebviewWindow`), contains no runtime logic.
 */
export type IWebviewWindow = Window & typeof globalThis & {
	/** 由 Extension host 注入的初始狀態 / Initial state injected by Extension host */
	__INITIAL_STATE__: IWebviewState & {
		supportedLanguages?: Array<{ code: string; name: string }>;
	};
} & typeof extendsApi;

/**
 * 將 API 方法掛載至 window（僅在瀏覽器環境執行）
 * Mount API methods to window (only executes in browser environment)
 *
 * 瀏覽器環境中，將 extendsApi 的所有方法指派給 window，
 * 讓全域可以透過 window 存取這些功能。
 * 非瀏覽器環境（如 SSR）則設為 undefined，避免錯誤。
 * In browser environment, assign all methods from extendsApi to window,
 * allowing global access to these functions via window.
 * In non-browser environments (e.g., SSR), set to undefined to avoid errors.
 */
export const globalThisWindow = typeof window !== 'undefined'
	? Object.assign(window, extendsApi) as IWebviewWindow
	: undefined;
