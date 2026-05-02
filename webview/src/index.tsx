/**
 * Webview 前端入口點
 * Webview frontend entry point
 *
 * 由 esbuild 打包為 IIFE bundle（dist/webview/index.js），
 * 在 VS Code Webview 的瀏覽器沙盒環境中執行。
 * Bundled by esbuild as an IIFE bundle (dist/webview/index.js),
 * executed in the VS Code Webview browser sandbox environment.
 */

import { vscode } from './global/vscode-api';

export { vscode }

/** ─── Import 所有腳本模組 / Import all script modules ─── */

import { initMessageHandler, showMessage } from './scripts/messages';
import { switchTab } from './scripts/tabs';
import { changePrimaryLanguage, openLanguageConfig } from './scripts/language';
import {
	initializeMemory,
	saveSearchHistory,
	addSelectedSettingsListOnSearchPanel,
	addSelectedSettingsListOnAllPanel,
	saveSelectedIDEs,
} from './scripts/memory';
import {
	createSettingHTML,
	getSettingDescription,
	clearSearch,
	removeFromSelectedSettings,
	clearAllSelectedSettings,
	refreshSettings,
} from './scripts/settings';
import { syncSettings, deleteSettings } from './scripts/sync';
import {
	removeCustomIDE,
	openIDEFolder,
	openSettingsJson,
	addCustomIDE,
	refreshIDEs,
	handleSourceIDEChange,
	initIDEEventListeners,
} from './scripts/ide';
import {
	handleExportCustomIDEs,
	handleExportSelectedSettings,
	handleExportAll,
	handleImport,
	handleBrowseExportPath,
	handleBrowseImportPath,
	initExportImportMessageHandler,
} from './scripts/export-import';
import { effect } from '@preact/signals';
import { hydrate } from 'preact';
import { initStore, sourceIDEUuid, sourceIDEName, searchQuery } from './store';
import { SearchResultsList, AllSettingsList, SelectedSettingsList } from './components/settings/SettingList';
import { SourceIdeIndicator } from './components/ide/SourceIdeIndicator';
import { EnumWebviewElemSelector, queryWebviewElem } from './scripts/elem-get';

/** ─── 初始化 / Initialization ─── */

/**
 * 初始化 Webview 前端的所有事件監聽與狀態恢復
 * Initialize all event listeners and state restoration for the Webview frontend
 *
 * 執行順序：
 * 1. 初始化訊息處理器（接收來自 Extension host 的訊息）
 * 2. 初始化 IDE 事件監聽（來源 IDE radio 按鈕）
 * 3. 恢復已儲存的 UI 狀態（搜尋字串、已勾選的 IDE 與設定）
 * 4. 綁定搜尋輸入框與 IDE 勾選框的事件監聽
 *
 * Execution order:
 * 1. Initialize message handlers (receive messages from Extension host)
 * 2. Initialize IDE event listeners (source IDE radio buttons)
 * 3. Restore saved UI state (search string, checked IDEs and settings)
 * 4. Bind event listeners for search input and IDE checkboxes
 */
function initialize(): void
{
	/**
	 * 初始化來自 Extension host 的訊息處理器
	 * Initialize message handlers from the Extension host
	 *
	 * 分別處理一般訊息（syncComplete、deleteComplete 等）
	 * 與匯出入相關訊息（exportPathSelected、importPathSelected 等）。
	 * Handles general messages (syncComplete, deleteComplete, etc.)
	 * and export/import related messages (exportPathSelected, importPathSelected, etc.) separately.
	 */
	initMessageHandler();
	initExportImportMessageHandler();

	/**
	 * 初始化 IDE 來源選擇的 radio 按鈕事件監聽
	 * Initialize radio button event listeners for IDE source selection
	 */
	initIDEEventListeners();

	/**
	 * 初始化 store：從 window.__INITIAL_STATE__ 讀取初始值寫入 signals
	 * 必須在 initIDEEventListeners 之後、initializeMemory 之前呼叫，
	 * 確保 DOM 中的 radio 已可查詢，且 signals 在記憶體恢復前已就緒。
	 * Initialize store: read initial values from window.__INITIAL_STATE__ into signals.
	 * Must be called after initIDEEventListeners and before initializeMemory,
	 * ensuring DOM radios are queryable and signals are ready before memory restoration.
	 */
	initStore();

	/**
	 * ─── Preact Hydration ───
	 *
	 * 將 SSR 靜態 HTML 的關鍵容器接管為 Preact 管理的 virtual DOM 樹。
	 * hydrate() 複用現有 DOM 節點（不重建），避免首次渲染閃爍，
	 * 並讓 @preact/signals 的自動更新機制生效。
	 *
	 * Take over key containers from SSR static HTML into Preact-managed virtual DOM trees.
	 * hydrate() reuses existing DOM nodes (no rebuild), avoiding first-render flicker,
	 * and enables @preact/signals automatic update mechanism.
	 *
	 * hydration 後，這些容器內的 signal 變化會自動觸發 Preact 重新渲染，
	 * 不再需要手動 DOM 操作或 effect() 橋接。
	 *
	 * After hydration, signal changes within these containers automatically trigger
	 * Preact re-renders, eliminating the need for manual DOM operations or effect() bridging.
	 */

	/**
	 * Hydrate SourceIdeIndicator：
	 * 接管後 sourceIDEUuid / sourceIDEName signal 改變時自動更新名稱與 UUID 文字。
	 *
	 * Hydrate SourceIdeIndicator:
	 * After hydration, sourceIDEUuid / sourceIDEName signal changes automatically update
	 * the name and UUID text.
	 */
	const sourceIndicatorEl = document.querySelector<HTMLElement>('.source-ide-indicator');
	if (sourceIndicatorEl)
	{
		hydrate(<SourceIdeIndicator />, sourceIndicatorEl);
	}

	/**
	 * Hydrate 搜尋結果列表（#searchResults）：
	 * 接管後 searchQuery / ideList / sourceIDEUuid / checkedSettingKeys signal 改變時自動重新渲染。
	 * checkbox 狀態由 checkedSettingKeys signal 管理，刷新後不會消失。
	 *
	 * Hydrate search results list (#searchResults):
	 * After hydration, searchQuery / ideList / sourceIDEUuid / checkedSettingKeys signal changes
	 * trigger automatic re-renders. Checkbox state is managed by checkedSettingKeys signal
	 * and persists across refreshes.
	 */
	const searchResultsEl = queryWebviewElem<HTMLDivElement>(EnumWebviewElemSelector.searchResults);
	if (searchResultsEl)
	{
		hydrate(<SearchResultsList />, searchResultsEl);
	}

	/**
	 * Hydrate 所有設定列表（#allSettings）：
	 * 接管後 ideList / sourceIDEUuid / checkedSettingKeys signal 改變時自動重新渲染。
	 *
	 * Hydrate all settings list (#allSettings):
	 * After hydration, ideList / sourceIDEUuid / checkedSettingKeys signal changes
	 * trigger automatic re-renders.
	 */
	const allSettingsEl = document.getElementById('allSettings');
	if (allSettingsEl)
	{
		hydrate(<AllSettingsList />, allSettingsEl);
	}

	/**
	 * Hydrate 已選設定列表（#selectedSettingsList）：
	 * 接管後 checkedSettingKeys / ideList signal 改變時自動重新渲染。
	 *
	 * Hydrate selected settings list (#selectedSettingsList):
	 * After hydration, checkedSettingKeys / ideList signal changes trigger automatic re-renders.
	 */
	const selectedSettingsEl = document.getElementById('selectedSettingsList');
	if (selectedSettingsEl)
	{
		hydrate(<SelectedSettingsList />, selectedSettingsEl);
	}

	/**
	 * .ide-item 的 source-ide class 切換仍需 effect()，
	 * 因為 IDE 列表（.ide-list）尚未 hydrate，仍是 SSR 靜態 HTML。
	 * 這是唯一保留的手動 DOM 操作。
	 *
	 * .ide-item source-ide class toggling still requires effect(),
	 * because the IDE list (.ide-list) is not yet hydrated and remains SSR static HTML.
	 * This is the only remaining manual DOM operation.
	 */
	effect(() =>
	{
		const uuid = sourceIDEUuid.value;
		document.querySelectorAll('.ide-item').forEach(item =>
		{
			const checkbox = item.querySelector<HTMLInputElement>('.ide-checkbox');
			item.classList.toggle('source-ide', checkbox?.dataset.uuid === uuid);
		});
	});

	/**
	 * 從 window.__INITIAL_STATE__ 恢復已儲存的 UI 狀態
	 * Restore saved UI state from window.__INITIAL_STATE__
	 */
	initializeMemory();

	/**
	 * 為搜尋輸入框綁定 input 事件：
	 * 1. 更新 searchQuery signal，驅動 SearchResultsList 自動重新渲染
	 * 2. 儲存搜尋字串至 globalState（持久化）
	 *
	 * Bind input event to search input:
	 * 1. Update searchQuery signal to drive SearchResultsList automatic re-render
	 * 2. Save search string to globalState (persistence)
	 */
	const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
	searchInput?.addEventListener('input', (e) =>
	{
		searchQuery.value = (e.target as HTMLInputElement).value;
		saveSearchHistory();
	});

	/**
	 * 為所有 IDE 勾選框綁定 change 事件，自動儲存勾選狀態至 globalState
	 * Bind change event to all IDE checkboxes for automatic saving of checked state to globalState
	 */
	document.querySelectorAll('.ide-checkbox').forEach(checkbox =>
	{
		checkbox.addEventListener('change', saveSelectedIDEs);
	});
}

/**
 * 根據 DOM 就緒狀態決定立即執行或延遲至 DOMContentLoaded
 * Decide whether to execute immediately or defer to DOMContentLoaded based on DOM ready state
 *
 * Webview bundle 以 `<script src="...">` 方式在 `<body>` 末尾載入，
 * 通常 DOM 已就緒，但仍做防禦性判斷以確保相容性。
 * The Webview bundle is loaded via `<script src="...">` at the end of `<body>`,
 * so the DOM is usually ready, but a defensive check is still made for compatibility.
 */
if (document.readyState === 'loading')
{
	document.addEventListener('DOMContentLoaded', initialize);
}
else
{
	initialize();
}
