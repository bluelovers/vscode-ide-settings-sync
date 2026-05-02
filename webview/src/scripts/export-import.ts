/**
 * 匯出與匯入操作模組
 * Export and import operations module
 */

import { vscode } from '../index';
import { EnumWebviewCommand, EnumHostCommand } from '../webviewMessages';

export function handleExportCustomIDEs(): void
{
	const customPath = (document.getElementById('exportCustomPath') as HTMLInputElement | null)?.value;
	const includeKnownIDEs =
		(document.getElementById('exportIncludeKnownIDEs') as HTMLInputElement | null)?.checked ?? false;
	vscode.postMessage({ command: EnumWebviewCommand.ExportCustomIDEs, includeKnownIDEs, customPath: customPath || undefined });
}

export function handleExportSelectedSettings(): void
{
	const customPath = (document.getElementById('exportSelectedPath') as HTMLInputElement | null)?.value;
	vscode.postMessage({ command: EnumWebviewCommand.ExportSelectedSettings, customPath: customPath || undefined });
}

export function handleExportAll(): void
{
	const customPath = (document.getElementById('exportAllPath') as HTMLInputElement | null)?.value;
	const includeKnownIDEs =
		(document.getElementById('exportAllIncludeKnownIDEs') as HTMLInputElement | null)?.checked ?? false;
	vscode.postMessage({ command: EnumWebviewCommand.ExportAll, includeKnownIDEs, customPath: customPath || undefined });
}

export function handleImport(): void
{
	const customPath = (document.getElementById('importPath') as HTMLInputElement | null)?.value;
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
				['exportCustomPath', 'exportSelectedPath', 'exportAllPath'].forEach(id =>
				{
					const el = document.getElementById(id) as HTMLInputElement | null;
					if (el) el.value = message.path;
				});
				break;

			case EnumHostCommand.ImportPathSelected: {
				const importEl = document.getElementById('importPath') as HTMLInputElement | null;
				if (importEl) importEl.value = message.path;
				break;
			}

			case EnumHostCommand.ExportComplete:
				if (!message.success) console.error('Export failed:', message.error);
				break;

			case EnumHostCommand.ImportComplete:
				if (!message.success) console.error('Import failed:', message.error);
				break;
		}
	});
}
