/**
 * IDE 列表互動模組
 * IDE list interaction module
 *
 * 處理 IDE 列表的互動操作：新增/移除自訂 IDE、開啟資料夾與設定檔、來源 IDE 選擇。
 * 邏輯從 `src/webview/components/IDEList.tsx` 的 `IDEListScript` 遷移而來。
 * Handles IDE list interactions: adding/removing custom IDEs, opening folders and settings files, source IDE selection.
 * Logic migrated from `IDEListScript` in `src/webview/components/IDEList.tsx`.
 */

import { vscode } from '../index';
import { sourceIDEName, sourceIDEUuid } from '../store';

/** ─── IDE 管理操作 / IDE management operations ─── */

/**
 * 請求 Extension host 移除指定的自訂 IDE 項目
 * Request the Extension host to remove the specified custom IDE entry
 *
 * @param params - 包含 index、uuid、name、nativePath 的移除參數物件 / Remove params object containing index, uuid, name, nativePath
 */
export function removeCustomIDE(params: {
	/** IDE 在列表中的索引 / IDE index in the list */
	index: number;
	/** IDE 唯一識別符 / IDE unique identifier */
	uuid: string;
	/** IDE 顯示名稱 / IDE display name */
	name: string;
	/** IDE 設定資料夾的實際路徑 / Actual path to the IDE settings folder */
	nativePath: string;
}): void
{
	vscode.postMessage({ command: 'removeCustomIDE', ...params });
}

/**
 * 請求 Extension host 在系統檔案總管中開啟指定的 IDE 資料夾
 * Request the Extension host to reveal the specified IDE folder in the OS file explorer
 *
 * @param folderPath - IDE 資料夾的絕對路徑 / Absolute path to the IDE folder
 */
export function openIDEFolder(folderPath: string): void
{
	vscode.postMessage({ command: 'openIDEFolder', path: folderPath });
}

/**
 * 請求 Extension host 在編輯器中開啟指定 IDE 的 `settings.json` 檔案
 * Request the Extension host to open the `settings.json` file for the specified IDE in the editor
 *
 * @param idePath - IDE 設定資料夾的絕對路徑 / Absolute path to the IDE settings folder
 * @param ideName - IDE 顯示名稱（用於錯誤訊息）/ IDE display name (used in error messages)
 */
export function openSettingsJson(idePath: string, ideName: string): void
{
	vscode.postMessage({ command: 'openSettingsJson', idePath, ideName });
}

/**
 * 請求 Extension host 提示使用者輸入自訂 IDE 的路徑與名稱，並新增至 IDE 列表
 * Request the Extension host to prompt the user for a custom IDE path and name, then add it to the IDE list
 */
export function addCustomIDE(): void
{
	vscode.postMessage({ command: 'requestAddCustomIDE' });
}

/**
 * 請求 Extension host 重新掃描系統中的 IDE 安裝並重建 Webview
 * Request the Extension host to re-scan the system for IDE installations and rebuild the Webview
 */
export function refreshIDEs(): void
{
	vscode.postMessage({ command: 'refreshIDEs' });
}

/** ─── 來源 IDE 選擇 / Source IDE selection ─── */

/**
 * 處理 `.ide-source-radio` 輸入框的 change 事件
 * Handle the change event on `.ide-source-radio` inputs
 *
 * 執行以下操作：
 * 1. 更新來源 IDE 指示器的顯示名稱
 * 2. 切換各 `.ide-item` 的 `source-ide` CSS class
 * 3. 通知 Extension host 新的來源 IDE 選擇（使用 UUID 確保持久化）
 *
 * Performs the following:
 * 1. Updates the source IDE indicator display name
 * 2. Toggles the `source-ide` CSS class on each `.ide-item`
 * 3. Notifies the Extension host of the new source IDE selection (using UUID for persistence)
 *
 * @param event - radio 輸入框觸發的 DOM change 事件 / DOM change event fired by the radio input
 */
export function handleSourceIDEChange(event: Event): void
{
	const target = event.target as HTMLInputElement;
	const newSourceUuid = target.value;

	/**
	 * 只寫入 signal，所有 DOM 更新由 index.tsx 的 effect() 統一處理。
	 * 這確保 SourceIdeIndicator、.ide-item class、設定列表的更新
	 * 都由同一個響應式來源驅動，不散落在各處。
	 *
	 * Only write to the signal; all DOM updates are handled centrally
	 * by the effect() in index.tsx. This ensures SourceIdeIndicator,
	 * .ide-item class toggling, and settings list re-rendering are all
	 * driven by the same reactive source.
	 */
	sourceIDEUuid.value = newSourceUuid;

	vscode.postMessage({ command: 'selectSourceIDE', uuid: newSourceUuid });
}

/** ─── 初始化 / Initialization ─── */

/**
 * 在 DOM 就緒後，為所有 `.ide-source-radio` 元素綁定 `handleSourceIDEChange` 事件監聽
 * After DOM is ready, attach `handleSourceIDEChange` event listener to every `.ide-source-radio` element
 *
 * 使用 DOMContentLoaded 確保 IDE 列表已渲染完成再綁定事件。
 * Uses DOMContentLoaded to ensure the IDE list is fully rendered before binding events.
 */
export function initIDEEventListeners(): void
{
	/**
	 * 此函數在 index.tsx 的 initialize() 中呼叫，
	 * 而 initialize() 已確保在 DOM 就緒後才執行，
	 * 因此直接綁定事件，不需要再套 DOMContentLoaded。
	 * This function is called from initialize() in index.tsx,
	 * which already ensures execution after DOM is ready,
	 * so we bind events directly without wrapping in DOMContentLoaded.
	 */
	document.querySelectorAll('.ide-source-radio').forEach(radio =>
	{
		radio.addEventListener('change', handleSourceIDEChange);
	});
}
