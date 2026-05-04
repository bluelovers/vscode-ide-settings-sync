/**
 * UI 狀態持久化模組
 * UI state persistence module
 */

import { vscode } from '../global/vscode-api';
import { showMessage } from './messages';
import { searchQuery, checkedSettingKeys } from '../store';
import { EnumWebviewCommand } from '../webviewMessages';
import { EnumShowMessageType } from '../types';
import type { IWebviewWindow } from '../global/window-this';
import { querySelectorById, getClassSelector, querySelectorAllByClass, querySelectorByClass } from '../utils/elem-get';
import { EnumCssClassSelector, EnumWebviewElemId } from '../types/elem-const';

/**
 * 初始化 UI 狀態持久化
 * Initialize UI state persistence
 *
 * 從 window 物件中擷取先前儲存的狀態（搜尋歷史、選中的 IDE 與設定），
 * 並將這些狀態還原到當前的 UI 與信號中，確保使用者體驗的連續性。
 * Retrieve previously saved state (search history, selected IDEs & settings) from the window object,
 * and restore them to the current UI and signals to ensure a continuous user experience.
 */
export function initializeMemory(): void
{
	/**
	 * 從 webview 視窗的擴充屬性中取得初始狀態
	 * Retrieve initial state from the webview window's extended property
	 *
	 * IWebviewWindow 定義了 __INITIAL_STATE__ 屬性，用於跨會話持久化 UI 狀態
	 * IWebviewWindow defines the __INITIAL_STATE__ property for cross-session UI state persistence
	 */
	const state = (window as any as IWebviewWindow).__INITIAL_STATE__ ?? {};

	/**
	 * 還原儲存的搜尋歷史與選取狀態
	 * Restore saved search history and selection states
	 *
	 * 若無儲存值則使用空值作為預設，避免 undefined 錯誤
	 * Use empty defaults when no saved value exists to prevent undefined errors
	 */
	const savedSearchHistory: string = state.savedSearchHistory ?? '';
	const savedSelectedIDEs: number[] = state.savedSelectedIDEs ?? [];
	const savedSelectedSettings: string[] = state.savedSelectedSettings ?? [];

	/**
	 * 還原搜尋輸入框的內容與搜尋查詢信號
	 * Restore search input content and search query signal
	 *
	 * 同步更新 DOM 輸入框與內部響應式狀態，保持一致性
	 * Synchronize DOM input and internal reactive state to maintain consistency
	 */
	const searchInput = querySelectorById<HTMLInputElement>(EnumWebviewElemId.searchInput);
	if (searchInput && savedSearchHistory)
	{
		searchInput.value = savedSearchHistory;
		searchQuery.value = savedSearchHistory;
	}

	/**
	 * 勾選先前選取的 IDE 核取方塊
	 * Check previously selected IDE checkboxes
	 *
	 * 根據儲存的索引找到對應的核取方塊（透過 data-index 屬性匹配），
	 * 並將其設為勾選狀態，還原使用者的 IDE 選取。
	 * Find corresponding checkboxes by saved indexes (matching data-index attribute),
	 * and set them to checked state to restore user's IDE selections.
	 */
	savedSelectedIDEs.forEach(index =>
	{
		const checkbox = querySelectorByClass<HTMLInputElement>(
			EnumCssClassSelector.ideCheckbox,
			`[data-index="${index}"]`,
		);
		if (checkbox) checkbox.checked = true;
	});

	/**
	 * 還原儲存的設定鍵選取（僅在當前未選取任何設定時）
	 * Restore saved setting key selections (only when no settings are currently selected)
	 *
	 * 避免覆蓋使用者在當前會話中的新選取，只在初始化且無選取時才還原。
	 * Avoid overwriting user's new selections in the current session;
	 * only restore when initializing with no current selections.
	 */
	if (savedSelectedSettings.length > 0 && checkedSettingKeys.value.size === 0)
	{
		checkedSettingKeys.value = new Set(savedSelectedSettings);
	}
}

/**
 * 儲存搜尋歷史到持久化狀態與擴充宿主
 * Save search history to persistent state and extension host
 *
 * 當使用者輸入搜尋內容時，將搜尋文字儲存到 window 狀態物件中，
 * 並通知擴充宿主進行持久化，以便下次開啟時還原搜尋內容。
 * When user enters search content, store search text in window state object,
 * and notify extension host to persist it for restoration on next open.
 */
export function saveSearchHistory(): void
{
	/**
	 * 取得搜尋輸入框的值，若無值則使用空字串作為預設
	 * Get search input value; use empty string as default if no value
	 */
	const searchInput = querySelectorById<HTMLInputElement>(EnumWebviewElemId.searchInput);
	const searchText = searchInput?.value ?? '';

	/**
	 * 更新 window 狀態物件中的搜尋歷史
	 * Update search history in window state object
	 *
	 * 透過 IWebviewWindow 擴充屬性 __INITIAL_STATE__ 進行跨會話狀態保存
	 * Cross-session state persistence via IWebviewWindow extended property __INITIAL_STATE__
	 */
	const state = (window as any as IWebviewWindow).__INITIAL_STATE__ ?? {};
	state.savedSearchHistory = searchText;

	/**
	 * 通知擴充宿主保存搜尋歷史，以便持久化到儲存空間
	 * Notify extension host to save search history for persistence to storage
	 */
	vscode.postMessage({ command: EnumWebviewCommand.SaveSearchHistory, searchText });
}

/**
 * 核心函式：保存選取的設定鍵列表到持久化狀態
 * Core function: Save selected setting keys list to persistent state
 *
 * @param selectedSettingsList - 待保存的選取設定鍵集合（可迭代物件）/ Iterable of selected setting keys to save
 * @param message - 保存完成後要顯示的提示訊息 / Message to show after saving
 * @param messageType - 提示訊息的類型（成功/錯誤等）/ Message type (success/error etc.)
 *
 * 為什麼使用 Set 去重：確保儲存的設定鍵唯一，避免重複值占用空間
 * Why use Set for deduplication: Ensures stored setting keys are unique, avoids duplicate values
 */
export function _saveSelectedSettingsListCore(selectedSettingsList: Iterable<string>, message: string, messageType: EnumShowMessageType): void
{
	/**
	 * 對選取的設定鍵進行去重處理
	 * Deduplicate selected setting keys
	 *
	 * 使用 Set 自動過濾重複值，再轉回陣列方便後續處理
	 * Use Set to automatically filter duplicates, then convert back to array for further processing
	 */
	const selectedSettings = Array.from(new Set(selectedSettingsList));

	/**
	 * 更新 window 狀態物件中的已選取設定列表
	 * Update selected settings list in window state object
	 */
	const state = (window as any as IWebviewWindow).__INITIAL_STATE__ ?? {};
	state.savedSelectedSettings = selectedSettings;

	/**
	 * 通知擴充宿主保存設定選取狀態，實現跨會話持久化
	 * Notify extension host to save setting selections for cross-session persistence
	 */
	vscode.postMessage({ command: EnumWebviewCommand.SaveSelectedSettings, selectedSettings });

	/**
	 * 顯示操作結果提示訊息給使用者
	 * Show operation result message to user
	 */
	showMessage(message, messageType);
}

/**
 * 在搜尋面板中將當前選取的設定鍵加入已儲存列表
 * Add currently selected setting keys to saved list from search panel
 *
 * 合併先前儲存的設定與當前搜尋面板中選取的設定，
 * 並透過核心函式進行去重與持久化處理。
 * Merge previously saved settings with currently selected settings in search panel,
 * and perform deduplication and persistence via core function.
 */
export function addSelectedSettingsListOnSearchPanel(): void
{
	/**
	 * 從 window 狀態物件中取得先前儲存的設定列表
	 * Retrieve previously saved settings list from window state object
	 */
	const state = (window as any as IWebviewWindow).__INITIAL_STATE__ ?? {};

	/**
	 * 合併舊有設定與當前新選取的設定，並呼叫核心函式保存
	 * Merge old settings with newly selected ones, and call core function to save
	 *
	 * 使用展開運算子將兩個陣列合併，核心函式會自動去重
	 * Use spread operator to merge two arrays; core function handles deduplication
	 */
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
	querySelectorAllByClass(EnumCssClassSelector.ideCheckbox, ':checked').forEach(cb =>
	{
		const index = parseInt((cb as HTMLInputElement).dataset.index ?? '');
		if (!isNaN(index)) selectedIDEs.push(index);
	});
	const state = (window as any as IWebviewWindow).__INITIAL_STATE__ ?? {};
	state.savedSelectedIDEs = selectedIDEs;
	vscode.postMessage({ command: EnumWebviewCommand.SaveSelectedIDEs, selectedIDEs });
}
