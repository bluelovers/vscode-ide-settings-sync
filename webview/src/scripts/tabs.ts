/**
 * 分頁切換模組（向後相容 wrapper）
 * Tab switching module (backward-compatible wrapper)
 *
 * `switchTab()` 現在是 `activeTab` signal 的薄包裝，
 * 保留此函數以確保向後相容性（若有外部程式碼仍呼叫 `window.switchTab`）。
 *
 * `switchTab()` is now a thin wrapper over the `activeTab` signal,
 * retained for backward compatibility (in case external code still calls `window.switchTab`).
 */

import { activeTab, TabName } from '../store';

/**
 * 切換活躍分頁
 * Switch the active tab
 *
 * 更新 `activeTab` signal，Preact 組件自動響應並更新 UI。
 * Updates the `activeTab` signal; Preact components automatically respond and update the UI.
 *
 * @param tabName - 目標分頁名稱 / Target tab name
 */
export function switchTab(tabName: string): void
{
	const validTabs: TabName[] = ['sync', 'values', 'selected', 'export-import'];
	if (validTabs.includes(tabName as TabName))
	{
		activeTab.value = tabName as TabName;
	}
}
