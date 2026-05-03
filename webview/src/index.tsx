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

export { vscode };

/** ─── Import 腳本模組 / Import script modules ─── */

import { initMessageHandler, showMessage } from './scripts/messages';
import { initializeMemory, saveSelectedIDEs, saveSearchHistory, addSelectedSettingsListOnSearchPanel, addSelectedSettingsListOnAllPanel } from './scripts/memory';
import { initIDEEventListeners } from './scripts/ide';
import { initExportImportMessageHandler } from './scripts/export-import';
import { clearSearch, refreshSettings, clearAllSelectedSettings, removeFromSelectedSettings } from './scripts/settings';
import { syncSettings, deleteSettings } from './scripts/sync';
import { changePrimaryLanguage, openLanguageConfig } from './scripts/language';
import { addCustomIDE, refreshIDEs, removeCustomIDE, openIDEFolder, openSettingsJson } from './scripts/ide';
import { handleExportCustomIDEs, handleExportSelectedSettings, handleExportAll, handleImport, handleBrowseExportPath, handleBrowseImportPath } from './scripts/export-import';

/** ─── Import Preact / Import Preact ─── */

import { effect } from '@preact/signals';
import { hydrate } from 'preact';
import { initStore, sourceIDEUuid, searchQuery, activeTab } from './store';
import { EnumTabName, ALL_TAB_NAMES } from './enums';

/** ─── Import 組件 / Import components ─── */

import { SearchResultsList, AllSettingsList, SelectedSettingsList } from './components/settings/SettingList';
import { SettingsNavigation } from './components/settings/SettingsNavigation';
import { SourceIdeIndicatorContent } from './components/ide/SourceIdeIndicator';
import { EnumCssClassSelector, EnumWebviewElemId, queryWebviewElemByClass, getClassSelector, queryWebviewElemById, queryWebviewElemAllByClass } from './scripts/elem-get';
import { onWebviewReadyMaybe } from './utils/webview-browser';

/** ─── 掛載至 window / Mount to window ─── */

/**
 * 將仍需從 HTML onclick 字串呼叫的函數掛載至 window
 * Mount functions still needed from HTML onclick strings to window
 */
Object.assign(window, {
	showMessage,
	changePrimaryLanguage,
	openLanguageConfig,
	saveSearchHistory,
	addSelectedSettingsListOnSearchPanel,
	addSelectedSettingsListOnAllPanel,
	saveSelectedIDEs,
	clearSearch,
	removeFromSelectedSettings,
	clearAllSelectedSettings,
	refreshSettings,
	syncSettings,
	deleteSettings,
	removeCustomIDE,
	openIDEFolder,
	openSettingsJson,
	addCustomIDE,
	refreshIDEs,
	handleExportCustomIDEs,
	handleExportSelectedSettings,
	handleExportAll,
	handleImport,
	handleBrowseExportPath,
	handleBrowseImportPath,
});

/** ─── 初始化 / Initialization ─── */

function initialize(): void
{
	/**
	 * 初始化來自 Extension host 的訊息處理器
	 * Initialize message handlers from the Extension host
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
	 * Initialize store: read initial values from window.__INITIAL_STATE__ into signals.
	 */
	initStore();

	/**
	 * ─── Preact Hydration + effect() ───
	 *
	 * 只 hydrate 空容器或只渲染子內容的組件，避免重複渲染。
	 * Only hydrate empty containers or components that render only children, avoiding duplication.
	 *
	 * - SourceIdeIndicatorContent：hydrate 至 `.source-ide-indicator`（只渲染子內容，不含外層 div）
	 * - SettingsNavigation：hydrate 至 `.tabs`（只渲染按鈕，不含外層 div）
	 * - SearchResultsList / AllSettingsList / SelectedSettingsList：hydrate 各自的空容器
	 * - Tab 顯示/隱藏：effect() 操作 CSS class
	 */

	/**
	 * Hydrate SourceIdeIndicatorContent 至 `.source-ide-indicator`
	 * 組件只渲染子內容（span 等），不含外層 div，所以不會重複。
	 * Component renders only children (spans etc.), not the outer div, so no duplication.
	 */
	const sourceIndicatorEl = queryWebviewElemByClass<HTMLElement>(EnumCssClassSelector.sourceIdeIndicator);
	if (sourceIndicatorEl)
	{
		hydrate(<SourceIdeIndicatorContent />, sourceIndicatorEl);
	}

	/**
	 * Hydrate SettingsNavigation 至 `.tabs`
	 * 組件只渲染按鈕（Fragment），不含外層 div，所以不會重複。
	 * Component renders only buttons (Fragment), not the outer div, so no duplication.
	 */
	const tabsEl = queryWebviewElemByClass<HTMLElement>(EnumCssClassSelector.tabs);
	if (tabsEl)
	{
		hydrate(<SettingsNavigation />, tabsEl);
	}

	/** Hydrate 搜尋結果列表（#searchResults — SSR 時為空）*/
	const searchResultsEl = queryWebviewElemById<HTMLDivElement>(EnumWebviewElemId.searchResults);
	if (searchResultsEl)
	{
		hydrate(<SearchResultsList />, searchResultsEl);
	}

	/** Hydrate 所有設定列表（#allSettings — SSR 時為空）*/
	const allSettingsEl = queryWebviewElemById<HTMLDivElement>(EnumWebviewElemId.allSettings);
	if (allSettingsEl)
	{
		hydrate(<AllSettingsList />, allSettingsEl);
	}

	/** Hydrate 已選設定列表（#selectedSettingsList — SSR 時為空）*/
	const selectedSettingsEl = queryWebviewElemById<HTMLDivElement>(EnumWebviewElemId.selectedSettingsList);
	if (selectedSettingsEl)
	{
		hydrate(<SelectedSettingsList />, selectedSettingsEl);
	}

	/**
	 * Tab 顯示/隱藏：用 effect() 操作 CSS class
	 * Tab show/hide: use effect() to toggle CSS class
	 */
	effect(() =>
	{
		const tab = activeTab.value;

		/** 更新 tab-content 顯示 / Update tab-content visibility */
		ALL_TAB_NAMES.forEach(id =>
		{
			const el = queryWebviewElemById(id);
			if (el) el.classList.toggle('active', id === tab);
		});
	});

	/**
	 * .ide-item 的 source-ide class 切換
	 * .ide-item source-ide class toggling
	 */
	effect(() =>
	{
		const uuid = sourceIDEUuid.value;
		queryWebviewElemAllByClass(EnumCssClassSelector.ideItem).forEach(item =>
		{
			const checkbox = item.querySelector<HTMLInputElement>(getClassSelector(EnumCssClassSelector.ideCheckbox));
			item.classList.toggle('source-ide', checkbox?.dataset.uuid === uuid);
		});
	});

	/**
	 * 搜尋輸入框 input 事件：更新 searchQuery signal
	 * Search input event: update searchQuery signal
	 */
	const searchInput = queryWebviewElemById<HTMLInputElement>(EnumWebviewElemId.searchInput);
	searchInput?.addEventListener('input', (e) =>
	{
		searchQuery.value = (e.target as HTMLInputElement).value;
		saveSearchHistory();
	});

	/**
	 * 從 window.__INITIAL_STATE__ 恢復已儲存的 UI 狀態
	 * Restore saved UI state from window.__INITIAL_STATE__
	 */
	initializeMemory();

	/**
	 * 為所有 IDE 勾選框綁定 change 事件
	 * Bind change event to all IDE checkboxes
	 */
	queryWebviewElemAllByClass<HTMLInputElement>(EnumCssClassSelector.ideCheckbox).forEach(checkbox =>
	{
		checkbox.addEventListener('change', saveSelectedIDEs);
	});
}

/**
 * 根據 DOM 就緒狀態決定立即執行或延遲至 DOMContentLoaded
 * Decide whether to execute immediately or defer to DOMContentLoaded based on DOM ready state
 */
onWebviewReadyMaybe(initialize);
