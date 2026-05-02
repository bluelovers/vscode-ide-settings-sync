/**
 * Webview 訊息處理模組
 * Webview message handling module
 *
 * 提供 `showMessage` 工具函數用於在 Webview 中顯示狀態通知，
 * 並處理來自 VS Code Extension host 的訊息。
 * Provides the `showMessage` utility for displaying status notifications in the Webview,
 * and handles messages from the VS Code Extension host.
 *
 * 注意：`exportPathSelected`、`importPathSelected`、`exportComplete`、`importComplete`
 * 由 `export-import.ts` 負責處理。
 * Note: `exportPathSelected`, `importPathSelected`, `exportComplete`, `importComplete`
 * are handled by `export-import.ts`.
 */

import { vscode } from '../index';

/**
 * 在 `#message` 元素中顯示狀態訊息
 * Display a status message in the `#message` element
 *
 * 訊息會在 5 秒後自動清除 className 以隱藏樣式。
 * The message's className is automatically cleared after 5 seconds to hide the style.
 *
 * @param text - 要顯示的訊息文字 / The message text to display
 * @param type - 視覺樣式類型 / Visual style type: 'success' | 'error' | 'info'
 */
export function showMessage(text: string, type: 'success' | 'error' | 'info'): void
{
	const messageDiv = document.getElementById('message');
	if (!messageDiv) return;

	messageDiv.textContent = text;
	messageDiv.className = `message ${type}`;

	/**
	 * 5 秒後清除訊息樣式，讓訊息淡出
	 * Clear message style after 5 seconds to fade out the message
	 */
	setTimeout(() =>
	{
		messageDiv.className = 'message';
	}, 5000);
}

/**
 * 註冊 `window.message` 事件監聽器，處理來自 VS Code Extension host 的指令
 * Register the `window.message` event listener to handle commands from the VS Code Extension host
 *
 * 處理的指令：
 * - `syncComplete`：同步完成，顯示成功訊息並請求重新載入資料
 * - `deleteComplete`：刪除完成，顯示成功訊息並請求重新載入資料
 * - `addCustomIDEComplete`：新增自訂 IDE 完成，根據結果顯示成功或失敗訊息
 *
 * Handled commands:
 * - `syncComplete`: Sync complete, show success message and request data reload
 * - `deleteComplete`: Delete complete, show success message and request data reload
 * - `addCustomIDEComplete`: Add custom IDE complete, show success or failure message based on result
 */
export function initMessageHandler(): void
{
	window.addEventListener('message', (event: MessageEvent) =>
	{
		const message = event.data;

		switch (message.command)
		{
			case 'syncComplete':
				showMessage('Settings synced successfully!', 'success');
				/**
				 * 同步完成後請求 Extension host 重新載入設定資料並重繪 Webview
				 * After sync completes, request Extension host to reload settings data and redraw Webview
				 */
				vscode.postMessage({ command: 'refreshData' });
				break;

			case 'deleteComplete':
				showMessage('Settings deleted successfully!', 'success');
				/**
				 * 刪除完成後請求 Extension host 重新載入設定資料並重繪 Webview
				 * After delete completes, request Extension host to reload settings data and redraw Webview
				 */
				vscode.postMessage({ command: 'refreshData' });
				break;

			case 'addCustomIDEComplete':
				/**
				 * 根據 message.success 決定顯示成功或失敗訊息
				 * Show success or failure message based on message.success
				 */
				if (message.success)
				{
					showMessage(`✓ Custom IDE "${message.name}" added successfully!`, 'success');
				}
				else
				{
					showMessage(`✗ Failed to add IDE: ${message.error}`, 'error');
				}
				break;

			/** exportPathSelected, importPathSelected, exportComplete, importComplete 由 export-import.ts 處理 */
			/** exportPathSelected, importPathSelected, exportComplete, importComplete are handled in export-import.ts */
		}
	});
}
