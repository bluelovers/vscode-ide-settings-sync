/**
 * IDE 列表互動模組
 * IDE list interaction module
 */

import { vscode } from '../index';
import { sourceIDEUuid } from '../store';
import { WebviewCommand } from '../webviewMessages';

export function removeCustomIDE(params: {
	index: number;
	uuid: string;
	name: string;
	nativePath: string;
}): void
{
	vscode.postMessage({ command: WebviewCommand.RemoveCustomIDE, ...params });
}

export function openIDEFolder(folderPath: string): void
{
	vscode.postMessage({ command: WebviewCommand.OpenIDEFolder, path: folderPath });
}

export function openSettingsJson(idePath: string, ideName: string): void
{
	vscode.postMessage({ command: WebviewCommand.OpenSettingsJson, idePath, ideName });
}

export function addCustomIDE(): void
{
	vscode.postMessage({ command: WebviewCommand.RequestAddCustomIDE });
}

export function refreshIDEs(): void
{
	vscode.postMessage({ command: WebviewCommand.RefreshIDEs });
}

export function handleSourceIDEChange(event: Event): void
{
	const target = event.target as HTMLInputElement;
	const newSourceUuid = target.value;

	/**
	 * 只寫入 signal，所有 DOM 更新由 index.tsx 的 effect() 統一處理。
	 * Only write to the signal; all DOM updates are handled centrally by the effect() in index.tsx.
	 */
	sourceIDEUuid.value = newSourceUuid;

	vscode.postMessage({ command: WebviewCommand.SelectSourceIDE, uuid: newSourceUuid });
}

export function initIDEEventListeners(): void
{
	document.querySelectorAll('.ide-source-radio').forEach(radio =>
	{
		radio.addEventListener('change', handleSourceIDEChange);
	});
}
