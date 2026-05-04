/**
 * 匯出與匯入操作模組
 * Export and import operations module
 *
 * 從 DOM input 讀取路徑值，由 window 掛載後供 onclick 字串呼叫。
 * Reads path values from DOM inputs, mounted to window for onclick string calls.
 */

import { vscode } from '../global/vscode-api';
import { exportPath, importPath } from '../store';
import { EnumWebviewCommand, EnumHostCommand } from '../webviewMessages';
import { querySelectorById } from '../utils/elem-get';
import { EnumWebviewElemId } from '../types/elem-const';

/**
 * 處理匯出自訂 IDE 設定操作
 * Handle export custom IDEs settings operation
 *
 * 從 DOM 匯出自訂路徑輸入框與包含已知 IDE 選項讀取值，
 * 通知擴充匯出使用者自訂的 IDE 設定。
 * Reads custom export path and include-known-IDEs option from DOM,
 * notifies extension to export user's custom IDE settings.
 */
export function handleExportCustomIDEs(): void
{
	const customPath = (querySelectorById<HTMLInputElement>(EnumWebviewElemId.exportCustomPath))?.value;
	const includeKnownIDEs =
		(querySelectorById<HTMLInputElement>(EnumWebviewElemId.exportIncludeKnownIDEs))?.checked ?? false;
	/**
	 * 傳送匯出命令給擴充，若路徑為空則傳 undefined 避免傳送空字串
	 * Send export command to extension, use undefined if path is empty to avoid sending empty string
	 */
	vscode.postMessage({ command: EnumWebviewCommand.ExportCustomIDEs, includeKnownIDEs, customPath: customPath || undefined });
}

/**
 * 處理匯出選取設定操作
 * Handle export selected settings operation
 *
 * 當使用者選取特定設定項目並觸發匯出時，從 DOM 讀取自訂匯出路徑，
 * 通知擴充匯出選取的設定內容。
 * When user selects specific settings and triggers export, reads custom export path from DOM,
 * notifies extension to export selected settings.
 */
export function handleExportSelectedSettings(): void
{
	const customPath = (querySelectorById<HTMLInputElement>(EnumWebviewElemId.exportSelectedPath))?.value;
	vscode.postMessage({ command: EnumWebviewCommand.ExportSelectedSettings, customPath: customPath || undefined });
}

/**
 * 處理匯出所有設定操作
 * Handle export all settings operation
 *
 * 從 DOM 匯出全部路徑輸入框與包含已知 IDE 選項讀取值，
 * 通知擴充匯出所有相關設定。
 * Reads export all path and include-known-IDEs option from DOM,
 * notifies extension to export all related settings.
 */
export function handleExportAll(): void
{
	const customPath = (querySelectorById<HTMLInputElement>(EnumWebviewElemId.exportAllPath))?.value;
	const includeKnownIDEs =
		(querySelectorById<HTMLInputElement>(EnumWebviewElemId.exportAllIncludeKnownIDEs))?.checked ?? false;
	vscode.postMessage({ command: EnumWebviewCommand.ExportAll, includeKnownIDEs, customPath: customPath || undefined });
}

/**
 * 處理匯入操作
 * Handle import operation
 *
 * 從 DOM 匯入路徑輸入框讀取值，通知擴充執行設定匯入。
 * Reads import path from DOM input, notifies extension to execute settings import.
 */
export function handleImport(): void
{
	const customPath = (querySelectorById<HTMLInputElement>(EnumWebviewElemId.importPath))?.value;
	vscode.postMessage({ command: EnumWebviewCommand.Import, customPath: customPath || undefined });
}

/**
 * 處理瀏覽匯出路徑操作
 * Handle browse export path operation
 *
 * 通知擴充開啟系統檔案選擇對話框，讓使用者選擇匯出目標路徑。
 * Notifies extension to open system file picker dialog for user to select export target path.
 */
export function handleBrowseExportPath(): void
{
	vscode.postMessage({ command: EnumWebviewCommand.BrowseExportPath });
}

/**
 * 處理瀏覽匯入路徑操作
 * Handle browse import path operation
 *
 * 通知擴充開啟系統檔案選擇對話框，讓使用者選擇匯入來源路徑。
 * Notifies extension to open system file picker dialog for user to select import source path.
 */
export function handleBrowseImportPath(): void
{
	vscode.postMessage({ command: EnumWebviewCommand.BrowseImportPath });
}

/**
 * 初始化匯出/匯入訊息處理器
 * Initialize export/import message handler
 *
 * 監聽來自擴充的 message 事件，根據命令類型處理：
 * - 匯出路徑選擇完成：更新路徑並同步至所有匯出輸入框
 * - 匯入路徑選擇完成：更新路徑並填入匯入輸入框
 * - 匯出/匯入完成：檢查成功與否並記錄錯誤
 * Listens for messages from extension, handling:
 * - Export path selected: update path and sync to all export inputs
 * - Import path selected: update path and fill import input
 * - Export/Import complete: check success and log errors
 */
export function initExportImportMessageHandler(): void
{
	/**
	 * 監聽擴充發送的 message 事件，根據命令類型處理匯出/匯入相關邏輯
	 * Listen for message events sent from the extension, handle export/import logic based on command type
	 */
	window.addEventListener('message', (event: MessageEvent) =>
	{
		const message = event.data;

		switch (message.command)
		{
			case EnumHostCommand.ExportPathSelected:
				/**
				 * 更新 exportPath signal 並同步填入所有匯出路徑輸入框
				 * Update exportPath signal and sync to all export path inputs
				 */
				exportPath.value = message.path ?? '';
				[EnumWebviewElemId.exportCustomPath, EnumWebviewElemId.exportSelectedPath, EnumWebviewElemId.exportAllPath].forEach(id =>
				{
					const el = querySelectorById<HTMLInputElement>(id);
					if (el) el.value = message.path;
				});
				break;

			case EnumHostCommand.ImportPathSelected:
				/**
				 * 更新 importPath signal 並同步填入匯入路徑輸入框
				 * Update importPath signal and sync to import path input
				 */
				importPath.value = message.path ?? '';
				const importEl = querySelectorById<HTMLInputElement>(EnumWebviewElemId.importPath);
				if (importEl) importEl.value = message.path;
				break;

			case EnumHostCommand.ExportComplete:
				/**
				 * 匯出完成後檢查結果，若失敗則記錄錯誤訊息
				 * After export completes, check result and log error if failed
				 */
				if (!message.success) console.error('Export failed:', message.error);
				break;

			case EnumHostCommand.ImportComplete:
				/**
				 * 匯入完成後檢查結果，若失敗則記錄錯誤訊息
				 * After import completes, check result and log error if failed
				 */
				if (!message.success) console.error('Import failed:', message.error);
				break;
		}
	});
}
