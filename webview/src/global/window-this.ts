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

import { removeFromSelectedSettings } from '../scripts/settings';
import { saveSearchHistory, addSelectedSettingsListOnSearchPanel, addSelectedSettingsListOnAllPanel, saveSelectedIDEs } from '../scripts/memory';
import { showMessage } from '../scripts/messages';
import { IWebviewState } from '../types';

const extendsApi = {
	/** 由 Extension host 注入的初始狀態 / Initial state injected by Extension host */
	removeFromSelectedSettings,
	/** 儲存搜尋字串至 globalState / Save search string to globalState */
	saveSearchHistory,
	/** 儲存搜尋結果中已勾選的設定 / Save checked settings from search results */
	addSelectedSettingsListOnSearchPanel,
	/** 儲存所有設定列表中已勾選的設定 / Save checked settings from all settings list */
	addSelectedSettingsListOnAllPanel,
	/** 儲存已勾選的 IDE 索引 / Save checked IDE indices */
	saveSelectedIDEs,
	/** 顯示狀態訊息 / Display status message */
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
 * 將函數掛載至 window（僅在瀏覽器環境執行）
 * Mount functions to window (only executes in browser environment)
 */
export const globalThisWindow = typeof window !== 'undefined'
	? Object.assign(window, extendsApi) as IWebviewWindow
	: undefined;
