/**
 * 由 esbuild 打包為 IIFE bundle（dist/webview/index.js），
 * 在 VS Code Webview 的瀏覽器沙盒環境中執行。
 * Bundled by esbuild as an IIFE bundle (dist/webview/index.js),
 * executed in the VS Code Webview browser sandbox environment.
 */

import { IWebviewState } from "../types";
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
 * WHY 在模組頂層呼叫：VS Code 規定 `acquireVsCodeApi()` 在整個 Webview
 * 生命週期內只能呼叫一次，重複呼叫會拋出例外。將其放在模組頂層確保：
 * 1. 只執行一次（模組只會被載入一次）
 * 2. 所有 scripts/ 子模組都能透過 `import { vscode } from '../index'`
 *    共享同一個實例，不需要各自呼叫 acquireVsCodeApi()
 *
 * WHY called at module top level: VS Code requires `acquireVsCodeApi()` to be called
 * only once during the entire Webview lifecycle; calling it again throws an exception.
 * Placing it at the module top level ensures:
 * 1. Executed only once (the module is only loaded once)
 * 2. All scripts/ submodules can share the same instance via `import { vscode } from '../index'`,
 *    without each needing to call acquireVsCodeApi() themselves
 *
 * WHY export：讓 scripts/ 下的各模組（messages.ts、sync.ts 等）
 * 可以 import 此實例來呼叫 postMessage，集中管理通訊入口。
 * WHY export: Allows each module under scripts/ (messages.ts, sync.ts, etc.)
 * to import this instance to call postMessage, centralizing the communication entry point.
 */
export const vscode = acquireVsCodeApi();

import './window-this';
