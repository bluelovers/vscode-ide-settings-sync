/**
 * 匯出與匯入操作模組
 * Export and import operations module
 */

import { vscode } from '../index';
import { WebviewCommand, HostCommand } from '../webviewMessages';

export function handleExportCustomIDEs(): void
{
	const customPath = (document.getElementById('exportCustomPath') as HTMLInputElement | null)?.value;
	const includeKnownIDEs =
		(document.getElementById('exportIncludeKnownIDEs') as HTMLInputElement | null)?.checked ?? false;
	vscode.postMessage({ command: WebviewCommand.ExportCustomIDEs, includeKnownIDEs, customPath: customPath || undefined });
}

export function handleExportSelectedSettings(): void
{
	const customPath = (document.getElementById('exportSelectedPath') as HTMLInputElement | null)?.value;
	vscode.postMessage({ command: WebviewCommand.ExportSelectedSettings, customPath: customPath || undefined });
}

export function handleExportAll(): void
{
	const customPath = (document.getElementById('exportAllPath') as HTMLInputElement | null)?.value;
	const includeKnownIDEs =
		(document.getElementById('exportAllIncludeKnownIDEs') as HTMLInputElement | null)?.checked ?? false;
	vscode.postMessage({ command: WebviewCommand.ExportAll, includeKnownIDEs, customPath: customPath || undefined });
}

export function handleImport(): void
{
	const customPath = (document.getElementById('importPath') as HTMLInputElement | null)?.value;
	vscode.postMessage({ command: WebviewCommand.Import, customPath: customPath || undefined });
}

export function handleBrowseExportPath(): void
{
	vscode.postMessage({ command: WebviewCommand.BrowseExportPath });
}

export function handleBrowseImportPath(): void
{
	vscode.postMessage({ command: WebviewCommand.BrowseImportPath });
}

export function initExportImportMessageHandler(): void
{
	window.addEventListener('message', (event: MessageEvent) =>
	{
		const message = event.data;

		switch (message.command)
		{
			case HostCommand.ExportPathSelected:
				['exportCustomPath', 'exportSelectedPath', 'exportAllPath'].forEach(id =>
				{
					const el = document.getElementById(id) as HTMLInputElement | null;
					if (el) el.value = message.path;
				});
				break;

			case HostCommand.ImportPathSelected: {
				const importEl = document.getElementById('importPath') as HTMLInputElement | null;
				if (importEl) importEl.value = message.path;
				break;
			}

			case HostCommand.ExportComplete:
				if (!message.success) console.error('Export failed:', message.error);
				break;

			case HostCommand.ImportComplete:
				if (!message.success) console.error('Import failed:', message.error);
				break;
		}
	});
}
