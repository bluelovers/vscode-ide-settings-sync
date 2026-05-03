/**
 * Webview 前端共用響應式狀態 store
 * Webview frontend shared reactive state store
 *
 * 使用 `@preact/signals` 的 signal 作為模組層的共享狀態。
 * 所有需要跨組件共享或響應式更新的狀態都集中在此。
 *
 * Uses `@preact/signals` signals as module-level shared state.
 * All state that needs cross-component sharing or reactive updates is centralized here.
 *
 * 此檔案不得 import 任何 VS Code 或 Node.js 相依模組。
 * This file must NOT import any VS Code or Node.js dependent modules.
 */

import { signal, computed } from '@preact/signals';
import { IWebviewState, IIDEInfoWebview } from './types';
import { IWebviewWindow } from './global/window-types';
import { EnumTabName, ALL_TAB_NAMES } from './enums';
import { EnumCssClassSelector, getClassSelector } from './scripts/elem-get';

/**
 * 當前活躍的分頁名稱
 * Name of the currently active tab
 *
 * 由 `SettingsNavigation` 在使用者點擊 Tab 按鈕時更新。
 * Updated by `SettingsNavigation` when the user clicks a tab button.
 */
export const activeTab = signal<EnumTabName>(EnumTabName.sync);

/** ─── Export/Import 路徑狀態 / Export/Import path state ─── */

/**
 * 匯出路徑（由 message handler 在收到 exportPathSelected 時更新）
 * Export path (updated by message handler when exportPathSelected is received)
 */
export const exportPath = signal<string>('');

/**
 * 匯入路徑（由 message handler 在收到 importPathSelected 時更新）
 * Import path (updated by message handler when importPathSelected is received)
 */
export const importPath = signal<string>('');

/** ─── 來源 IDE 狀態 / Source IDE state ─── */

/**
 * 當前選取的來源 IDE UUID
 * UUID of the currently selected source IDE
 *
 * 由 `handleSourceIDEChange` 在使用者切換 radio 時更新。
 * Updated by `handleSourceIDEChange` when the user switches the radio button.
 */
export const sourceIDEUuid = signal<string>('');

/**
 * 當前選取的來源 IDE 顯示名稱（computed）
 * Display name of the currently selected source IDE (computed)
 *
 * 由 sourceIDEUuid 自動推導：從 ideList signal 中查找對應的 IDE 名稱。
 * 不需要手動維護，uuid 改變時自動重新計算。
 *
 * Automatically derived from sourceIDEUuid: looks up the matching IDE name
 * from the ideList signal. No manual maintenance needed — recomputes
 * automatically whenever sourceIDEUuid changes.
 */
export const sourceIDEName = computed<string>(() =>
{
	const uuid = sourceIDEUuid.value;
	if (!uuid) return 'Not selected';
	return ideList.value.find(ide => ide.uuid === uuid)?.name ?? 'Not selected';
});

/** ─── IDE 列表狀態 / IDE list state ─── */

/**
 * 可用的 IDE 列表
 * List of available IDEs
 *
 * 初始值從 `window.__INITIAL_STATE__.ideList` 讀取。
 * 當 Extension host 發送 refreshData 後，由 messages.ts 更新此 signal。
 *
 * Initial value read from `window.__INITIAL_STATE__.ideList`.
 * Updated by messages.ts when the Extension host sends refreshData.
 */
export const ideList = signal<IIDEInfoWebview[]>([]);

/** ─── 設定列表 UI 狀態 / Settings list UI state ─── */

/**
 * 搜尋輸入框的當前查詢字串
 * Current query string in the search input
 *
 * 由搜尋輸入框的 input 事件更新，驅動搜尋結果的響應式重新渲染。
 * Updated by the search input's input event, drives reactive re-rendering of search results.
 */
export const searchQuery = signal<string>('');

/**
 * 使用者在設定列表中已勾選的設定 key 集合（僅當前頁面，不持久化）
 * Set of setting keys checked by the user in the settings list (current page only, not persisted)
 *
 * 使用 Set 確保唯一性。signal 包裝 Set 時，更新需要建立新的 Set 實例
 * 才能觸發響應式更新（Preact signals 使用參考比較）。
 *
 * Uses Set for uniqueness. When updating a Set wrapped in a signal,
 * a new Set instance must be created to trigger reactive updates
 * (Preact signals use reference comparison).
 */
export const checkedSettingKeys = signal<Set<string>>(new Set());

/** ─── Store 初始化 / Store initialization ─── */

/**
 * 從 `window.__INITIAL_STATE__` 與 DOM 初始化所有 signals
 * Initialize all signals from `window.__INITIAL_STATE__` and DOM
 *
 * 必須在 DOM 就緒後呼叫，確保 radio 已可查詢。
 * Must be called after DOM is ready to ensure radios are queryable.
 */
export function initStore(): void
{
	const state: Partial<IWebviewState> = (window as any as IWebviewWindow).__INITIAL_STATE__ ?? {};

	/**
	 * 初始化 IDE 列表
	 * Initialize IDE list
	 */
	ideList.value = state.ideList ?? [];

	/**
	 * 初始化活躍分頁（預設為 sync）
	 * Initialize active tab (defaults to sync)
	 */
	activeTab.value = EnumTabName.sync;

	/**
	 * 初始化來源 IDE UUID：
	 * 優先從 __INITIAL_STATE__ 讀取，若未提供則從 DOM 中已選取的 radio 讀取
	 *
	 * Initialize source IDE UUID:
	 * Prefer reading from __INITIAL_STATE__;
	 * fall back to the currently checked radio in the DOM
	 */
	const initialSourceUuid =
		state.sourceIDEUuid ??
		document.querySelector<HTMLInputElement>(`${getClassSelector(EnumCssClassSelector.ideSourceRadio)}:checked`)?.value ??
		'';
	sourceIDEUuid.value = initialSourceUuid;

	/**
	 * 初始化搜尋字串（從已儲存的搜尋歷史恢復）
	 * Initialize search query (restored from saved search history)
	 */
	searchQuery.value = state.savedSearchHistory ?? '';

	/**
	 * 初始化已勾選的設定 key（從已儲存的選取設定恢復）
	 * Initialize checked setting keys (restored from saved selected settings)
	 */
	checkedSettingKeys.value = new Set(state.savedSelectedSettings ?? []);
}
