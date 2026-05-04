/**
 * 設定同步與刪除模組
 * Settings sync and delete module
 *
 * 處理跨 IDE 的設定同步與刪除操作。
 * 邏輯從 settingsSyncPanel.ts 的 inline `<script>` 遷移而來。
 * Handles settings sync and delete operations across IDEs.
 * Logic migrated from the inline `<script>` in settingsSyncPanel.ts.
 */

import { vscode } from '../global/vscode-api';
import { showMessage } from './messages';
import { checkedSettingKeys, sourceIDEUuid } from '../store';
import { EnumWebviewCommand } from '../webviewMessages';
import { EnumShowMessageType } from '../types';
import { getClassSelector, querySelectorAllByClass, querySelectorByClass } from '../utils/elem-get';
import { EnumCssClassSelector } from '../types/elem-const';

/**
 * 收集當前已勾選的 IDE 與設定，向 Extension host 發送 `syncSettings` 指令
 * Collect currently checked IDEs and settings, post a `syncSettings` command to the Extension host
 *
 * 為什麼需要分開收集 IDE 與設定：IDE 列表為 SSR 靜態 HTML，無法使用 signal 響應式追蹤，
 * 而設定 key 則由 checkedSettingKeys signal 統一管理，確保單一來源（Single Source of Truth）。
 * Why separate collection for IDEs vs settings: IDE list is SSR static HTML, cannot use signal reactive tracking,
 * while setting keys are managed by checkedSettingKeys signal to ensure single source of truth.
 */
export function syncSettings(): void
{
	/**
	 * 收集所有已勾選的 IDE 索引（IDE 列表仍為 SSR 靜態 HTML，從 DOM 讀取）
	 * Collect all checked IDE indices (IDE list is still SSR static HTML, read from DOM)
	 *
	 * 為什麼從 DOM 讀取而非 signal：IDE 列表是伺服器端渲染的靜態 HTML，
	 * 尚未遷移至響應式組件，因此需直接查詢 DOM 中的 checkbox 狀態。
	 * Why read from DOM instead of signal: IDE list is server-side rendered static HTML,
	 * not yet migrated to reactive components, so must query checkbox state directly from DOM.
	 */
	const selectedIDEs: number[] = [];
	querySelectorAllByClass(EnumCssClassSelector.ideCheckbox, ':checked').forEach(cb =>
	{
		const index = parseInt((cb as HTMLInputElement).dataset.index ?? '');
		if (!isNaN(index)) selectedIDEs.push(index);
	});

	/**
	 * 從 checkedSettingKeys signal 讀取已勾選的設定 key（單一來源，不依賴 DOM）
	 * Read checked setting keys from checkedSettingKeys signal (single source of truth, no DOM dependency)
	 *
	 * 為什麼使用 signal 而非 DOM：設定列表可能是動態生成的，使用 signal 管理狀態更靈活，
	 * 避免直接操作 DOM 導致的狀態不一致問題。
	 * Why use signal instead of DOM: Setting list may be dynamically generated, using signal for state management
	 * is more flexible and avoids state inconsistency from direct DOM manipulation.
	 */
	const selectedSettings = Array.from(checkedSettingKeys.value);

	if (selectedIDEs.length < 2)
	{
		showMessage('Please select at least 2 IDEs', EnumShowMessageType.ERROR);
		return;
	}

	/**
	 * 驗證：至少需要勾選一個設定才能進行同步
	 * Validation: At least one setting must be checked to perform sync
	 *
	 * 為什麼需要檢查：避免發送空的設定列表導致無意義的同步操作
	 * Why check: Avoid sending empty settings list causing meaningless sync operations
	 */
	if (selectedSettings.length === 0)
	{
		showMessage('Please select at least one setting to sync', EnumShowMessageType.ERROR);
		return;
	}

	/**
	 * 從 sourceIDEUuid signal 讀取來源 IDE UUID，再從 DOM 找對應的 index
	 * Read source IDE UUID from signal, then find the corresponding index from DOM
	 *
	 * 為什麼需要 index：Extension host 使用數字索引而非 UUID 來識別 IDE，
	 * 因此需要從 DOM 的 data-index 屬性中取得對應的索引值。
	 * Why index needed: Extension host uses numeric index instead of UUID to identify IDEs,
	 * so need to get corresponding index from DOM data-index attribute.
	 */
	const uuid = sourceIDEUuid.value;
	/**
	 * 從 DOM 中根據 UUID 查找對應的來源 IDE radio 元素
	 * Find the source IDE radio element from DOM based on UUID
	 *
	 * 為什麼需要從 DOM 查找：雖然有 sourceIDEUuid signal，但 Extension host 需要數字索引，
	 * 因此需要從 DOM 的 data-index 屬性中取得對應的索引值。
	 * Why search from DOM: Although sourceIDEUuid signal exists, Extension host needs numeric index,
	 * so need to get corresponding index from DOM data-index attribute.
	 */
	const sourceRadio = querySelectorByClass<HTMLInputElement>(EnumCssClassSelector.ideSourceRadio, `[value="${uuid}"]`);
	const sourceIndex = sourceRadio?.dataset.index;

	/**
	 * 向 Extension host 發送同步指令
	 * Post sync command to Extension host
	 *
	 * 為什麼過濾掉來源 IDE：避免將設定同步回來源本身，造成不必要的覆寫
	 * Why filter out source IDE: Avoid syncing settings back to source itself, preventing unnecessary overwrites
	 */
	vscode.postMessage({
		command: EnumWebviewCommand.SyncSettings,
		sourceIDE: sourceIndex,
		targetIDEs: selectedIDEs.filter(index => String(index) !== sourceIndex),
		settings: selectedSettings,
	});
}

/**
 * 收集當前已勾選的 IDE 與設定，在使用者確認後向 Extension host 發送 `deleteSettings` 指令
 * Collect currently checked IDEs and settings, post a `deleteSettings` command to the Extension host after user confirmation
 *
 * 為什麼需要使用者確認：刪除設定是破壞性操作，需避免誤操作
 * Why user confirmation is required: Deleting settings is destructive, prevents accidental operations
 */
export function deleteSettings(): void
{
	/**
	 * 收集所有已勾選的 IDE 索引（IDE 列表仍為 SSR 靜態 HTML，從 DOM 讀取）
	 * Collect all checked IDE indices (IDE list is still SSR static HTML, read from DOM)
	 */
	const selectedIDEs: number[] = [];
	querySelectorAllByClass(EnumCssClassSelector.ideCheckbox, ':checked').forEach(cb =>
	{
		const index = parseInt((cb as HTMLInputElement).dataset.index ?? '');
		if (!isNaN(index)) selectedIDEs.push(index);
	});

	/**
	 * 從 checkedSettingKeys signal 讀取已勾選的設定 key（單一來源，不依賴 DOM）
	 * Read checked setting keys from checkedSettingKeys signal (single source of truth, no DOM dependency)
	 */
	const selectedSettings = Array.from(checkedSettingKeys.value);

	if (selectedIDEs.length === 0)
	{
		showMessage('Please select at least one IDE', EnumShowMessageType.ERROR);
		return;
	}

	if (selectedSettings.length === 0)
	{
		showMessage('Please select at least one setting to delete', EnumShowMessageType.ERROR);
		return;
	}

	if (confirm(`Delete ${selectedSettings.length} setting(s) from ${selectedIDEs.length} IDE(s)?`))
	{
		vscode.postMessage({
			command: EnumWebviewCommand.DeleteSettings,
			ideIndices: selectedIDEs,
			settings: selectedSettings,
		});
	}
}
