/**
 * Webview window 型別定義（純型別，無執行時副作用）
 * Webview window type definitions (pure types, no runtime side effects)
 *
 * 此檔案僅包含型別定義，可安全地在 SSR（Node.js）環境中 import。
 * This file contains only type definitions and is safe to import in SSR (Node.js) environments.
 *
 * 不得在此檔案中執行任何 window / document / vscode 操作。
 * Do NOT perform any window / document / vscode operations in this file.
 */

import { IWebviewState } from '../types';

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
	/** 從已選設定列表中移除單一項目 / Remove single item from selected settings */
	removeFromSelectedSettings?: (key: string) => void;
	/** 儲存搜尋字串至 globalState / Save search string to globalState */
	saveSearchHistory?: () => void;
	/** 儲存搜尋結果中已勾選的設定 / Save checked settings from search results */
	addSelectedSettingsListOnSearchPanel?: () => void;
	/** 儲存所有設定列表中已勾選的設定 / Save checked settings from all settings list */
	addSelectedSettingsListOnAllPanel?: () => void;
	/** 儲存已勾選的 IDE 索引 / Save checked IDE indices */
	saveSelectedIDEs?: () => void;
	/** 顯示狀態訊息 / Display status message */
	showMessage?: (text: string, type: string) => void;
};
