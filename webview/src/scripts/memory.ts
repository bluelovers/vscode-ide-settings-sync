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
import { searchQuery, checkedSettingKeys } from '../store';

/**
 * 從 `window.__INITIAL_STATE__` 恢復先前儲存的 UI 狀態
 * Restore previously saved UI state from `window.__INITIAL_STATE__`
 *
 * 恢復項目：
 * - 搜尋輸入框的文字（同步更新 searchQuery signal）
 * - 已勾選的 IDE 勾選框（仍為 SSR 靜態 HTML，手動操作 DOM）
 * - 已勾選的設定 key（更新 checkedSettingKeys signal，由 SettingItem 組件讀取）
 *
 * Restored items:
 * - Search input text (sync-updates searchQuery signal)
 * - Checked IDE checkboxes (still SSR static HTML, manual DOM manipulation)
 * - Checked setting keys (updates checkedSettingKeys signal, read by SettingItem components)
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
	 * 恢復搜尋字串至輸入框，並更新 searchQuery signal
	 * Restore search string to the input field and update searchQuery signal
	 *
	 * searchQuery signal 更新後，SearchResultsList 組件會自動重新渲染，
	 * 不需要手動呼叫 searchSettings()。
	 * After searchQuery signal updates, SearchResultsList component re-renders automatically,
	 * no need to manually call searchSettings().
	 */
	const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
	if (searchInput && savedSearchHistory)
	{
		searchInput.value = savedSearchHistory;
		searchQuery.value = savedSearchHistory;
	}

	/**
	 * 恢復已勾選的 IDE 勾選框
	 * Restore checked IDE checkboxes
	 *
	 * IDE 列表仍為 SSR 靜態 HTML，需手動操作 DOM。
	 * The IDE list is still SSR static HTML, requiring manual DOM manipulation.
	 */
	savedSelectedIDEs.forEach(index =>
	{
		const checkbox = document.querySelector(
			`input.ide-checkbox[data-index="${index}"]`,
		) as HTMLInputElement | null;
		if (checkbox) checkbox.checked = true;
	});

	/**
	 * 恢復已勾選的設定 key 至 checkedSettingKeys signal
	 * Restore checked setting keys to checkedSettingKeys signal
	 *
	 * hydration 後 SettingItem 組件從 checkedSettingKeys signal 讀取初始勾選狀態，
	 * 不需要手動操作 DOM checkbox。
	 * After hydration, SettingItem components read initial checked state from checkedSettingKeys signal,
	 * no need to manually manipulate DOM checkboxes.
	 *
	 * initStore() 已從 __INITIAL_STATE__.savedSelectedSettings 初始化此 signal，
	 * 此處為防禦性確認，確保兩者一致。
	 * initStore() already initializes this signal from __INITIAL_STATE__.savedSelectedSettings;
	 * this is a defensive confirmation to ensure consistency.
	 */
	if (savedSelectedSettings.length > 0 && checkedSettingKeys.value.size === 0)
	{
		checkedSettingKeys.value = new Set(savedSelectedSettings);
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
	const state = (window as any).__INITIAL_STATE__ ?? {};
	state.savedSearchHistory = searchText;
	vscode.postMessage({ command: 'saveSearchHistory', searchText });
}

/**
 * 將 checkedSettingKeys signal 的當前值儲存至 Extension host 的 globalState
 * Save the current value of checkedSettingKeys signal to the Extension host's globalState
 *
 * hydration 後 checkbox 狀態由 checkedSettingKeys signal 管理，
 * 不再從 DOM 查詢 checkbox。
 * After hydration, checkbox state is managed by checkedSettingKeys signal,
 * no longer querying checkboxes from DOM.
 */
export function saveSearchSelectedSettings(): void
{
	const selectedSettings = Array.from(checkedSettingKeys.value);
	const state = (window as any).__INITIAL_STATE__ ?? {};
	state.savedSelectedSettings = selectedSettings;
	vscode.postMessage({ command: 'saveSelectedSettings', selectedSettings });
	showMessage('✓ Search settings saved', 'success');
}

/**
 * 將 checkedSettingKeys signal 的當前值儲存至 Extension host 的 globalState
 * Save the current value of checkedSettingKeys signal to the Extension host's globalState
 *
 * saveSearchSelectedSettings 與 saveAllSelectedSettings 現在行為相同，
 * 因為 checkedSettingKeys 是跨分頁的全域狀態。
 * saveSearchSelectedSettings and saveAllSelectedSettings now behave identically,
 * because checkedSettingKeys is global state shared across tabs.
 */
export function saveAllSelectedSettings(): void
{
	const selectedSettings = Array.from(checkedSettingKeys.value);
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
	const state = (window as any).__INITIAL_STATE__ ?? {};
	state.savedSelectedIDEs = selectedIDEs;
	vscode.postMessage({ command: 'saveSelectedIDEs', selectedIDEs });
}
