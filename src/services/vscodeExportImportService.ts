/**
 * @deprecated 已棄用：此邏輯不再使用，僅保留供參考
 * @deprecated Deprecated: This logic is no longer in use, kept only for reference.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ExportImportCore, IStorageProvider, IFileSystemProvider, IDialogProvider } from '../core/exportImportCore';
import { knownIDEs } from '../data/knownIDEs';
import { EnumShowMessageType } from '../../webview/src/types';

/**
 * @deprecated 已棄用：此邏輯不再使用，僅保留供參考
 * @deprecated Deprecated: This logic is no longer in use, kept only for reference.
 *
 * VS Code 儲存提供器，使用 VS Code 的 globalState 進行資料持久化
 * VS Code storage provider, uses VS Code's globalState for data persistence
 */
export class VSCodeStorageProvider implements IStorageProvider
{
	/**
	 * 建構函式：注入 VS Code 擴充上下文
	 * Constructor: Inject VS Code extension context
	 *
	 * @param context - VS Code 擴充上下文，用於存取 globalState
	 * @param context - VS Code extension context, used to access globalState
	 */
	constructor(private context: vscode.ExtensionContext) {}

	/**
	 * 從 globalState 取得指定鍵的資料
	 * Get data from globalState by specified key
	 *
	 * @param key - 資料鍵名 / Data key name
	 * @param defaultValue - 當鍵不存在時回傳的預設值 / Default value when key doesn't exist
	 * @returns 儲存的值或預設值 / Stored value or default value
	 */
	get<T>(key: string, defaultValue?: T): T
	{
		return this.context.globalState.get(key, defaultValue as T);
	}

	/**
	 * 更新 globalState 中指定鍵的資料
	 * Update data in globalState for specified key
	 *
	 * @param key - 資料鍵名 / Data key name
	 * @param value - 要儲存的值 / Value to store
	 */
	async update(key: string, value: any): Promise<void>
	{
		await this.context.globalState.update(key, value);
	}
}

/**
 * @deprecated 已棄用：此邏輯不再使用，僅保留供參考
 * @deprecated Deprecated: This logic is no longer in use, kept only for reference.
 *
 * VS Code 檔案系統提供器，使用 Node.js 的 fs 模組進行檔案操作
 * VS Code file system provider, uses Node.js fs module for file operations
 */
export class VSCodeFileSystemProvider implements IFileSystemProvider
{
	/**
	 * 同步讀取檔案內容
	 * Synchronously read file content
	 *
	 * 使用 readFileSync 以確保在初始化階段能立即取得設定
	 * Uses readFileSync to ensure settings can be obtained immediately during initialization
	 *
	 * @param path - 檔案路徑 / File path
	 * @returns 檔案內容字串 / File content string
	 */
	async readFile(path: string): Promise<string>
	{
		return fs.readFileSync(path, 'utf8');
	}

	/**
	 * 同步寫入檔案內容
	 * Synchronously write file content
	 *
	 * 使用 writeFileSync 以確保設定立即寫入磁碟
	 * Uses writeFileSync to ensure settings are immediately written to disk
	 *
	 * @param path - 檔案路徑 / File path
	 * @param content - 要寫入的內容 / Content to write
	 */
	async writeFile(path: string, content: string): Promise<void>
	{
		fs.writeFileSync(path, content, 'utf8');
	}
}

/**
 * @deprecated 已棄用：此邏輯不再使用，僅保留供參考
 * @deprecated Deprecated: This logic is no longer in use, kept only for reference.
 *
 * VS Code 對話框提供器，封裝 VS Code 的原生對話框 API
 * VS Code dialog provider, wraps VS Code's native dialog APIs
 */
export class VSCodeDialogProvider implements IDialogProvider
{
	/**
	 * 顯示儲存檔案對話框
	 * Show save file dialog
	 *
	 * 讓使用者選擇匯出設定的儲存位置與檔名
	 * Allows user to choose save location and filename for exported settings
	 *
	 * @param options - 對話框選項，包含預設檔名與副檔名篩選器
	 * @param options - Dialog options, including default filename and extension filters
	 * @returns 選擇的檔案路徑或 undefined / Selected file path or undefined
	 */
	async showSaveDialog(options: any): Promise<string | undefined>
	{
		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath || '', options.defaultName)),
			filters: options.filters,
		});

		return uri?.fsPath;
	}

	/**
	 * 顯示開啟檔案對話框
	 * Show open file dialog
	 *
	 * 讓使用者選擇要匯入的設定檔案
	 * Allows user to select settings file to import
	 *
	 * @param options - 對話框選項，包含副檔名篩選器
	 * @param options - Dialog options, including extension filters
	 * @returns 選擇的檔案路徑陣列或 undefined / Array of selected file paths or undefined
	 */
	async showOpenDialog(options: any): Promise<string[] | undefined>
	{
		const uris = await vscode.window.showOpenDialog({
			canSelectMany: false,
			filters: options.filters,
		});

		return uris?.map(uri => uri.fsPath);
	}

	/**
	 * 顯示快速選取對話框
	 * Show quick pick dialog
	 *
	 * 提供使用者從清單中選擇項目，支援單選或多選模式
	 * Presents user with a list to pick items, supports single or multiple selection
	 *
	 * @param items - 要顯示的選項清單 / List of items to display
	 * @param options - 對話框選項，包含佔位文字、多選設定等
	 * @param options - Dialog options, including placeholder, multi-select settings, etc.
	 * @returns 選取的項目陣列或 undefined / Array of selected items or undefined
	 */
	async showQuickPick(items: any[], options: any): Promise<any[] | undefined>
	{
		const selectedItems = await vscode.window.showQuickPick(items, {
			placeHolder: options.placeHolder,
			canPickMany: options.canPickMany,
			matchOnDescription: options.matchOnDescription,
			matchOnDetail: options.matchOnDetail,
		});

		if (!selectedItems)
		{
			return undefined;
		}

		/**
		 * 處理單選與多選的不同回傳格式
		 * Handle different return formats for single vs multiple selection
		 *
		 * VS Code 的 showQuickPick 在單選時回傳物件，多選時回傳陣列
		 * VS Code's showQuickPick returns object for single, array for multiple selection
		 */
		if (options.canPickMany)
		{
			return Array.isArray(selectedItems) ? selectedItems : [selectedItems];
		}

		return [selectedItems];
	}

	/**
	 * 顯示訊息對話框
	 * Show message dialog
	 *
	 * 根據訊息類型顯示不同樣式的訊息（資訊、警告、錯誤）
	 * Displays different message styles based on message type (info, warning, error)
	 *
	 * @param message - 要顯示的訊息內容 / Message content to display
	 * @param type - 訊息類型（資訊/警告/錯誤）/ Message type (info/warning/error)
	 */
	async showMessage(message: string, type: EnumShowMessageType): Promise<void>
	{
		switch (type)
		{
			case EnumShowMessageType.INFO:
				await vscode.window.showInformationMessage(message);
				break;
			case EnumShowMessageType.WARNING:
				await vscode.window.showWarningMessage(message);
				break;
			case EnumShowMessageType.ERROR:
				await vscode.window.showErrorMessage(message);
				break;
		}
	}
}

/**
 * @deprecated 已棄用：此邏輯不再使用，僅保留供參考
 * @deprecated Deprecated: This logic is no longer in use, kept only for reference.
 *
 * VS Code 匯出匯入服務，擴充核心匯出匯入邏輯
 * VS Code export/import service, extends core export/import logic
 *
 * 在核心功能基礎上增加已知 IDE 資訊到匯出資料中
 * Adds known IDE information to exported data on top of core functionality
 */
export class VSCodeExportImportService extends ExportImportCore
{
	/**
	 * 建構函式：初始化各個提供器
	 * Constructor: Initialize all providers
	 *
	 * @param context - VS Code 擴充上下文，用於初始化儲存提供器
	 * @param context - VS Code extension context, used to initialize storage provider
	 */
	constructor(context: vscode.ExtensionContext)
	{
		const storageProvider = new VSCodeStorageProvider(context);
		const fileSystemProvider = new VSCodeFileSystemProvider();
		const dialogProvider = new VSCodeDialogProvider();

		super(storageProvider, fileSystemProvider, dialogProvider);
	}

	/**
	 * 覆蓋匯出自訂 IDE 方法以包含已知 IDE 資訊
	 * Override export custom IDEs method to include known IDEs information
	 *
	 * 在匯出的資料中加入已知 IDE 名稱清單，方便匯入時識別
	 * Adds known IDE names list to exported data for identification during import
	 *
	 * @returns 包含已知 IDE 資訊的 JSON 字串 / JSON string containing known IDEs info
	 */
	async exportCustomIDEs(): Promise<string>
	{
		const result = await super.exportCustomIDEs();
		const data = JSON.parse(result);

		/**
		 * 在 metadata 中加入已知 IDE 清單
		 * Add known IDEs list to metadata
		 *
		 * 若資料結構包含 metadata 則加入已知 IDE 名稱
		 * If data structure contains metadata, add known IDE names
		 */
		if (data.metadata)
		{
			data.metadata.knownIDEsExcluded = knownIDEs.map(ide => ide.name);
		}

		return JSON.stringify(data, null, 2);
	}

	/**
	 * 覆蓋匯出選取設定方法以包含已知 IDE 資訊
	 * Override export selected settings method to include known IDEs information
	 *
	 * 在匯出的資料中加入已知 IDE 名稱清單，方便匯入時識別
	 * Adds known IDE names list to exported data for identification during import
	 *
	 * @returns 包含已知 IDE 資訊的 JSON 字串 / JSON string containing known IDEs info
	 */
	async exportSelectedSettings(): Promise<string>
	{
		const result = await super.exportSelectedSettings();
		const data = JSON.parse(result);

		/**
		 * 在 metadata 中加入已知 IDE 清單
		 * Add known IDEs list to metadata
		 *
		 * 若資料結構包含 metadata 則加入已知 IDE 名稱
		 * If data structure contains metadata, add known IDE names
		 */
		if (data.metadata)
		{
			data.metadata.knownIDEsExcluded = knownIDEs.map(ide => ide.name);
		}

		return JSON.stringify(data, null, 2);
	}

	/**
	 * 覆蓋匯出所有資料方法以包含已知 IDE 資訊
	 * Override export all data method to include known IDEs information
	 *
	 * 在匯出的資料中加入已知 IDE 名稱清單，方便匯入時識別
	 * Adds known IDE names list to exported data for identification during import
	 *
	 * @returns 包含已知 IDE 資訊的 JSON 字串 / JSON string containing known IDEs info
	 */
	async exportAll(): Promise<string>
	{
		const result = await super.exportAll();
		const data = JSON.parse(result);

		/**
		 * 在 metadata 中加入已知 IDE 清單
		 * Add known IDEs list to metadata
		 *
		 * 若資料結構包含 metadata 則加入已知 IDE 名稱
		 * If data structure contains metadata, add known IDE names
		 */
		if (data.metadata)
		{
			data.metadata.knownIDEsExcluded = knownIDEs.map(ide => ide.name);
		}

		return JSON.stringify(data, null, 2);
	}
}
