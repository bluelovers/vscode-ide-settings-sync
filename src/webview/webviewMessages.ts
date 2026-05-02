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
 *   this.panel.webview.postMessage({ command: HostCommand.SyncComplete } satisfies IHostMessage);
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

export const enum WebviewCommand
{
	RequestAddCustomIDE = 'requestAddCustomIDE',
	AddCustomIDE = 'addCustomIDE',
	RemoveCustomIDE = 'removeCustomIDE',
	OpenIDEFolder = 'openIDEFolder',
	OpenSettingsJson = 'openSettingsJson',
	SyncSettings = 'syncSettings',
	DeleteSettings = 'deleteSettings',
	RefreshIDEs = 'refreshIDEs',
	RefreshData = 'refreshData',
	ChangePrimaryLanguage = 'changePrimaryLanguage',
	OpenLanguageConfig = 'openLanguageConfig',
	SaveSearchHistory = 'saveSearchHistory',
	SaveSelectedSettings = 'saveSelectedSettings',
	SaveSelectedIDEs = 'saveSelectedIDEs',
	SelectSourceIDE = 'selectSourceIDE',
	BrowseExportPath = 'browseExportPath',
	BrowseImportPath = 'browseImportPath',
	ExportCustomIDEs = 'exportCustomIDEs',
	ExportSelectedSettings = 'exportSelectedSettings',
	ExportAll = 'exportAll',
	Import = 'import',
}

/** ═══════════════════════════════════════════════════════════
 *  Extension host → Webview 指令枚舉
 *  Extension host → Webview command enum
 * ═══════════════════════════════════════════════════════════ */

export const enum HostCommand
{
	SyncComplete = 'syncComplete',
	DeleteComplete = 'deleteComplete',
	AddCustomIDEComplete = 'addCustomIDEComplete',
	DataRefreshed = 'dataRefreshed',
	ExportPathSelected = 'exportPathSelected',
	ImportPathSelected = 'importPathSelected',
	ExportComplete = 'exportComplete',
	ImportComplete = 'importComplete',
}

/** ═══════════════════════════════════════════════════════════
 *  Webview → Extension host 訊息型別
 *  Webview → Extension host message types
 * ═══════════════════════════════════════════════════════════ */

export interface IMsg_RequestAddCustomIDE
{
	command: WebviewCommand.RequestAddCustomIDE;
}

export interface IMsg_AddCustomIDE
{
	command: WebviewCommand.AddCustomIDE;
	name: string;
	path: string;
}

export interface IMsg_RemoveCustomIDE
{
	command: WebviewCommand.RemoveCustomIDE;
	index: number;
	uuid: string;
	name: string;
	nativePath: string;
}

export interface IMsg_OpenIDEFolder
{
	command: WebviewCommand.OpenIDEFolder;
	path: string;
}

export interface IMsg_OpenSettingsJson
{
	command: WebviewCommand.OpenSettingsJson;
	idePath: string;
	ideName: string;
}

export interface IMsg_SyncSettings
{
	command: WebviewCommand.SyncSettings;
	/** 來源 IDE 的索引字串（從 DOM radio 的 data-index 讀取）/ Source IDE index string (read from DOM radio data-index) */
	sourceIDE: string | undefined;
	targetIDEs: number[];
	settings: string[];
}

export interface IMsg_DeleteSettings
{
	command: WebviewCommand.DeleteSettings;
	ideIndices: number[];
	settings: string[];
}

export interface IMsg_RefreshIDEs
{
	command: WebviewCommand.RefreshIDEs;
}

export interface IMsg_RefreshData
{
	command: WebviewCommand.RefreshData;
}

export interface IMsg_ChangePrimaryLanguage
{
	command: WebviewCommand.ChangePrimaryLanguage;
	language: string;
}

export interface IMsg_OpenLanguageConfig
{
	command: WebviewCommand.OpenLanguageConfig;
}

export interface IMsg_SaveSearchHistory
{
	command: WebviewCommand.SaveSearchHistory;
	searchText: string;
}

export interface IMsg_SaveSelectedSettings
{
	command: WebviewCommand.SaveSelectedSettings;
	selectedSettings: string[];
}

export interface IMsg_SaveSelectedIDEs
{
	command: WebviewCommand.SaveSelectedIDEs;
	selectedIDEs: number[];
}

export interface IMsg_SelectSourceIDE
{
	command: WebviewCommand.SelectSourceIDE;
	uuid: string;
	name?: string;
}

export interface IMsg_BrowseExportPath
{
	command: WebviewCommand.BrowseExportPath;
}

export interface IMsg_BrowseImportPath
{
	command: WebviewCommand.BrowseImportPath;
}

export interface IMsg_ExportCustomIDEs
{
	command: WebviewCommand.ExportCustomIDEs;
	includeKnownIDEs: boolean;
	customPath?: string;
}

export interface IMsg_ExportSelectedSettings
{
	command: WebviewCommand.ExportSelectedSettings;
	customPath?: string;
}

export interface IMsg_ExportAll
{
	command: WebviewCommand.ExportAll;
	includeKnownIDEs: boolean;
	customPath?: string;
}

export interface IMsg_Import
{
	command: WebviewCommand.Import;
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

export interface IMsg_SyncComplete
{
	command: HostCommand.SyncComplete;
}

export interface IMsg_DeleteComplete
{
	command: HostCommand.DeleteComplete;
}

export interface IMsg_AddCustomIDEComplete
{
	command: HostCommand.AddCustomIDEComplete;
	success: boolean;
	name?: string;
	error?: string;
}

export interface IMsg_DataRefreshed
{
	command: HostCommand.DataRefreshed;
	ideList: IIDEInfoWebview[];
}

export interface IMsg_ExportPathSelected
{
	command: HostCommand.ExportPathSelected;
	path: string;
}

export interface IMsg_ImportPathSelected
{
	command: HostCommand.ImportPathSelected;
	path: string;
}

export interface IMsg_ExportComplete
{
	command: HostCommand.ExportComplete;
	success: boolean;
	error?: string;
}

export interface IMsg_ImportComplete
{
	command: HostCommand.ImportComplete;
	success: boolean;
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
	| IMsg_DataRefreshed
	| IMsg_ExportPathSelected
	| IMsg_ImportPathSelected
	| IMsg_ExportComplete
	| IMsg_ImportComplete;
