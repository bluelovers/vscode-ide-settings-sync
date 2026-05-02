/**
 * 匯出與匯入操作模組
 * Export and import operations module
 *
 * 處理 IDE 設定與設定值的匯出及匯入操作。
 * 邏輯從 `src/webview/components/ExportImportPanel.tsx` 的 `ExportImportScript` 遷移而來。
 * Handles export and import operations for IDE settings and configurations.
 * Logic migrated from `ExportImportScript` in `src/webview/components/ExportImportPanel.tsx`.
 */

import { vscode } from '../index';

/** ─── 匯出操作 / Export operations ─── */

/**
 * 匯出自訂 IDE 設定，可選擇是否包含已知 IDE
 * Export custom IDE configurations, optionally including known IDEs
 *
 * 從 `#exportCustomPath` 讀取匯出路徑，從 `#exportIncludeKnownIDEs` 讀取勾選狀態。
 * Reads export path from `#exportCustomPath` and checkbox state from `#exportIncludeKnownIDEs`.
 */
export function handleExportCustomIDEs(): void
{
	const customPath = (document.getElementById('exportCustomPath') as HTMLInputElement | null)?.value;
	const includeKnownIDEs =
		(document.getElementById('exportIncludeKnownIDEs') as HTMLInputElement | null)?.checked ?? false;
	vscode.postMessage({
		command: 'exportCustomIDEs',
		includeKnownIDEs,
		customPath: customPath || undefined,
	});
}

/**
 * 僅匯出使用者已選取的設定
 * Export only the settings selected by the user
 *
 * 從 `#exportSelectedPath` 讀取匯出路徑。
 * Reads export path from `#exportSelectedPath`.
 */
export function handleExportSelectedSettings(): void
{
	const customPath = (document.getElementById('exportSelectedPath') as HTMLInputElement | null)?.value;
	vscode.postMessage({
		command: 'exportSelectedSettings',
		customPath: customPath || undefined,
	});
}

/**
 * 匯出所有設定與 IDE 設定，可選擇是否包含已知 IDE
 * Export all settings and IDE configurations, optionally including known IDEs
 *
 * 從 `#exportAllPath` 讀取匯出路徑，從 `#exportAllIncludeKnownIDEs` 讀取勾選狀態。
 * Reads export path from `#exportAllPath` and checkbox state from `#exportAllIncludeKnownIDEs`.
 */
export function handleExportAll(): void
{
	const customPath = (document.getElementById('exportAllPath') as HTMLInputElement | null)?.value;
	const includeKnownIDEs =
		(document.getElementById('exportAllIncludeKnownIDEs') as HTMLInputElement | null)?.checked ?? false;
	vscode.postMessage({
		command: 'exportAll',
		includeKnownIDEs,
		customPath: customPath || undefined,
	});
}

/** ─── 匯入操作 / Import operations ─── */

/**
 * 從指定檔案匯入設定
 * Import settings from the specified file
 *
 * 從 `#importPath` 讀取匯入檔案路徑。
 * Reads import file path from `#importPath`.
 */
export function handleImport(): void
{
	const customPath = (document.getElementById('importPath') as HTMLInputElement | null)?.value;
	vscode.postMessage({
		command: 'import',
		customPath: customPath || undefined,
	});
}

/** ─── 路徑瀏覽操作 / Path browse operations ─── */

/**
 * 請求 Extension host 開啟資料夾選擇對話框以選取匯出路徑
 * Request the Extension host to open a folder selection dialog for the export path
 */
export function handleBrowseExportPath(): void
{
	vscode.postMessage({ command: 'browseExportPath' });
}

/**
 * 請求 Extension host 開啟檔案選擇對話框以選取匯入檔案
 * Request the Extension host to open a file selection dialog for the import file
 */
export function handleBrowseImportPath(): void
{
	vscode.postMessage({ command: 'browseImportPath' });
}

/** ─── 訊息處理器 / Message handler ─── */

/**
 * 註冊 `window.message` 事件監聽器，處理來自 Extension host 的路徑選擇與操作完成回應
 * Register the `window.message` event listener to handle path selection and operation completion responses from the Extension host
 *
 * 處理的指令：
 * - `exportPathSelected`：將選取的路徑填入所有匯出路徑輸入框
 * - `importPathSelected`：將選取的路徑填入匯入路徑輸入框
 * - `exportComplete`：記錄匯出失敗的錯誤訊息
 * - `importComplete`：記錄匯入失敗的錯誤訊息
 *
 * Handled commands:
 * - `exportPathSelected`: Fill all export path inputs with the selected path
 * - `importPathSelected`: Fill the import path input with the selected path
 * - `exportComplete`: Log export failure error messages
 * - `importComplete`: Log import failure error messages
 */
export function initExportImportMessageHandler(): void
{
	window.addEventListener('message', (event: MessageEvent) =>
	{
		const message = event.data;

		switch (message.command)
		{
			case 'exportPathSelected':
				/**
				 * 將選取的路徑同時填入三個匯出路徑輸入框，方便使用者統一設定
				 * Fill all three export path inputs with the selected path for user convenience
				 */
				['exportCustomPath', 'exportSelectedPath', 'exportAllPath'].forEach(id =>
				{
					const el = document.getElementById(id) as HTMLInputElement | null;
					if (el) el.value = message.path;
				});
				break;

			case 'importPathSelected': {
				const importEl = document.getElementById('importPath') as HTMLInputElement | null;
				if (importEl) importEl.value = message.path;
				break;
			}

			case 'exportComplete':
				/**
				 * 匯出失敗時記錄錯誤，成功時無需額外處理
				 * Log error on export failure; no additional handling needed on success
				 */
				if (!message.success) console.error('Export failed:', message.error);
				break;

			case 'importComplete':
				/**
				 * 匯入失敗時記錄錯誤，成功時無需額外處理
				 * Log error on import failure; no additional handling needed on success
				 */
				if (!message.success) console.error('Import failed:', message.error);
				break;
		}
	});
}
