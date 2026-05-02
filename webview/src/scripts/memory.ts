/**
 * UI 狀態持久化模組
 * UI state persistence module
 */

import { vscode } from '../index';
import { showMessage } from './messages';
import { searchQuery, checkedSettingKeys } from '../store';
import { WebviewCommand } from '../webviewMessages';

export function initializeMemory(): void
{
	const state = (window as any).__INITIAL_STATE__ ?? {};
	const savedSearchHistory: string = state.savedSearchHistory ?? '';
	const savedSelectedIDEs: number[] = state.savedSelectedIDEs ?? [];
	const savedSelectedSettings: string[] = state.savedSelectedSettings ?? [];

	const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
	if (searchInput && savedSearchHistory)
	{
		searchInput.value = savedSearchHistory;
		searchQuery.value = savedSearchHistory;
	}

	savedSelectedIDEs.forEach(index =>
	{
		const checkbox = document.querySelector(
			`input.ide-checkbox[data-index="${index}"]`,
		) as HTMLInputElement | null;
		if (checkbox) checkbox.checked = true;
	});

	if (savedSelectedSettings.length > 0 && checkedSettingKeys.value.size === 0)
	{
		checkedSettingKeys.value = new Set(savedSelectedSettings);
	}
}

export function saveSearchHistory(): void
{
	const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
	const searchText = searchInput?.value ?? '';
	const state = (window as any).__INITIAL_STATE__ ?? {};
	state.savedSearchHistory = searchText;
	vscode.postMessage({ command: WebviewCommand.SaveSearchHistory, searchText });
}

export function saveSearchSelectedSettings(): void
{
	const selectedSettings = Array.from(checkedSettingKeys.value);
	const state = (window as any).__INITIAL_STATE__ ?? {};
	state.savedSelectedSettings = selectedSettings;
	vscode.postMessage({ command: WebviewCommand.SaveSelectedSettings, selectedSettings });
	showMessage('✓ Search settings saved', 'success');
}

export function saveAllSelectedSettings(): void
{
	const selectedSettings = Array.from(checkedSettingKeys.value);
	const state = (window as any).__INITIAL_STATE__ ?? {};
	state.savedSelectedSettings = selectedSettings;
	vscode.postMessage({ command: WebviewCommand.SaveSelectedSettings, selectedSettings });
	showMessage('✓ All settings saved', 'success');
}

export function saveSelectedIDEs(): void
{
	const selectedIDEs: number[] = [];
	document.querySelectorAll('.ide-checkbox:checked').forEach(cb =>
	{
		const index = parseInt((cb as HTMLInputElement).dataset.index ?? '');
		if (!isNaN(index)) selectedIDEs.push(index);
	});
	const state = (window as any).__INITIAL_STATE__ ?? {};
	state.savedSelectedIDEs = selectedIDEs;
	vscode.postMessage({ command: WebviewCommand.SaveSelectedIDEs, selectedIDEs });
}
