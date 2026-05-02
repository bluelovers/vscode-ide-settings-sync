/**
 * Webview 端訊息協議重新匯出
 * Webview-side message protocol re-export
 *
 * 從 src/webview/webviewMessages.ts 重新匯出所有型別與 enum，
 * 讓 Webview bundle（webview/src/scripts/*.ts）可以使用相同的定義，
 * 確保兩端使用同一個單一事實來源。
 *
 * Re-exports all types and enums from src/webview/webviewMessages.ts,
 * allowing the Webview bundle (webview/src/scripts/*.ts) to use the same definitions,
 * ensuring both sides share the same Single Source of Truth.
 */
export * from '../../src/webview/webviewMessages';
