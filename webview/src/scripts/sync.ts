/**
 * 設定同步與刪除模組
 * Settings sync and delete module
 *
 * 處理跨 IDE 的設定同步與刪除操作。
 * 邏輯從 settingsSyncPanel.ts 的 inline `<script>` 遷移而來。
 * Handles settings sync and delete operations across IDEs.
 * Logic migrated from the inline `<script>` in settingsSyncPanel.ts.
 */

import { vscode } from '../index';
import { showMessage } from './messages';
import { checkedSettingKeys, sourceIDEUuid } from '../store';

/**
 * 收集當前已勾選的 IDE 與設定，向 Extension host 發送 `syncSettings` 指令
 * Collect currently checked IDEs and settings, post a `syncSettings` command to the Extension host
 */
export function syncSettings(): void
{
	/**
	 * 收集所有已勾選的 IDE 索引（IDE 列表仍為 SSR 靜態 HTML，從 DOM 讀取）
	 * Collect all checked IDE indices (IDE list is still SSR static HTML, read from DOM)
	 */
	const selectedIDEs: number[] = [];
	document.querySelectorAll('.ide-checkbox:checked').forEach(cb =>
	{
		const index = parseInt((cb as HTMLInputElement).dataset.index ?? '');
		if (!isNaN(index)) selectedIDEs.push(index);
	});

	/**
	 * 從 checkedSettingKeys signal 讀取已勾選的設定 key（單一來源，不依賴 DOM）
	 * Read checked setting keys from checkedSettingKeys signal (single source of truth, no DOM dependency)
	 */
	const selectedSettings = Array.from(checkedSettingKeys.value);

	if (selectedIDEs.length < 2)
	{
		showMessage('Please select at least 2 IDEs', 'error');
		return;
	}

	if (selectedSettings.length === 0)
	{
		showMessage('Please select at least one setting to sync', 'error');
		return;
	}

	/**
	 * 從 sourceIDEUuid signal 讀取來源 IDE UUID，再從 DOM 找對應的 index
	 * Read source IDE UUID from signal, then find the corresponding index from DOM
	 */
	const uuid = sourceIDEUuid.value;
	const sourceRadio = document.querySelector<HTMLInputElement>(`.ide-source-radio[value="${uuid}"]`);
	const sourceIndex = sourceRadio?.dataset.index;

	vscode.postMessage({
		command: 'syncSettings',
		sourceIDE: sourceIndex,
		targetIDEs: selectedIDEs.filter(index => String(index) !== sourceIndex),
		settings: selectedSettings,
	});
}

/**
 * 收集當前已勾選的 IDE 與設定，在使用者確認後向 Extension host 發送 `deleteSettings` 指令
 * Collect currently checked IDEs and settings, post a `deleteSettings` command to the Extension host after user confirmation
 */
export function deleteSettings(): void
{
	/**
	 * 收集所有已勾選的 IDE 索引（IDE 列表仍為 SSR 靜態 HTML，從 DOM 讀取）
	 * Collect all checked IDE indices (IDE list is still SSR static HTML, read from DOM)
	 */
	const selectedIDEs: number[] = [];
	document.querySelectorAll('.ide-checkbox:checked').forEach(cb =>
	{
		const index = parseInt((cb as HTMLInputElement).dataset.index ?? '');
		if (!isNaN(index)) selectedIDEs.push(index);
	});

	/**
	 * 從 checkedSettingKeys signal 讀取已勾選的設定 key（單一來源，不依賴 DOM）
	 * Read checked setting keys from checkedSettingKeys signal (single source of truth, no DOM dependency)
	 */
	const selectedSettings = Array.from(checkedSettingKeys.value);

	if (selectedIDEs.length === 0)
	{
		showMessage('Please select at least one IDE', 'error');
		return;
	}

	if (selectedSettings.length === 0)
	{
		showMessage('Please select at least one setting to delete', 'error');
		return;
	}

	if (confirm(`Delete ${selectedSettings.length} setting(s) from ${selectedIDEs.length} IDE(s)?`))
	{
		vscode.postMessage({
			command: 'deleteSettings',
			ideIndices: selectedIDEs,
			settings: selectedSettings,
		});
	}
}
