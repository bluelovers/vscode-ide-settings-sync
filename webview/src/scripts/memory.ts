/**
 * UI 狀態持久化模組
 * UI state persistence module
 *
 * 在 Webview 啟動時從 `window.__INITIAL_STATE__` 恢復已儲存的 UI 狀態，
 * 並在使用者操作時將狀態變更儲存回 Extension host 的 globalState。
 * Restores saved UI state from `window.__INITIAL_STATE__` when the Webview starts,
 * and saves state changes back to the Extension host's globalState when the user interacts.
 */

import { vscode } from '../index';
import { showMessage } from './messages';

/**
 * 從 `window.__INITIAL_STATE__` 恢復先前儲存的 UI 狀態
 * Restore previously saved UI state from `window.__INITIAL_STATE__`
 *
 * 恢復項目：
 * - 搜尋輸入框的文字
 * - 已勾選的 IDE 勾選框
 * - 已勾選的設定值勾選框
 * - 若搜尋框有值，自動觸發搜尋以立即顯示結果
 *
 * Restored items:
 * - Search input text
 * - Checked IDE checkboxes
 * - Checked setting checkboxes
 * - If search input has a value, automatically trigger search to immediately show results
 */
export function initializeMemory(): void
{
	const state = (window as any).__INITIAL_STATE__ ?? {};
	/** 上次儲存的搜尋字串 / Last saved search string */
	const savedSearchHistory: string = state.savedSearchHistory ?? '';
	/** 上次儲存的已勾選 IDE 索引列表 / Last saved list of checked IDE indices */
	const savedSelectedIDEs: number[] = state.savedSelectedIDEs ?? [];
	/** 上次儲存的已勾選設定 key 列表 / Last saved list of checked setting keys */
	const savedSelectedSettings: string[] = state.savedSelectedSettings ?? [];

	/**
	 * 恢復搜尋字串至輸入框
	 * Restore search string to the input field
	 */
	const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
	if (searchInput && savedSearchHistory)
	{
		searchInput.value = savedSearchHistory;
	}

	/**
	 * 恢復已勾選的 IDE 勾選框
	 * Restore checked IDE checkboxes
	 *
	 * 使用 data-index 屬性定位對應的勾選框。
	 * Uses the data-index attribute to locate the corresponding checkbox.
	 */
	savedSelectedIDEs.forEach(index =>
	{
		const checkbox = document.querySelector(
			`input.ide-checkbox[data-index="${index}"]`,
		) as HTMLInputElement | null;
		if (checkbox) checkbox.checked = true;
	});

	/**
	 * 恢復已勾選的設定值勾選框
	 * Restore checked setting checkboxes
	 *
	 * 設定 key 中的 `.` 替換為 `_` 以符合 HTML id 命名規則。
	 * Dots in setting keys are replaced with `_` to comply with HTML id naming rules.
	 */
	savedSelectedSettings.forEach(key =>
	{
		const settingId = 'setting-' + key.replace(/\./g, '_');
		const checkbox = document.getElementById(settingId) as HTMLInputElement | null;
		if (checkbox) checkbox.checked = true;
	});

	/**
	 * 若搜尋框在初始化後已有值，自動觸發搜尋以立即顯示結果
	 * If the search input has a value after initialization, automatically trigger search to immediately show results
	 */
	if (searchInput?.value?.trim())
	{
		try
		{
			(window as any).searchSettings?.();
		}
		catch (e)
		{
			console.error('searchSettings failed during initializeMemory:', e);
		}
	}
}

/**
 * 將搜尋輸入框的當前值儲存至 Extension host 的 globalState
 * Save the current value of the search input to the Extension host's globalState
 */
export function saveSearchHistory(): void
{
	const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
	const searchText = searchInput?.value ?? '';
	/**
	 * 同步更新 __INITIAL_STATE__ 確保本地狀態與 globalState 一致，
	 * 避免頁面重載後恢復到舊的搜尋字串。
	 * Sync-update __INITIAL_STATE__ to keep local state consistent with globalState,
	 * preventing restoration to an old search string after page reload.
	 */
	const state = (window as any).__INITIAL_STATE__ ?? {};
	state.savedSearchHistory = searchText;
	vscode.postMessage({ command: 'saveSearchHistory', searchText });
}

/**
 * 將 `#searchResults` 中已勾選的設定儲存至 Extension host 的 globalState
 * Save the settings checked inside `#searchResults` to the Extension host's globalState
 *
 * 僅收集搜尋結果區域的勾選框，不影響其他分頁的勾選狀態。
 * Only collects checkboxes in the search results area, does not affect checked state in other tabs.
 */
export function saveSearchSelectedSettings(): void
{
	const selectedSettings: string[] = [];
	document.querySelectorAll('#searchResults .setting-checkbox:checked').forEach(cb =>
	{
		selectedSettings.push((cb as HTMLInputElement).dataset.key ?? '');
	});
	/**
	 * 同步更新 __INITIAL_STATE__ 讓 displaySelectedSettingsList() 能立即讀到最新值。
	 * 若不更新，切換到 Selected 分頁時 getState() 仍回傳舊的空陣列。
	 * Sync-update __INITIAL_STATE__ so displaySelectedSettingsList() can immediately read the latest value.
	 * Without this update, getState() would still return the old empty array when switching to the Selected tab.
	 */
	const state = (window as any).__INITIAL_STATE__ ?? {};
	state.savedSelectedSettings = selectedSettings;
	vscode.postMessage({ command: 'saveSelectedSettings', selectedSettings });
	showMessage('✓ Search settings saved', 'success');
}

/**
 * 將 `#allSettings` 中已勾選的設定儲存至 Extension host 的 globalState
 * Save the settings checked inside `#allSettings` to the Extension host's globalState
 *
 * 僅收集所有設定列表區域的勾選框，不影響其他分頁的勾選狀態。
 * Only collects checkboxes in the all settings list area, does not affect checked state in other tabs.
 */
export function saveAllSelectedSettings(): void
{
	const selectedSettings: string[] = [];
	document.querySelectorAll('#allSettings .setting-checkbox:checked').forEach(cb =>
	{
		selectedSettings.push((cb as HTMLInputElement).dataset.key ?? '');
	});
	/**
	 * 同步更新 __INITIAL_STATE__ 讓 displaySelectedSettingsList() 能立即讀到最新值。
	 * 若不更新，切換到 Selected 分頁時 getState() 仍回傳舊的空陣列。
	 * Sync-update __INITIAL_STATE__ so displaySelectedSettingsList() can immediately read the latest value.
	 * Without this update, getState() would still return the old empty array when switching to the Selected tab.
	 */
	const state = (window as any).__INITIAL_STATE__ ?? {};
	state.savedSelectedSettings = selectedSettings;
	vscode.postMessage({ command: 'saveSelectedSettings', selectedSettings });
	showMessage('✓ All settings saved', 'success');
}

/**
 * 將當前已勾選的 IDE 索引列表儲存至 Extension host 的 globalState
 * Save the currently checked IDE index list to the Extension host's globalState
 */
export function saveSelectedIDEs(): void
{
	const selectedIDEs: number[] = [];
	document.querySelectorAll('.ide-checkbox:checked').forEach(cb =>
	{
		const index = parseInt((cb as HTMLInputElement).dataset.index ?? '');
		if (!isNaN(index)) selectedIDEs.push(index);
	});
	/**
	 * 同步更新 __INITIAL_STATE__ 確保本地狀態與 globalState 一致，
	 * 避免頁面重載後恢復到舊的 IDE 勾選狀態。
	 * Sync-update __INITIAL_STATE__ to keep local state consistent with globalState,
	 * preventing restoration to old IDE checked state after page reload.
	 */
	const state = (window as any).__INITIAL_STATE__ ?? {};
	state.savedSelectedIDEs = selectedIDEs;
	vscode.postMessage({ command: 'saveSelectedIDEs', selectedIDEs });
}
