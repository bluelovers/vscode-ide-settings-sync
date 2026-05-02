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

/**
 * 收集當前已勾選的 IDE 與設定，向 Extension host 發送 `syncSettings` 指令
 * Collect currently checked IDEs and settings, post a `syncSettings` command to the Extension host
 *
 * 前置條件：
 * - 至少需勾選 2 個 IDE（來源 + 至少 1 個目標）
 * - 至少需勾選 1 個設定 key
 *
 * Prerequisites:
 * - At least 2 IDEs must be checked (source + at least 1 target)
 * - At least 1 setting key must be checked
 */
export function syncSettings(): void
{
	/**
	 * 收集所有已勾選的 IDE 索引
	 * Collect all checked IDE indices
	 */
	const selectedIDEs: number[] = [];
	document.querySelectorAll('.ide-checkbox:checked').forEach(cb =>
	{
		const index = parseInt((cb as HTMLInputElement).dataset.index ?? '');
		if (!isNaN(index)) selectedIDEs.push(index);
	});

	/**
	 * 收集所有已勾選的設定 key
	 * Collect all checked setting keys
	 */
	const selectedSettings: string[] = [];
	document.querySelectorAll('.setting-checkbox:checked').forEach(cb =>
	{
		selectedSettings.push((cb as HTMLInputElement).dataset.key ?? '');
	});

	/**
	 * 驗證前置條件：至少需要 2 個 IDE
	 * Validate prerequisite: at least 2 IDEs required
	 */
	if (selectedIDEs.length < 2)
	{
		showMessage('Please select at least 2 IDEs', 'error');
		return;
	}

	/**
	 * 驗證前置條件：至少需要 1 個設定
	 * Validate prerequisite: at least 1 setting required
	 */
	if (selectedSettings.length === 0)
	{
		showMessage('Please select at least one setting to sync', 'error');
		return;
	}

	/**
	 * 取得來源 IDE 的索引，從目標列表中排除來源 IDE
	 * Get the source IDE index, exclude the source IDE from the target list
	 */
	const sourceRadio = document.querySelector('.ide-source-radio:checked') as HTMLInputElement | null;
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
 *
 * 前置條件：
 * - 至少需勾選 1 個 IDE
 * - 至少需勾選 1 個設定 key
 *
 * Prerequisites:
 * - At least 1 IDE must be checked
 * - At least 1 setting key must be checked
 */
export function deleteSettings(): void
{
	/**
	 * 收集所有已勾選的 IDE 索引
	 * Collect all checked IDE indices
	 */
	const selectedIDEs: number[] = [];
	document.querySelectorAll('.ide-checkbox:checked').forEach(cb =>
	{
		const index = parseInt((cb as HTMLInputElement).dataset.index ?? '');
		if (!isNaN(index)) selectedIDEs.push(index);
	});

	/**
	 * 收集所有已勾選的設定 key
	 * Collect all checked setting keys
	 */
	const selectedSettings: string[] = [];
	document.querySelectorAll('.setting-checkbox:checked').forEach(cb =>
	{
		selectedSettings.push((cb as HTMLInputElement).dataset.key ?? '');
	});

	/**
	 * 驗證前置條件：至少需要 1 個 IDE
	 * Validate prerequisite: at least 1 IDE required
	 */
	if (selectedIDEs.length === 0)
	{
		showMessage('Please select at least one IDE', 'error');
		return;
	}

	/**
	 * 驗證前置條件：至少需要 1 個設定
	 * Validate prerequisite: at least 1 setting required
	 */
	if (selectedSettings.length === 0)
	{
		showMessage('Please select at least one setting to delete', 'error');
		return;
	}

	/**
	 * 刪除為不可逆操作，需要使用者明確確認
	 * Delete is an irreversible operation, requires explicit user confirmation
	 */
	if (confirm(`Delete ${selectedSettings.length} setting(s) from ${selectedIDEs.length} IDE(s)?`))
	{
		vscode.postMessage({
			command: 'deleteSettings',
			ideIndices: selectedIDEs,
			settings: selectedSettings,
		});
	}
}
