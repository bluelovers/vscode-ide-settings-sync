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

import { EnumShowMessageType } from '../types';
import type { IWebviewWindow } from '../global/window-this';
import { vscode } from '../global/vscode-api';
import { ideList } from '../store';
import { EnumHostCommand, IHostMessage, IWebviewWindowMessageEvent } from '../webviewMessages';
import { querySelectorById } from '../utils/elem-get';
import { EnumWebviewElemId } from '../types/elem-const';

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
export function showMessage(text: string, type: EnumShowMessageType): void
{
	const messageDiv = querySelectorById(EnumWebviewElemId.message);
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
	/**
	 * 監聽來自 VS Code 擴展宿主的消息事件
	 * Listen for message events from VS Code extension host
	 *
	 * 擴展宿主會透過 postMessage 向 Webview 發送指令與數據，此監聽器負責路由處理
	 * Extension host sends commands and data to Webview via postMessage; this listener handles routing
	 */
	window.addEventListener('message', (event: IWebviewWindowMessageEvent) =>
	{
		const message = event.data as IHostMessage;

		/**
		 * 根據來自擴展宿主的指令類型進行路由處理
		 * Route handling based on command type from extension host
		 *
		 * 使用 switch-case 結構確保每個指令都有明確的處理邏輯，
		 * 便於未來擴充新的指令類型。
		 * Uses switch-case structure to ensure clear handling logic for each command,
		 * making it easy to extend with new command types in the future.
		 */
		switch (message.command)
		{
			/**
			 * 同步完成：顯示成功訊息
			 * Sync complete: Show success message
			 *
			 * 當擴展宿主完成設定同步後觸發，通知使用者操作成功
			 * Triggered when extension host completes settings sync, notifies user of success
			 */
			case EnumHostCommand.SyncComplete:
				showMessage('Settings synced successfully!', EnumShowMessageType.SUCCESS);
				break;

			/**
			 * 刪除完成：顯示成功訊息
			 * Delete complete: Show success message
			 *
			 * 當擴展宿主完成設定刪除後觸發，通知使用者操作成功
			 * Triggered when extension host completes settings deletion, notifies user of success
			 */
			case EnumHostCommand.DeleteComplete:
				showMessage('Settings deleted successfully!', EnumShowMessageType.SUCCESS);
				break;

			/**
			 * 新增自定義 IDE 完成：根據結果顯示成功或失敗訊息
			 * Add custom IDE complete: Show success or failure message based on result
			 *
			 * 根據 message.success 判斷操作是否成功，成功時顯示 IDE 名稱，
			 * 失敗時顯示錯誤訊息以便使用者排查問題。
			 * Check message.success to determine if operation succeeded; on success show IDE name,
			 * on failure show error message to help user troubleshoot.
			 */
			case EnumHostCommand.AddCustomIDEComplete:
				if (message.success)
				{
					showMessage(`✓ Custom IDE "${message.name}" added successfully!`, EnumShowMessageType.SUCCESS);
				}
				else
				{
					showMessage(`✗ Failed to add IDE: ${message.error}`, EnumShowMessageType.ERROR);
				}
				break;

			/**
			 * 資料重新整理完成：更新 IDE 列表並持久化
			 * Data refreshed: Update IDE list and persist to state
			 *
			 * 當擴展宿主重新讀取 IDE 資料後，更新前端響應式狀態與持久化狀態，
			 * 確保 UI 顯示與實際資料一致，並在頁面重新整理後仍能還原。
			 * When extension host re-reads IDE data, update frontend reactive state and persistent state,
			 * ensuring UI displays match actual data and can be restored after page refresh.
			 */
			case EnumHostCommand.DataRefreshed:
				if (message.ideList)
				{
					/**
					 * 更新響應式狀態，觸發 UI 重新渲染
					 * Update reactive state to trigger UI re-render
					 */
					ideList.value = message.ideList;

					/**
					 * 持久化到 window 狀態物件，實現跨會話還原
					 * Persist to window state object for cross-session restoration
					 *
					 * 透過 IWebviewWindow 擴充屬性 __INITIAL_STATE__ 保存資料
					 * Save data via IWebviewWindow extended property __INITIAL_STATE__
					 */
					const state = (window as any as IWebviewWindow).__INITIAL_STATE__ ?? {};
					state.ideList = message.ideList;
				}
				break;

			/**
			 * exportPathSelected, importPathSelected, exportComplete, importComplete 由 export-import.ts 處理
			 * exportPathSelected, importPathSelected, exportComplete, importComplete are handled in export-import.ts
			 */
		}
	});
}
