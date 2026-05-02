/**
 * 分頁切換模組
 * Tab switching module
 *
 * 處理設定同步面板的分頁切換邏輯。
 * Handles tab switching logic for the settings sync panel.
 *
 * `displayAllSettings` 與 `displaySelectedSettingsList` 定義於 `settings.ts`，
 * 透過 `window` 存取以避免循環依賴（circular dependency）。
 * `displayAllSettings` and `displaySelectedSettingsList` are defined in `settings.ts`,
 * accessed via `window` to avoid circular dependency.
 */

import { IWebviewWindow } from '../global/window-this';

/**
 * 分頁名稱至其對應 `.tab` 按鈕零基索引的對照表
 * Map from tab name to its zero-based index among `.tab` buttons
 *
 * 用於在切換分頁時找到對應的按鈕並加上 `active` class。
 * Used to find the corresponding button and add the `active` class when switching tabs.
 */
const tabIndexMap: Record<string, number> = {
	/** 搜尋與同步設定分頁 / Search and sync settings tab */
	sync: 0,
	/** 所有設定值分頁 / All settings values tab */
	values: 1,
	/** 已選設定列表分頁 / Selected settings list tab */
	selected: 2,
	/** 匯出/匯入分頁 / Export/Import tab */
	'export-import': 3,
};

/**
 * 切換可見的分頁面板並更新對應分頁按鈕的 active 狀態
 * Switch the visible tab panel and update the active state of the corresponding tab button
 *
 * 對於需要動態渲染資料的分頁（values、selected），
 * 切換時會自動觸發對應的顯示函數。
 * For tabs that require dynamic data rendering (values, selected),
 * the corresponding display function is automatically triggered when switching.
 *
 * @param tabName - 目標分頁名稱 / Target tab name: 'sync' | 'values' | 'selected' | 'export-import'
 */
export function switchTab(tabName: string): void
{
	/**
	 * 移除所有分頁內容面板的 active class
	 * Remove active class from all tab content panels
	 */
	document.querySelectorAll('.tab-content').forEach(tab =>
		tab.classList.remove('active'),
	);

	/**
	 * 移除所有分頁按鈕的 active class
	 * Remove active class from all tab buttons
	 */
	document.querySelectorAll('.tab').forEach(tab =>
		tab.classList.remove('active'),
	);

	/**
	 * 啟用目標分頁內容面板
	 * Activate the target tab content panel
	 */
	const content = document.getElementById(tabName);
	content?.classList.add('active');

	/**
	 * 根據 tabIndexMap 找到對應的分頁按鈕並啟用
	 * Find the corresponding tab button via tabIndexMap and activate it
	 */
	const tabs = Array.from(document.querySelectorAll('.tab'));
	const btn = tabs[tabIndexMap[tabName]];
	btn?.classList.add('active');

	/**
	 * 對需要動態渲染的分頁，切換時自動觸發資料顯示函數
	 * For tabs requiring dynamic rendering, automatically trigger data display functions when switching
	 *
	 * 透過 `window` 存取以避免與 settings.ts 產生循環依賴。
	 * Accessed via `window` to avoid circular dependency with settings.ts.
	 */
	if (tabName === 'values')
	{
		try
		{
			(window as any as IWebviewWindow).displayAllSettings?.();
		}
		catch (e)
		{
			console.error('displayAllSettings failed:', e);
		}
	}
	else if (tabName === 'selected')
	{
		try
		{
			(window as any as IWebviewWindow).displaySelectedSettingsList?.();
		}
		catch (e)
		{
			console.error('displaySelectedSettingsList failed:', e);
		}
	}
}
