/**
 * Webview ↔ Extension host 訊息協議定義
 * Webview ↔ Extension host message protocol definitions
 *
 * 此檔案是 Webview 與 Extension host 之間所有訊息的單一事實來源（Single Source of Truth）。
 * 所有 `panel.webview.postMessage`、`panel.webview.onDidReceiveMessage`、
 * 以及 Webview 端的 `vscode.postMessage` 都必須使用此處定義的型別。
 *
 * This file is the Single Source of Truth for all messages between Webview and Extension host.
 * All `panel.webview.postMessage`, `panel.webview.onDidReceiveMessage`,
 * and Webview-side `vscode.postMessage` calls must use the types defined here.
 *
 * ─── 訊息方向 / Message directions ───
 *
 * Webview → Extension host：使用者操作觸發，由 Webview 發送至 Extension host 處理
 * Extension host → Webview：操作完成或資料更新，由 Extension host 推送至 Webview
 *
 * Webview → Extension host: User actions trigger messages sent from Webview to Extension host
 * Extension host → Webview: Operation completion or data updates pushed from Extension host to Webview
 *
 * ─── 使用方式 / Usage ───
 *
 * Extension host 端（settingsSyncPanel.ts）：
 *   import { WebviewCommand, HostCommand, IWebviewMessage, IHostMessage } from './webviewMessages';
 *   this.postToWebview({ command: HostCommand.SyncComplete } satisfies IHostMessage);
 *   panel.webview.onDidReceiveMessage((msg: IWebviewMessage) => { ... })
 *
 * Webview 端（scripts/*.ts）：
 *   import { WebviewCommand, HostCommand } from '../webviewMessages';
 *   vscode.postMessage({ command: WebviewCommand.SyncSettings, ... } satisfies IWebviewMessage);
 *
 * 此檔案不得 import 任何 VS Code 或 Node.js 相依模組，
 * 確保 Webview bundle 在瀏覽器沙盒中可獨立使用。
 * This file must NOT import any VS Code or Node.js dependent modules,
 * ensuring the Webview bundle can run independently in the browser sandbox.
 */

import { IIDEInfoWebview } from '../../webview/src/types';

/** ═══════════════════════════════════════════════════════════
 *  Webview → Extension host 指令枚舉
 *  Webview → Extension host command enum
 * ═══════════════════════════════════════════════════════════ */

export const enum EnumWebviewCommand
{
	/**
	 * 請求 Extension host 彈出 VS Code 輸入框，讓使用者輸入自訂 IDE 路徑與名稱
	 *  Request Extension host to show VS Code input boxes for custom IDE path and name
	 */
	RequestAddCustomIDE = 'requestAddCustomIDE',

	/**
	 * 直接新增自訂 IDE（含路徑與名稱，不彈出輸入框）
	 *  Add custom IDE directly with path and name (no input box)
	 */
	AddCustomIDE = 'addCustomIDE',

	/**
	 * 移除指定的自訂 IDE 項目
	 *  Remove the specified custom IDE entry
	 */
	RemoveCustomIDE = 'removeCustomIDE',

	/**
	 * 設定內建備份 IDE 的路徑
	 *  Set the path of the built-in backup IDE
	 */
	SetBackupIDEPath = 'setBackupIDEPath',

	/**
	 * 在系統檔案總管中開啟指定的 IDE 資料夾
	 *  Reveal the specified IDE folder in the OS file explorer
	 */
	OpenIDEFolder = 'openIDEFolder',

	/**
	 * 在 VS Code 編輯器中開啟指定 IDE 的 settings.json
	 *  Open the specified IDE's settings.json in the VS Code editor
	 */
	OpenSettingsJson = 'openSettingsJson',

	/**
	 * 將來源 IDE 的已選設定同步至目標 IDE 列表
	 *  Sync selected settings from the source IDE to the target IDE list
	 */
	SyncSettings = 'syncSettings',

	/**
	 * 從指定 IDE 列表中刪除已選設定
	 *  Delete selected settings from the specified IDE list
	 */
	DeleteSettings = 'deleteSettings',

	/**
	 * 重新掃描系統中的 IDE 安裝（IDE 列表結構可能改變，觸發整頁重繪）
	 *  Re-scan IDE installations on the system (IDE list structure may change, triggers full redraw)
	 */
	RefreshIDEs = 'refreshIDEs',

	/**
	 * 重新讀取各 IDE 的設定值（IDE 列表結構不變，使用 pushDataRefresh 推送更新）
	 *  Reload setting values for each IDE (IDE list structure unchanged, uses pushDataRefresh)
	 */
	RefreshData = 'refreshData',

	/**
	 * 變更 Webview 的主顯示語言
	 *  Change the primary display language of the Webview
	 */
	ChangePrimaryLanguage = 'changePrimaryLanguage',

	/**
	 * 透過 VS Code 指令開啟語言設定面板
	 *  Open the language configuration panel via VS Code command
	 */
	OpenLanguageConfig = 'openLanguageConfig',

	/**
	 * 將搜尋輸入框的當前值儲存至 Extension host 的 globalState
	 *  Save the current search input value to the Extension host's globalState
	 */
	SaveSearchHistory = 'saveSearchHistory',

	/**
	 * 將已勾選的設定 key 列表儲存至 Extension host 的 globalState
	 *  Save the list of checked setting keys to the Extension host's globalState
	 */
	SaveSelectedSettings = 'saveSelectedSettings',

	/**
	 * 將已勾選的 IDE 索引列表儲存至 Extension host 的 globalState
	 *  Save the list of checked IDE indices to the Extension host's globalState
	 */
	SaveSelectedIDEs = 'saveSelectedIDEs',

	/**
	 * 選取來源 IDE 並將其 UUID 持久化至 Extension host 的 globalState
	 *  Select the source IDE and persist its UUID to the Extension host's globalState
	 */
	SelectSourceIDE = 'selectSourceIDE',

	/**
	 * 請求 Extension host 開啟資料夾選擇對話框以選取匯出路徑
	 *  Request Extension host to open a folder selection dialog for the export path
	 */
	BrowseExportPath = 'browseExportPath',

	/**
	 * 請求 Extension host 開啟檔案選擇對話框以選取匯入檔案
	 *  Request Extension host to open a file selection dialog for the import file
	 */
	BrowseImportPath = 'browseImportPath',

	/**
	 * 匯出自訂 IDE 設定至 JSON 檔案
	 *  Export custom IDE configurations to a JSON file
	 */
	ExportCustomIDEs = 'exportCustomIDEs',

	/**
	 * 匯出使用者已選取的設定 key 列表至 JSON 檔案
	 *  Export the user's selected setting key list to a JSON file
	 */
	ExportSelectedSettings = 'exportSelectedSettings',

	/**
	 * 匯出所有設定（自訂 IDE + 已選設定）至 JSON 檔案
	 *  Export all settings (custom IDEs + selected settings) to a JSON file
	 */
	ExportAll = 'exportAll',

	/**
	 * 從指定的 JSON 檔案匯入設定
	 *  Import settings from the specified JSON file
	 */
	Import = 'import',
}

/** ═══════════════════════════════════════════════════════════
 *  Extension host → Webview 指令枚舉
 *  Extension host → Webview command enum
 * ═══════════════════════════════════════════════════════════ */

export const enum EnumHostCommand
{
	/**
	 * 設定同步操作完成，Webview 顯示成功訊息
	 *  Settings sync operation complete; Webview shows success message
	 */
	SyncComplete = 'syncComplete',

	/**
	 * 設定刪除操作完成，Webview 顯示成功訊息
	 *  Settings delete operation complete; Webview shows success message
	 */
	DeleteComplete = 'deleteComplete',

	/**
	 * 新增自訂 IDE 操作完成，回傳成功或失敗結果
	 *  Add custom IDE operation complete; returns success or failure result
	 */
	AddCustomIDEComplete = 'addCustomIDEComplete',

	/**
	 * 更新內建備份 IDE 路徑完成，回傳成功或失敗結果
	 *  Backup IDE path update complete; returns success or failure result
	 */
	BackupIDEPathUpdated = 'backupIDEPathUpdated',

	/**
	 * 推送最新的 IDE 設定資料（不整頁重繪）
	 *  Push the latest IDE settings data without full page redraw.
	 *  觸發時機：syncSettings、deleteSettings、refreshData 完成後
	 *  Triggered after: syncSettings, deleteSettings, refreshData complete
	 */
	DataRefreshed = 'dataRefreshed',

	/**
	 * 使用者已選取匯出路徑，回傳所選路徑字串
	 *  User has selected an export path; returns the selected path string
	 */
	ExportPathSelected = 'exportPathSelected',

	/**
	 * 使用者已選取匯入檔案，回傳所選路徑字串
	 *  User has selected an import file; returns the selected path string
	 */
	ImportPathSelected = 'importPathSelected',

	/**
	 * 匯出操作完成，回傳成功或失敗結果
	 *  Export operation complete; returns success or failure result
	 */
	ExportComplete = 'exportComplete',

	/**
	 * 匯入操作完成，回傳成功或失敗結果
	 *  Import operation complete; returns success or failure result
	 */
	ImportComplete = 'importComplete',
}

/** ═══════════════════════════════════════════════════════════
 *  Webview → Extension host 訊息型別
 *  Webview → Extension host message types
 * ═══════════════════════════════════════════════════════════ */

/**
 * 請求 Extension host 彈出 VS Code 輸入框，讓使用者輸入自訂 IDE 路徑與名稱
 * Request Extension host to show VS Code input boxes for custom IDE path and name
 */
/**
 * 請求 Extension host 彈出 VS Code 輸入框，請使用者輸入自訂 IDE 路徑與名稱
 * Request Extension host to show VS Code input boxes for custom IDE path and name
 */
export interface IMsg_RequestAddCustomIDE
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.RequestAddCustomIDE;
}

/**
 * 直接新增自訂 IDE（含路徑與名稱，不彈出輸入框）
 * Add custom IDE directly with path and name (no input box)
 */
export interface IMsg_AddCustomIDE
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.AddCustomIDE;
	/** 自訂 IDE 的顯示名稱 / Display name for the custom IDE */
	name: string;
	/** IDE 設定資料夾的絕對路徑 / Absolute path to the IDE settings folder */
	path: string;
}

/**
 * 移除指定的自訂 IDE 項目
 * Remove the specified custom IDE entry
 */
export interface IMsg_RemoveCustomIDE
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.RemoveCustomIDE;
	/** IDE 在列表中的索引 / IDE index in the list */
	index: number;
	/** IDE 唯一識別符 / IDE unique identifier */
	uuid: string;
	/** IDE 顯示名稱（用於確認對話框）/ IDE display name (used in confirmation dialog) */
	name: string;
	/** IDE 設定資料夾的實際路徑 / Actual path to the IDE settings folder */
	nativePath: string;
}

/**
 * 設定內建備份 IDE 的路徑
 * Set the path of the built-in backup IDE
 */
export interface IMsg_SetBackupIDEPath
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.SetBackupIDEPath;
	/** 新的備份 IDE 路徑（空字串可清除設定）/ New backup IDE path (empty string clears the setting) */
	backupPath: string;
}

/**
 * 在系統檔案總管中開啟指定的 IDE 資料夾
 * Reveal the specified IDE folder in the OS file explorer
 */
export interface IMsg_OpenIDEFolder
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.OpenIDEFolder;
	/** IDE 資料夾的絕對路徑 / Absolute path to the IDE folder */
	path: string;
}

/**
 * 在 VS Code 編輯器中開啟指定 IDE 的 settings.json
 * Open the specified IDE's settings.json in the VS Code editor
 */
export interface IMsg_OpenSettingsJson
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.OpenSettingsJson;
	/** IDE 設定資料夾的絕對路徑 / Absolute path to the IDE settings folder */
	idePath: string;
	/** IDE 顯示名稱（用於錯誤訊息）/ IDE display name (used in error messages) */
	ideName: string;
}

/**
 * 將來源 IDE 的已選設定同步至目標 IDE 列表
 * Sync selected settings from the source IDE to the target IDE list
 */
export interface IMsg_SyncSettings
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.SyncSettings;
	/**
	 * 來源 IDE 的索引字串（從 DOM radio 的 data-index 讀取，Extension host 端需 parseInt）
	 *  Source IDE index string (read from DOM radio data-index; Extension host must parseInt)
	 */
	sourceIDE: string | undefined;
	/** 目標 IDE 的索引列表 / List of target IDE indices */
	targetIDEs: number[];
	/** 要同步的設定 key 列表 / List of setting keys to sync */
	settings: string[];
}

/**
 * 從指定 IDE 列表中刪除已選設定
 * Delete selected settings from the specified IDE list
 */
export interface IMsg_DeleteSettings
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.DeleteSettings;
	/** 要刪除設定的 IDE 索引列表 / List of IDE indices to delete settings from */
	ideIndices: number[];
	/** 要刪除的設定 key 列表 / List of setting keys to delete */
	settings: string[];
}

/**
 * 重新掃描系統中的 IDE 安裝（IDE 列表結構可能改變，觸發整頁重繪）
 * Re-scan IDE installations on the system (IDE list structure may change, triggers full redraw)
 */
export interface IMsg_RefreshIDEs
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.RefreshIDEs;
}

/**
 * 重新讀取各 IDE 的設定值（IDE 列表結構不變，使用 pushDataRefresh 推送更新）
 * Reload setting values for each IDE (IDE list structure unchanged, uses pushDataRefresh)
 */
export interface IMsg_RefreshData
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.RefreshData;
}

/**
 * 變更 Webview 的主顯示語言
 * Change the primary display language of the Webview
 */
export interface IMsg_ChangePrimaryLanguage
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.ChangePrimaryLanguage;
	/** 新的語言代碼（如 'en'、'zh-tw'）/ New language code (e.g. 'en', 'zh-tw') */
	language: string;
}

/**
 * 透過 VS Code 指令開啟語言設定面板
 * Open the language configuration panel via VS Code command
 */
export interface IMsg_OpenLanguageConfig
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.OpenLanguageConfig;
}

/**
 * 將搜尋輸入框的當前值儲存至 Extension host 的 globalState
 * Save the current search input value to the Extension host's globalState
 */
export interface IMsg_SaveSearchHistory
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.SaveSearchHistory;
	/** 要儲存的搜尋字串 / Search string to save */
	searchText: string;
}

/**
 * 將已勾選的設定 key 列表儲存至 Extension host 的 globalState
 * Save the list of checked setting keys to the Extension host's globalState
 */
export interface IMsg_SaveSelectedSettings
{
	/** 訊息指令 / Message command */
	command: EnumWebviewCommand.SaveSelectedSettings;
	/** 已勾選的設定 key 列表 / List of checked setting keys */
	selectedSettings: string[];
}

/**
 * 將已勾選的 IDE 索引列表儲存至 Extension host 的 globalState
 * Save the list of checked IDE indices to the Extension host's globalState
 */
export interface IMsg_SaveSelectedIDEs
{
	command: EnumWebviewCommand.SaveSelectedIDEs;
	/** 已勾選的 IDE 索引列表 / List of checked IDE indices */
	selectedIDEs: number[];
}

/**
 * 選取來源 IDE 並將其 UUID 持久化至 Extension host 的 globalState
 * Select the source IDE and persist its UUID to the Extension host's globalState
 */
export interface IMsg_SelectSourceIDE
{
	command: EnumWebviewCommand.SelectSourceIDE;
	/** 來源 IDE 的唯一識別符 / UUID of the source IDE */
	uuid: string;
	/** 來源 IDE 的顯示名稱（可選，用於 UI 顯示）/ Source IDE display name (optional, for UI display) */
	name?: string;
}

/**
 * 請求 Extension host 開啟資料夾選擇對話框以選取匯出路徑
 * Request Extension host to open a folder selection dialog for the export path
 */
export interface IMsg_BrowseExportPath
{
	command: EnumWebviewCommand.BrowseExportPath;
}

/**
 * 請求 Extension host 開啟檔案選擇對話框以選取匯入檔案
 * Request Extension host to open a file selection dialog for the import file
 */
export interface IMsg_BrowseImportPath
{
	command: EnumWebviewCommand.BrowseImportPath;
}

/**
 * 匯出自訂 IDE 設定至 JSON 檔案
 * Export custom IDE configurations to a JSON file
 */
export interface IMsg_ExportCustomIDEs
{
	command: EnumWebviewCommand.ExportCustomIDEs;
	/** 是否包含已知的內建 IDE / Whether to include known built-in IDEs */
	includeKnownIDEs: boolean;
	/** 自訂匯出路徑（未指定時由 Extension host 彈出對話框）/ Custom export path (Extension host shows dialog if not specified) */
	customPath?: string;
}

/**
 * 匯出使用者已選取的設定 key 列表至 JSON 檔案
 * Export the user's selected setting key list to a JSON file
 */
export interface IMsg_ExportSelectedSettings
{
	command: EnumWebviewCommand.ExportSelectedSettings;
	/** 自訂匯出路徑（未指定時由 Extension host 彈出對話框）/ Custom export path (Extension host shows dialog if not specified) */
	customPath?: string;
}

/**
 * 匯出所有設定（自訂 IDE + 已選設定）至 JSON 檔案
 * Export all settings (custom IDEs + selected settings) to a JSON file
 */
export interface IMsg_ExportAll
{
	command: EnumWebviewCommand.ExportAll;
	/** 是否包含已知的內建 IDE / Whether to include known built-in IDEs */
	includeKnownIDEs: boolean;
	/** 自訂匯出路徑（未指定時由 Extension host 彈出對話框）/ Custom export path (Extension host shows dialog if not specified) */
	customPath?: string;
}

/**
 * 從指定的 JSON 檔案匯入設定
 * Import settings from the specified JSON file
 */
export interface IMsg_Import
{
	command: EnumWebviewCommand.Import;
	/**
	 * 自訂匯入檔案路徑（未指定時由 Extension host 彈出對話框）
	 * Custom import file path (Extension host shows dialog if not specified)
	 */
	customPath?: string;
}

/**
 * Webview → Extension host 所有訊息的聯合型別
 * Union type of all Webview → Extension host messages
 */
export type IWebviewMessage =
	| IMsg_RequestAddCustomIDE
	| IMsg_AddCustomIDE
	| IMsg_RemoveCustomIDE
	| IMsg_SetBackupIDEPath
	| IMsg_OpenIDEFolder
	| IMsg_OpenSettingsJson
	| IMsg_SyncSettings
	| IMsg_DeleteSettings
	| IMsg_RefreshIDEs
	| IMsg_RefreshData
	| IMsg_ChangePrimaryLanguage
	| IMsg_OpenLanguageConfig
	| IMsg_SaveSearchHistory
	| IMsg_SaveSelectedSettings
	| IMsg_SaveSelectedIDEs
	| IMsg_SelectSourceIDE
	| IMsg_BrowseExportPath
	| IMsg_BrowseImportPath
	| IMsg_ExportCustomIDEs
	| IMsg_ExportSelectedSettings
	| IMsg_ExportAll
	| IMsg_Import;

/** ═══════════════════════════════════════════════════════════
 *  Extension host → Webview 訊息型別
 *  Extension host → Webview message types
 * ═══════════════════════════════════════════════════════════ */

/**
 * 設定同步操作完成，Webview 顯示成功訊息
 * Settings sync operation complete; Webview shows success message
 *
 * Extension host 在發送此訊息後會緊接著推送 DataRefreshed，
 * Webview 端不需要主動請求資料更新。
 * Extension host pushes DataRefreshed immediately after this message;
 * Webview does not need to actively request a data update.
 */
export interface IMsg_SyncComplete
{
	command: EnumHostCommand.SyncComplete;
}

/**
 * 設定刪除操作完成，Webview 顯示成功訊息
 * Settings delete operation complete; Webview shows success message
 *
 * Extension host 在發送此訊息後會緊接著推送 DataRefreshed。
 * Extension host pushes DataRefreshed immediately after this message.
 */
export interface IMsg_DeleteComplete
{
	command: EnumHostCommand.DeleteComplete;
}

/**
 * 新增自訂 IDE 操作完成，回傳成功或失敗結果
 * Add custom IDE operation complete; returns success or failure result
 */
export interface IMsg_AddCustomIDEComplete
{
	command: EnumHostCommand.AddCustomIDEComplete;
	/** 操作是否成功 / Whether the operation succeeded */
	success: boolean;
	/** 成功時：新增的 IDE 顯示名稱 / On success: display name of the added IDE */
	name?: string;
	/** 失敗時：錯誤訊息字串 / On failure: error message string */
	error?: string;
}

/**
 * 更新內建備份 IDE 路徑完成，回傳成功或失敗結果
 * Backup IDE path update complete; returns success or failure result
 */
export interface IMsg_BackupIDEPathUpdated
{
	command: EnumHostCommand.BackupIDEPathUpdated;
	/** 操作是否成功 / Whether the operation succeeded */
	success: boolean;
	/** 失敗時：錯誤訊息字串 / On failure: error message string */
	error?: string;
}

/**
 * 推送最新的 IDE 設定資料（不整頁重繪）
 * Push the latest IDE settings data without full page redraw
 *
 * 觸發時機：syncSettings、deleteSettings、refreshData 完成後
 * Triggered after: syncSettings, deleteSettings, refreshData complete
 *
 * Webview 端收到後更新 ideList signal，Preact 組件自動重新渲染，
 * checkbox 勾選狀態、分頁位置、搜尋字串等 UI 狀態完整保留。
 * Webview updates ideList signal on receipt; Preact components re-render automatically.
 * Checkbox state, tab position, search string, and other UI state are fully preserved.
 */
export interface IMsg_DataRefreshed
{
	command: EnumHostCommand.DataRefreshed;
	/** 最新的 IDE 列表（含各 IDE 的設定鍵值對）/ Latest IDE list (including each IDE's setting key-value pairs) */
	ideList: IIDEInfoWebview[];
}

/**
 * 使用者已選取匯出路徑，回傳所選路徑字串
 * User has selected an export path; returns the selected path string
 *
 * Webview 端將此路徑填入所有匯出路徑輸入框。
 * Webview fills all export path inputs with this path.
 */
export interface IMsg_ExportPathSelected
{
	command: EnumHostCommand.ExportPathSelected;
	/** 使用者選取的資料夾絕對路徑 / Absolute path of the folder selected by the user */
	path: string;
}

/**
 * 使用者已選取匯入檔案，回傳所選路徑字串
 * User has selected an import file; returns the selected path string
 *
 * Webview 端將此路徑填入匯入路徑輸入框。
 * Webview fills the import path input with this path.
 */
export interface IMsg_ImportPathSelected
{
	command: EnumHostCommand.ImportPathSelected;
	/** 使用者選取的檔案絕對路徑 / Absolute path of the file selected by the user */
	path: string;
}

/**
 * 匯出操作完成，回傳成功或失敗結果
 * Export operation complete; returns success or failure result
 */
export interface IMsg_ExportComplete
{
	command: EnumHostCommand.ExportComplete;
	/** 操作是否成功 / Whether the operation succeeded */
	success: boolean;
	/** 失敗時：錯誤訊息字串 / On failure: error message string */
	error?: string;
}

/**
 * 匯入操作完成，回傳成功或失敗結果
 * Import operation complete; returns success or failure result
 */
export interface IMsg_ImportComplete
{
	command: EnumHostCommand.ImportComplete;
	/** 操作是否成功 / Whether the operation succeeded */
	success: boolean;
	/** 失敗時：錯誤訊息字串 / On failure: error message string */
	error?: string;
}

/**
 * Extension host → Webview 所有訊息的聯合型別
 * Union type of all Extension host → Webview messages
 */
export type IHostMessage =
	| IMsg_SyncComplete
	| IMsg_DeleteComplete
	| IMsg_AddCustomIDEComplete
	| IMsg_BackupIDEPathUpdated
	| IMsg_DataRefreshed
	| IMsg_ExportPathSelected
	| IMsg_ImportPathSelected
	| IMsg_ExportComplete
	| IMsg_ImportComplete;

/**
 * Message event interface for TypeScript type safety
 */
export interface IWebviewWindowMessageEvent
{
	data: IHostMessage;
}

