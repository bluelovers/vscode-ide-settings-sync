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
	postMessage(message: any): void;
	/** 讀取 Webview 的持久化狀態（頁面重載後仍保留）/ Read the Webview's persisted state (retained after page reload) */
	getState(): any;
	/** 寫入 Webview 的持久化狀態 / Write the Webview's persisted state */
	setState(state: any): void;
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
	saveSearchSelectedSettings,
	saveAllSelectedSettings,
	saveSelectedIDEs,
} from './scripts/memory';
import {
	searchSettings,
	displayAllSettings,
	displaySelectedSettingsList,
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
import { initStore, sourceIDEUuid, sourceIDEName } from './store';

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
Object.assign(window, {
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
	/** 儲存搜尋結果中已勾選的設定 / Save checked settings from search results */
	saveSearchSelectedSettings,
	/** 儲存所有設定列表中已勾選的設定 / Save checked settings from all settings list */
	saveAllSelectedSettings,
	/** 儲存已勾選的 IDE 索引 / Save checked IDE indices */
	saveSelectedIDEs,

	/** 依搜尋字串過濾並顯示設定 / Filter and display settings by search string */
	searchSettings,
	/** 顯示所有 IDE 的設定值 / Display all IDE setting values */
	displayAllSettings,
	/** 顯示已儲存的選取設定列表 / Display saved selected settings list */
	displaySelectedSettingsList,
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
	 * 註冊 sourceIDEUuid signal 的 effect：
	 * 當來源 IDE 切換時，統一處理所有相關 DOM 更新。
	 *
	 * Register effect for sourceIDEUuid signal:
	 * When the source IDE changes, handle all related DOM updates centrally.
	 *
	 * ─── 為什麼需要手動操作 DOM？/ Why manual DOM manipulation is necessary ───
	 *
	 * `SourceIdeIndicator`、`.ide-item` 等元素是由 Extension host 透過
	 * `preact-render-to-string` 做 SSR 產生的靜態 HTML 字串，
	 * 在瀏覽器端沒有對應的 Preact 組件實例，也沒有 virtual DOM。
	 *
	 * `SourceIdeIndicator` and `.ide-item` elements are static HTML strings
	 * generated server-side by the Extension host via `preact-render-to-string`.
	 * There are no corresponding Preact component instances or virtual DOM on the client side.
	 *
	 * `@preact/signals` 的自動 DOM 更新（signal 直接作為 JSX 屬性）只在
	 * Preact 管理的 virtual DOM 樹中有效。沒有 hydration，signal 改變時
	 * Preact 無從得知哪個 DOM 節點需要更新，因此必須透過 effect() 手動橋接。
	 *
	 * The automatic DOM updates of `@preact/signals` (signals used directly as JSX props)
	 * only work within a Preact-managed virtual DOM tree. Without hydration, Preact has
	 * no knowledge of which DOM nodes to update when a signal changes, so we must
	 * bridge the gap manually via effect().
	 *
	 * 若未來引入 Preact client-side render（hydration），可將這些 DOM 操作
	 * 移回組件內，讓 signal 直接驅動 JSX 重新渲染，消除手動橋接的需要。
	 *
	 * If Preact client-side render (hydration) is introduced in the future,
	 * these DOM operations can be moved back into components, letting signals
	 * drive JSX re-renders directly and eliminating the need for manual bridging.
	 *
	 * effect() 會在 signal 值改變時自動執行，不需要手動呼叫。
	 * effect() runs automatically whenever the signal value changes.
	 */
	effect(() =>
	{
		const uuid = sourceIDEUuid.value;
		/*
		 * sourceIDEName 是 computed，讀取它會建立對 sourceIDEUuid 的間接依賴，
		 * 但 effect 已直接依賴 sourceIDEUuid，所以這裡只是取值。
		 * sourceIDEName is computed; reading it here just gets the derived value
		 * since the effect already depends on sourceIDEUuid directly.
		 */
		const name = sourceIDEName.value;

		/**
		 * 1. 更新 SourceIdeIndicator 的名稱與 UUID
		 *
		 * SourceIdeIndicator 是 SSR 靜態 HTML，沒有 Preact 組件實例，
		 * signal 改變不會自動觸發它重新渲染，必須手動更新對應的 DOM 節點。
		 * 名稱（.source-name-text）與 UUID（.source-uuid）分開放在獨立 span，
		 * 確保更新其中一個時不會覆蓋另一個的內容。
		 *
		 * 1. Update SourceIdeIndicator name and UUID
		 *
		 * SourceIdeIndicator is SSR static HTML with no Preact component instance;
		 * signal changes do not trigger automatic re-renders, so we must update
		 * the corresponding DOM nodes manually. Name (.source-name-text) and UUID
		 * (.source-uuid) are in separate spans so updating one does not overwrite the other.
		 */
		document.querySelectorAll('.source-ide-indicator .source-name-text').forEach(el =>
		{
			(el as HTMLElement).textContent = name;
		});
		document.querySelectorAll('.source-ide-indicator .source-uuid').forEach(el =>
		{
			(el as HTMLElement).textContent = uuid;
		});

		/**
		 * 2. 切換各 IDE 項目的 source-ide class
		 *
		 * 同上，.ide-item 是 SSR 靜態 HTML，需手動切換 class。
		 *
		 * 2. Toggle source-ide class on each IDE item
		 *
		 * Same reason — .ide-item is SSR static HTML, class must be toggled manually.
		 */
		document.querySelectorAll('.ide-item').forEach(item =>
		{
			const checkbox = item.querySelector<HTMLInputElement>('.ide-checkbox');
			item.classList.toggle('source-ide', checkbox?.dataset.uuid === uuid);
		});

		/**
		 * 3. 重新渲染當前可見分頁的設定列表
		 *
		 * 設定列表（searchSettings / displayAllSettings）是動態產生的 innerHTML，
		 * 需要重新執行才能反映新的 sourceUuid（標記哪個 IDE 是來源）。
		 * 僅重新渲染當前可見分頁，避免不必要的 DOM 操作。
		 *
		 * 3. Re-render the settings list for the currently visible tab
		 *
		 * The settings list (searchSettings / displayAllSettings) is dynamically generated
		 * innerHTML that must be re-executed to reflect the new sourceUuid (marking which
		 * IDE is the source). Only the currently visible tab is re-rendered to avoid
		 * unnecessary DOM operations.
		 */
		const syncTab = document.getElementById('sync');
		if (syncTab?.classList.contains('active'))
		{
			try { searchSettings(); }
			catch (e) { console.error('searchSettings failed in sourceIDEUuid effect:', e); }
		}

		const valuesTab = document.getElementById('values');
		if (valuesTab?.classList.contains('active'))
		{
			try { displayAllSettings(); }
			catch (e) { console.error('displayAllSettings failed in sourceIDEUuid effect:', e); }
		}
	});

	/**
	 * 從 window.__INITIAL_STATE__ 恢復已儲存的 UI 狀態
	 * Restore saved UI state from window.__INITIAL_STATE__
	 */
	initializeMemory();

	/**
	 * 為搜尋輸入框綁定 input 事件，即時儲存搜尋字串至 globalState
	 * Bind input event to search input for real-time saving of search string to globalState
	 */
	const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
	searchInput?.addEventListener('input', saveSearchHistory);

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
