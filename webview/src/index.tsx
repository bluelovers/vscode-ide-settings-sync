/**
 * Webview 前端入口點
 * Webview frontend entry point
 *
 * 由 esbuild 打包為 IIFE bundle（dist/webview/index.js），
 * 在 VS Code Webview 的瀏覽器沙盒環境中執行。
 * Bundled by esbuild as an IIFE bundle (dist/webview/index.js),
 * executed in the VS Code Webview browser sandbox environment.
 */

/**
 * 宣告 acquireVsCodeApi 的 TypeScript 型別
 * Declare TypeScript type for acquireVsCodeApi
 *
 * 此函數由 VS Code 在 Webview 的 iframe 沙盒環境中自動注入，
 * 並非來自任何 npm 套件，因此 TypeScript 無法自動推導其型別。
 * 使用 `declare function` 告訴 TypeScript「這個函數在執行時一定存在，
 * 請相信我的型別宣告」，避免編譯錯誤。
 *
 * This function is automatically injected by VS Code into the Webview iframe sandbox,
 * not from any npm package, so TypeScript cannot infer its type automatically.
 * Using `declare function` tells TypeScript "this function definitely exists at runtime,
 * trust my type declaration", avoiding compilation errors.
 *
 * 注意：此函數與 Extension host 端的 `import * as vscode from 'vscode'` 完全無關——
 * 那是 Node.js 進程的 API；這是瀏覽器沙盒的通訊橋接 API，
 * 兩者在隔離的執行環境中運作，不會互相干擾。
 * Note: This function is completely unrelated to `import * as vscode from 'vscode'` on the Extension host side —
 * that is the Node.js process API; this is the browser sandbox communication bridge API.
 * Both operate in isolated execution environments and do not interfere with each other.
 */
declare function acquireVsCodeApi(): {
	/** 向 Extension host 發送訊息（跨進程通訊）/ Send a message to the Extension host (cross-process communication) */
	postMessage(message: IWebviewMessage): void;
	/** 讀取 Webview 的持久化狀態（頁面重載後仍保留）/ Read the Webview's persisted state (retained after page reload) */
	getState(): IWebviewState;
	/** 寫入 Webview 的持久化狀態 / Write the Webview's persisted state */
	setState(state: IWebviewState): void;
};

/**
 * Webview 與 Extension host 之間的通訊橋接物件
 * Communication bridge object between Webview and Extension host
 *
 * WHY 在模組頂層呼叫：VS Code 規定 `acquireVsCodeApi()` 在整個 Webview
 * 生命週期內只能呼叫一次，重複呼叫會拋出例外。將其放在模組頂層確保：
 * 1. 只執行一次（模組只會被載入一次）
 * 2. 所有 scripts/ 子模組都能透過 `import { vscode } from '../index'`
 *    共享同一個實例，不需要各自呼叫 acquireVsCodeApi()
 *
 * WHY called at module top level: VS Code requires `acquireVsCodeApi()` to be called
 * only once during the entire Webview lifecycle; calling it again throws an exception.
 * Placing it at the module top level ensures:
 * 1. Executed only once (the module is only loaded once)
 * 2. All scripts/ submodules can share the same instance via `import { vscode } from '../index'`,
 *    without each needing to call acquireVsCodeApi() themselves
 *
 * WHY export：讓 scripts/ 下的各模組（messages.ts、sync.ts 等）
 * 可以 import 此實例來呼叫 postMessage，集中管理通訊入口。
 * WHY export: Allows each module under scripts/ (messages.ts, sync.ts, etc.)
 * to import this instance to call postMessage, centralizing the communication entry point.
 */
export const vscode = acquireVsCodeApi();

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
import { IWebviewMessage } from './webviewMessages';
import { IWebviewState, IWebviewWindowApi } from './types';
import { EnumWebviewElemSelector, queryWebviewElem } from './scripts/elem-get';

/** ─── 掛載所有函數至 window / Mount all functions to window ─── */

/**
 * 將所有需要從 HTML `onclick`/`onchange`/`onkeyup` 字串屬性呼叫的函數掛載至 `window`
 * Mount all functions that need to be called from HTML `onclick`/`onchange`/`onkeyup` string attributes to `window`
 *
 * SSR 渲染的 HTML 中使用字串形式的事件屬性（如 `onclick="syncSettings()"`），
 * 這些字串在瀏覽器中執行時會查找 `window` 上的同名函數。
 * 因此必須在 bundle 載入時將所有函數掛載至 `window`，確保事件能正確觸發。
 *
 * The SSR-rendered HTML uses string-form event attributes (e.g. `onclick="syncSettings()"`),
 * which look up same-named functions on `window` when executed in the browser.
 * Therefore all functions must be mounted to `window` when the bundle loads,
 * ensuring events can be triggered correctly.
 */
((extendsApi: IWebviewWindowApi) => Object.assign(window, extendsApi))({
	/** UI 分頁切換 / UI tab switching */
	switchTab,
	/** 顯示狀態訊息 / Display status message */
	showMessage,

	/** 變更主顯示語言 / Change primary display language */
	changePrimaryLanguage,
	/** 開啟語言設定面板 / Open language configuration panel */
	openLanguageConfig,

	/** 儲存搜尋字串至 globalState / Save search string to globalState */
	saveSearchHistory,
	/** 儲存搜尋結果中已勾選的設定並添加到 globalState / Save checked settings from search results and add to globalState */
	addSelectedSettingsListOnSearchPanel,
	/** 儲存所有設定列表中已勾選的設定並添加到 globalState / Save checked settings from all settings list and add to globalState */
	addSelectedSettingsListOnAllPanel,
	/** 儲存已勾選的 IDE 索引 / Save checked IDE indices */
	saveSelectedIDEs,

	/** 依搜尋字串過濾並顯示設定（由 SearchResultsList 組件取代）/ Filter and display settings — replaced by SearchResultsList component */
	// searchSettings: removed, handled by Preact component
	/** 顯示所有 IDE 的設定值（由 AllSettingsList 組件取代）/ Display all IDE settings — replaced by AllSettingsList component */
	// displayAllSettings: removed, handled by Preact component
	/** 顯示已儲存的選取設定列表（由 SelectedSettingsList 組件取代）/ Display selected settings — replaced by SelectedSettingsList component */
	// displaySelectedSettingsList: removed, handled by Preact component
	/** 產生單一設定列的 HTML 字串 / Generate HTML string for a single setting row */
	createSettingHTML,
	/** 查找設定 key 的多語言描述 / Look up multilingual description for a setting key */
	getSettingDescription,
	/** 清除搜尋輸入框與結果 / Clear search input and results */
	clearSearch,
	/** 從已選設定列表中移除單一項目 / Remove a single item from the selected settings list */
	removeFromSelectedSettings,
	/** 清除所有已選設定 / Clear all selected settings */
	clearAllSelectedSettings,
	/** 重新載入設定資料 / Reload settings data */
	refreshSettings,

	/** 同步已選設定至目標 IDE / Sync selected settings to target IDEs */
	syncSettings,
	/** 從已選 IDE 刪除已選設定 / Delete selected settings from selected IDEs */
	deleteSettings,

	/** 移除自訂 IDE / Remove a custom IDE */
	removeCustomIDE,
	/** 在系統檔案總管中開啟 IDE 資料夾 / Open IDE folder in system file explorer */
	openIDEFolder,
	/** 在編輯器中開啟 IDE 的 settings.json / Open IDE's settings.json in editor */
	openSettingsJson,
	/** 新增自訂 IDE 路徑 / Add a custom IDE path */
	addCustomIDE,
	/** 重新掃描系統中的 IDE 安裝 / Re-scan system for IDE installations */
	refreshIDEs,
	/** 處理來源 IDE radio 按鈕的變更事件 / Handle source IDE radio button change event */
	handleSourceIDEChange,

	/** 匯出自訂 IDE 設定 / Export custom IDE configurations */
	handleExportCustomIDEs,
	/** 匯出已選設定 / Export selected settings */
	handleExportSelectedSettings,
	/** 匯出所有設定與 IDE 設定 / Export all settings and IDE configurations */
	handleExportAll,
	/** 從檔案匯入設定 / Import settings from file */
	handleImport,
	/** 開啟匯出路徑選擇對話框 / Open export path selection dialog */
	handleBrowseExportPath,
	/** 開啟匯入檔案選擇對話框 / Open import file selection dialog */
	handleBrowseImportPath,
});

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
