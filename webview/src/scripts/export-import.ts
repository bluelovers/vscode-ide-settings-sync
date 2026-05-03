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
import { EnumWebviewElemId, queryWebviewElemById } from './elem-get';

export function handleExportCustomIDEs(): void
{
	const customPath = (queryWebviewElemById<HTMLInputElement>(EnumWebviewElemId.exportCustomPath))?.value;
	const includeKnownIDEs =
		(queryWebviewElemById<HTMLInputElement>(EnumWebviewElemId.exportIncludeKnownIDEs))?.checked ?? false;
	vscode.postMessage({ command: EnumWebviewCommand.ExportCustomIDEs, includeKnownIDEs, customPath: customPath || undefined });
}

export function handleExportSelectedSettings(): void
{
	const customPath = (queryWebviewElemById<HTMLInputElement>(EnumWebviewElemId.exportSelectedPath))?.value;
	vscode.postMessage({ command: EnumWebviewCommand.ExportSelectedSettings, customPath: customPath || undefined });
}

export function handleExportAll(): void
{
	const customPath = (queryWebviewElemById<HTMLInputElement>(EnumWebviewElemId.exportAllPath))?.value;
	const includeKnownIDEs =
		(queryWebviewElemById<HTMLInputElement>(EnumWebviewElemId.exportAllIncludeKnownIDEs))?.checked ?? false;
	vscode.postMessage({ command: EnumWebviewCommand.ExportAll, includeKnownIDEs, customPath: customPath || undefined });
}

export function handleImport(): void
{
	const customPath = (queryWebviewElemById<HTMLInputElement>(EnumWebviewElemId.importPath))?.value;
	vscode.postMessage({ command: EnumWebviewCommand.Import, customPath: customPath || undefined });
}

export function handleBrowseExportPath(): void
{
	vscode.postMessage({ command: EnumWebviewCommand.BrowseExportPath });
}

export function handleBrowseImportPath(): void
{
	vscode.postMessage({ command: EnumWebviewCommand.BrowseImportPath });
}

export function initExportImportMessageHandler(): void
{
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
					const el = queryWebviewElemById<HTMLInputElement>(id);
					if (el) el.value = message.path;
				});
				break;

			case EnumHostCommand.ImportPathSelected:
				/**
				 * 更新 importPath signal 並同步填入匯入路徑輸入框
				 * Update importPath signal and sync to import path input
				 */
				importPath.value = message.path ?? '';
				const importEl = queryWebviewElemById<HTMLInputElement>(EnumWebviewElemId.importPath);
				if (importEl) importEl.value = message.path;
				break;

			case EnumHostCommand.ExportComplete:
				if (!message.success) console.error('Export failed:', message.error);
				break;

			case EnumHostCommand.ImportComplete:
				if (!message.success) console.error('Import failed:', message.error);
				break;
		}
	});
}
