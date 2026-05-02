/**
 * UI 狀態持久化模組
 * UI state persistence module
 */

import { vscode } from '../index';
import { showMessage } from './messages';
import { searchQuery, checkedSettingKeys } from '../store';
import { EnumWebviewCommand } from '../webviewMessages';
import { EnumShowMessageType, IWebviewWindow } from '../types';

export function initializeMemory(): void
{
	const state = (window as any as IWebviewWindow).__INITIAL_STATE__ ?? {};
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
	const state = (window as any as IWebviewWindow).__INITIAL_STATE__ ?? {};
	state.savedSearchHistory = searchText;
	vscode.postMessage({ command: EnumWebviewCommand.SaveSearchHistory, searchText });
}

export function _saveSelectedSettingsListCore(selectedSettingsList: Iterable<string>, message: string, messageType: EnumShowMessageType): void
{
	const selectedSettings = Array.from(new Set(selectedSettingsList));

	const state = (window as any as IWebviewWindow).__INITIAL_STATE__ ?? {};
	state.savedSelectedSettings = selectedSettings;

	vscode.postMessage({ command: EnumWebviewCommand.SaveSelectedSettings, selectedSettings });

	showMessage(message, messageType);
}

export function addSelectedSettingsListOnSearchPanel(): void
{
	const state = (window as any as IWebviewWindow).__INITIAL_STATE__ ?? {};

	_saveSelectedSettingsListCore([...state.savedSelectedSettings, ...checkedSettingKeys.value], '✓ Selected settings added', EnumShowMessageType.SUCCESS);
}

export function addSelectedSettingsListOnAllPanel(): void
{
	const state = (window as any as IWebviewWindow).__INITIAL_STATE__ ?? {};

	_saveSelectedSettingsListCore([...state.savedSelectedSettings, ...checkedSettingKeys.value], '✓ Selected settings added', EnumShowMessageType.SUCCESS);
}

export function saveSelectedIDEs(): void
{
	const selectedIDEs: number[] = [];
	document.querySelectorAll('.ide-checkbox:checked').forEach(cb =>
	{
		const index = parseInt((cb as HTMLInputElement).dataset.index ?? '');
		if (!isNaN(index)) selectedIDEs.push(index);
	});
	const state = (window as any as IWebviewWindow).__INITIAL_STATE__ ?? {};
	state.savedSelectedIDEs = selectedIDEs;
	vscode.postMessage({ command: EnumWebviewCommand.SaveSelectedIDEs, selectedIDEs });
}
