/**
 * 由 esbuild 打包為 IIFE bundle（dist/webview/index.js），
 * 在 VS Code Webview 的瀏覽器沙盒環境中執行。
 * Bundled by esbuild as an IIFE bundle (dist/webview/index.js),
 * executed in the VS Code Webview browser sandbox environment.
 */

/** 匯入 Webview 初始狀態介面 / Import Webview initial state interface */
import { IWebviewState } from "../types";
/** 匯入 Webview 與 Extension host 之間的通訊訊息型別 / Import message type for Webview <-> Extension host communication */
import { IWebviewMessage } from "../webviewMessages";

/**
 * 宣告 acquireVsCodeApi 的 TypeScript 型別
 * Declare TypeScript type for acquireVsCodeApi
 *
 * 此函數由 VS Code 在 Webview 的 iframe 沙盒環境中自動注入，
 * 並非來自任何 npm 套件，因此 TypeScript 無法自動推導其型別。
 * 使用 `declare function` 告訴 TypeScript「這個函數在執行時一定存在，
 * 請相信我的型別宣告」，避免編譯錯誤。
 *
 * This function is automatically injected by VS Code into the Webview iframe sandbox,
 * not from any npm package, so TypeScript cannot infer its type automatically.
 * Using `declare function` tells TypeScript "this function definitely exists at runtime,
 * trust my type declaration", avoiding compilation errors.
 *
 * 注意：此函數與 Extension host 端的 `import * as vscode from 'vscode'` 完全無關——
 * 那是 Node.js 進程的 API；這是瀏覽器沙盒的通訊橋接 API，
 * 兩者在隔離的執行環境中運作，不會互相干擾。
 * Note: This function is completely unrelated to `import * as vscode from 'vscode'` on the Extension host side —
 * that is the Node.js process API; this is the browser sandbox communication bridge API.
 * Both operate in isolated execution environments and do not interfere with each other.
 */
declare function acquireVsCodeApi(): {
	/** 向 Extension host 發送訊息（跨進程通訊）/ Send a message to the Extension host (cross-process communication) */
	postMessage(message: IWebviewMessage): void;
	/** 讀取 Webview 的持久化狀態（頁面重載後仍保留）/ Read the Webview's persisted state (retained after page reload) */
	getState(): IWebviewState;
	/** 寫入 Webview 的持久化狀態 / Write the Webview's persisted state */
	setState(state: IWebviewState): void;
};

/**
 * Webview 與 Extension host 之間的通訊橋接物件
 * Communication bridge object between Webview and Extension host
 *
 * 在 SSR（Node.js）環境中，`acquireVsCodeApi` 不存在，使用 stub 代替。
 * In SSR (Node.js) environment, `acquireVsCodeApi` doesn't exist; use a stub instead.
 */
export const vscode = typeof acquireVsCodeApi !== 'undefined'
	? acquireVsCodeApi()
	: {
		postMessage: () => {},
		getState: () => ({} as IWebviewState),
		setState: () => {},
	};

import './window-this';
