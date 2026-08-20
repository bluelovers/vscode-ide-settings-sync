/**
 * IDE 列表互動模組
 * IDE list interaction module
 */

import { vscode } from '../global/vscode-api';
import { sourceIDEUuid } from '../store';
import { EnumWebviewCommand } from '../webviewMessages';
import { querySelectorAllByClass } from '../utils/elem-get';
import { EnumCssClassSelector } from '../types/elem-const';

/**
 * 向擴展宿主發送移除自定義IDE的請求
 * Send request to extension host to remove custom IDE
 *
 * @param params - 包含要移除的IDE資訊的參數物件 / Parameter object containing IDE info to remove
 * @param params.index - 要移除的IDE在列表中的索引 / Index of the IDE in the list
 * @param params.uuid - 要移除的IDE的唯一識別碼 / Unique UUID of the IDE to remove
 * @param params.name - 要移除的IDE的名稱 / Name of the IDE to remove
 * @param params.nativePath - 要移除的IDE的原生路徑 / Native path of the IDE to remove
 */
export function removeCustomIDE(params: {
	index: number;
	uuid: string;
	name: string;
	nativePath: string;
}): void
{
	vscode.postMessage({ command: EnumWebviewCommand.RemoveCustomIDE, ...params });
}

/**
 * 請求擴展宿主開啟指定IDE的資料夾位置
 * Request extension host to open the folder location of the specified IDE
 *
 * 讓使用者能快速導航到IDE的安裝目錄，方便檢視或修改設定檔
 * Allows user to quickly navigate to IDE installation directory for viewing or modifying config files
 */
export function openIDEFolder(folderPath: string): void
{
	vscode.postMessage({ command: EnumWebviewCommand.OpenIDEFolder, path: folderPath });
}

/**
 * 請求擴展宿主開啟指定 IDE 的設定 JSON 檔案
 * Request extension host to open the settings JSON file for the specified IDE
 *
 * 讓使用者能直接編輯 IDE 的設定檔，提供快速存取設定檔的方式
 * Allows user to directly edit IDE settings file, providing quick access to config
 */
export function openSettingsJson(idePath: string, ideName: string): void
{
	vscode.postMessage({ command: EnumWebviewCommand.OpenSettingsJson, idePath, ideName });
}

/**
 * 觸發添加自定義IDE的流程
 * Trigger the process to add a custom IDE
 *
 * 向擴展宿主發送請求，打開添加自定義IDE的對話框或引導流程
 * Sends request to extension host to open dialog or guide flow for adding custom IDE
 */
export function addCustomIDE(): void
{
	vscode.postMessage({ command: EnumWebviewCommand.RequestAddCustomIDE });
}

/**
 * 請求刷新 IDE 列表
 * Request refresh of IDE list
 *
 * 通知擴展宿主重新讀取 IDE 資料，並更新前端顯示
 * Notify extension host to re-read IDE data and update frontend display
 */
export function refreshIDEs(): void
{
	vscode.postMessage({ command: EnumWebviewCommand.RefreshIDEs });
}

/**
 * 設定內建備份 IDE 的路徑
 * Set the path of the built-in backup IDE
 *
 * 向擴展宿主發送新路徑，擴展宿主驗證後會更新備份 IDE 的路徑並重新偵測。
 * Sends the new path to the extension host; after validation, the host updates
 * the backup IDE's path and re-detects it.
 *
 * @param backupPath - 新的備份路徑（空字串可清除設定）/ New backup path (empty string clears the setting)
 */
export function setBackupIDEPath(backupPath: string): void
{
	vscode.postMessage({ command: EnumWebviewCommand.SetBackupIDEPath, backupPath });
}

export function handleSourceIDEChange(event: Event): void
{
	const target = event.target as HTMLInputElement;
	const newSourceUuid = target.value;

	/**
	 * 只寫入 signal，所有 DOM 更新由 index.tsx 的 effect() 統一處理。
	 * Only write to the signal; all DOM updates are handled centrally by the effect() in index.tsx.
	 */
	sourceIDEUuid.value = newSourceUuid;

	vscode.postMessage({ command: EnumWebviewCommand.SelectSourceIDE, uuid: newSourceUuid });
}

/**
 * 初始化 IDE 事件監聽器
 * Initialize IDE event listeners
 *
 * 為所有 IDE 來源選擇器（單選按鈕）註冊變更事件，
 * 當使用者切換選擇的 IDE 時觸發對應的處理邏輯。
 * Register change events for all IDE source selectors (radio buttons),
 * trigger corresponding handling logic when user switches selected IDE.
 */
export function initIDEEventListeners(): void
{
	/**
	 * 為每個 IDE 來源單選按鈕添加變更監聽
	 * Add change listener to each IDE source radio button
	 *
	 * 使用 querySelectorAllByClass 選取所有具有 ideSourceRadio 類別的元素，
	 * 並為其綁定 handleSourceIDEChange 處理函式。
	 * Use querySelectorAllByClass to select all elements with ideSourceRadio class,
	 * and bind handleSourceIDEChange handler to them.
	 */
	querySelectorAllByClass(EnumCssClassSelector.ideSourceRadio).forEach(radio =>
	{
		radio.addEventListener('change', handleSourceIDEChange);
	});
}
