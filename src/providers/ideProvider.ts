import * as vscode from 'vscode';
import { existsSync } from 'fs';
import * as path from 'path';
import { fsSameRealpath } from 'path-is-same';
import { EnumGlobalStateName, EnumIDEInfoType, IIDEInfo, IUnavailableIDE } from '../types';
import { _keyToPath } from '../utils/json';
import { IdeSettingProvider } from './ideSettingProvider';
import { knownIDEs } from '../data/knownIDEs';

/**
 * IDE 設定供應商
 * Provides IDE detection, settings I/O, and management functionality
 *
 * 此類負責：
 * - 偵測系統中安裝的已知 IDE（VS Code、VS Code Insiders、Antigravity 等）
 * - 管理自訂 IDE 路徑
 * - 讀取/寫入 IDE 設定檔案
 * - 追蹤可用和不可用的 IDE
 */
export class IDEProvider
{
	// IDE 列表：存儲成功偵測到的可用 IDE
	// IDE list: Stores successfully detected available IDEs
	private ideList: IIDEInfo[] = [];

	// 不可用 IDE 列表：存儲偵測清單中但未找到的 IDE
	// Unavailable IDEs: Stores IDEs in detection list but not found
	private unavailableIDEs: IUnavailableIDE[] = [];

	// VS Code 擴展上下文
	// VS Code extension context
	private context: vscode.ExtensionContext;

	/**
	 * 建構子
	 * @param {vscode.ExtensionContext} context - VS Code 擴展上下文
	 */
	constructor(context: vscode.ExtensionContext)
	{
		this.context = context;
	}

	/**
	 * 重新整理 IDE 列表
	 * Refresh the IDE detection list
	 *
	 * 此方法會：
	 * 1. 清空現有的 IDE 列表
	 * 2. 偵測所有已知的 IDE
	 * 3. 載入使用者定義的自訂 IDE 路徑
	 */
	async refreshIDEList(): Promise<void>
	{
		this.ideList = [];
		this.unavailableIDEs = [];

		// 偵測內建已知的 IDE
		// Detect built-in known IDEs (VS Code, Insiders, etc.)
		await this.detectKnownIDEs();

		// 從擴展設定中載入自訂 IDE 路徑
		// Load custom IDE paths from extension settings
		await this.loadCustomIDEs();
	}

	/**
	 * 偵測已知的 IDE
	 * Detect known IDEs installed on the system
	 *
	 * 此方法會嘗試在以下位置查找 IDE：
	 * - Windows: %APPDATA%\{IDEName}\User\settings.json
	 * - macOS/Linux: ~/.{IDEName}/User/settings.json
	 *
	 * 支援的 IDE：
	 * - Visual Studio Code (Code)
	 * - Visual Studio Code - Insiders (Code - Insiders, Code-Insiders)
	 * - Antigravity
	 * - CodeBuddy CN
	 *
	 * @see knownIDEs.ts
	 */
	private async detectKnownIDEs(): Promise<void>
	{
		// 逐個 IDE 進行偵測
		// Perform detection for each IDE
		for (const ide of knownIDEs)
		{
			let foundPath: string | null = null;
			let detectedPath: string | null = null;

			// 嘗試多個可能的資料夾名稱
			// Try multiple possible folder name variations
			for (const appFolderName of ide.appFolderNames)
			{
				// 根據作業系統環境變量構造可能的路徑
				// Construct possible path based on OS environment variables
				const testPath = this.getUserDataPath(appFolderName, 'User');
				const settingsJsonPath = path.join(testPath, 'settings.json');

				console.log(`[IDE Detection] 嘗試檢測 ${ide.name} at ${testPath}`);
				console.log(`[IDE Detection] Attempting to detect ${ide.name} at ${testPath}`);

				// 步驟 1：檢查主資料夾是否存在
				// Step 1: Check if the main folder exists
				if (existsSync(testPath))
				{
					detectedPath = testPath;
					console.log(`[IDE Detection] ✓ 找到資料夾 ${ide.name} at ${testPath}`);
					console.log(`[IDE Detection] ✓ Found folder for ${ide.name} at ${testPath}`);

					// 步驟 2：檢查 settings.json 檔案是否存在
					// Step 2: Check if settings.json file exists
					if (existsSync(settingsJsonPath))
					{
						foundPath = testPath;
						console.log(`[IDE Detection] ✓✓ 成功偵測到 ${ide.name}，settings.json 已找到`);
						console.log(`[IDE Detection] ✓✓ Successfully detected ${ide.name}, settings.json found`);
						// 成功找到，退出迴圈
						// Found successfully, exit loop
						break;
					}
					else
					{
						// 資料夾存在但缺少 settings.json 檔案
						// Folder exists but settings.json is missing
						console.log(
							`[IDE Detection] ⚠ 資料夾存在但找不到 settings.json: ${settingsJsonPath}`,
						);
						console.log(
							`[IDE Detection] ⚠ Folder exists but settings.json not found: ${settingsJsonPath}`,
						);
						// 如果這是最後一個嘗試，記錄此路徑供後續使用
						// If this is the last attempt, record this path for later use
						if (!detectedPath)
						{
							detectedPath = testPath;
						}
					}
				}
				else
				{
					console.log(`[IDE Detection] ✗ 路徑不存在 / Path not found: ${testPath}`);
				}
			}

			// 步驟 3：根據偵測結果進行相應處理
			// Step 3: Handle the detection result
			if (foundPath)
			{
				// 成功找到 IDE，嘗試載入設定
				// Successfully found IDE, attempt to load settings
				const settingsJsonPath = path.join(foundPath, 'settings.json');
				this.processIDE(ide.name, EnumIDEInfoType.known, settingsJsonPath, foundPath);
			}
			else
			{
				// 未能找到任何可用的 IDE 路徑
				// Failed to find any available IDE path
				const defaultPath = this.getUserDataPath(ide.appFolderNames[0], 'User');
				const triedPaths = ide.appFolderNames.map(name => this.getUserDataPath(name, 'User')).join('\n- ');
				const reason = `IDE not found. Tried paths:\n- ${triedPaths}`;

				console.log(`[IDE Detection] ✗ 未偵測到 ${ide.name}`);
				console.log(`[IDE Detection] ✗ ${ide.name} not detected`);

				// 將 IDE 標記為不可用
				// Mark IDE as unavailable
				this.addUnavailableIDE(
					ide.name,
					EnumIDEInfoType.known,
					detectedPath || defaultPath,
					`[IDE Detection] ✗ ${reason}`,
				);
			}
		}
	}

	/**
	 * 載入自訂 IDE 路徑
	 * Load custom IDE paths from extension settings
	 *
	 * 此方法讀取用戶先前新增的自訂 IDE 路徑，
	 * 並嘗試驗證這些路徑和載入它們的設定檔案。
	 */
	private async loadCustomIDEs(): Promise<void>
	{
		// 從全域狀態讀取自訂 IDE 清單
		// Read custom IDE list from global state
		const customIDEs = this.context.globalState.get<Array<{ name: string; path: string }>>(
			EnumGlobalStateName.customIDEs,
			[], // 預設值：空陣列 / Default value: empty array
		);

		console.log(`[Custom IDE] 載入 ${customIDEs.length} 個自訂 IDE`);
		console.log(`[Custom IDE] Loading ${customIDEs.length} custom IDEs`);

		// 逐個處理自訂 IDE
		// Process each custom IDE
		for (const customIDE of customIDEs)
		{
			// 嘗試多個可能的 settings.json 路徑
			// Try multiple possible settings.json paths
			let settingsJsonPath: string | null = null;
			let foundPath: string | null = null;

			// 選項 1: 直接在提供的路徑下尋找
			// Option 1: Look directly in the provided path
			const directPath = path.join(customIDE.path, 'settings.json');
			if (existsSync(directPath))
			{
				settingsJsonPath = directPath;
				foundPath = customIDE.path;
				console.log(`[Custom IDE] 直接路徑找到 settings.json: ${directPath}`);
			}

			// 選項 2: 在 User 子資料夾中尋找
			// Option 2: Look in User subfolder
			if (!settingsJsonPath)
			{
				const userSubfolderPath = path.join(customIDE.path, 'User', 'settings.json');
				if (existsSync(userSubfolderPath))
				{
					settingsJsonPath = userSubfolderPath;
					foundPath = path.join(customIDE.path, 'User');
					console.log(`[Custom IDE] User 子資料夾找到 settings.json: ${userSubfolderPath}`);
				}
			}

			console.log(`[Custom IDE] 檢查自訂 IDE: ${customIDE.name} at ${customIDE.path}`);
			console.log(`[Custom IDE] Checking custom IDE: ${customIDE.name} at ${customIDE.path}`);

			// 檢查 settings.json 是否存在
			// Check if settings.json exists
			if (settingsJsonPath && foundPath)
			{
				// 使用共用方法處理 IDE 載入
				// Use shared method to process IDE loading
				this.processIDE(customIDE.name, EnumIDEInfoType.custom, settingsJsonPath, foundPath);
			}
			else
			{
				// settings.json 檔案不存在
				// settings.json file does not exist
				const directCheck = existsSync(directPath);
				const userCheck = existsSync(path.join(customIDE.path, 'User', 'settings.json'));

				let reason = 'settings.json not found';
				if (!directCheck && !userCheck)
				{
					reason = `settings.json not found in:\n- ${directPath}\n- ${path.join(customIDE.path, 'User', 'settings.json')}`;
				}

				console.log(
					`[Custom IDE] ✗ ${reason}`,
				);

				// 標記為不可用
				// Mark as unavailable
				this.addUnavailableIDE(
					customIDE.name,
					EnumIDEInfoType.custom,
					customIDE.path,
					`[Custom IDE] ✗ ${reason}`,
				);
			}
		}
	}

	/**
	 * 根據應用名稱和資料夾名稱構造用戶資料路徑
	 * Construct user data path based on app and folder names
	 *
	 * @param appName - 應用程式名稱 / Application name (e.g., "Code - Insiders")
	 * @param folderName - 資料夾名稱 / Folder name (e.g., "User")
	 * @returns 完整的用戶資料路徑 / Full user data path
	 *
	 * 範例 (Example):
	 * - Windows: C:\Users\{User}\AppData\Roaming\Code - Insiders\User
	 * - macOS: ~/.config/Code - Insiders/User
	 * - Linux: ~/.config/Code - Insiders/User
	 */
	private getUserDataPath(appName: string, folderName: string): string
	{
		// 取得平台相關的應用資料目錄
		// Get platform-specific application data directory
		// Windows: %APPDATA% env var
		// macOS/Linux: $HOME/.config or similar
		const userDataDir = process.env.APPDATA || process.env.HOME || '';

		if (!userDataDir)
		{
			console.warn('[IDE Detection] 警告：無法確定系統的應用資料目錄');
			console.warn('[IDE Detection] Warning: Cannot determine system app data directory');
		}

		// 合併路徑部分
		// Join path segments
		const fullPath = path.join(userDataDir, appName, folderName);

		console.log(`[Path Resolution] ${appName}/${folderName} -> ${fullPath}`);

		return fullPath;
	}

	/**
	 * 取得可用的 IDE 列表
	 * Get list of available IDEs
	 *
	 * @returns 成功偵測到的 IDE 陣列 / Array of successfully detected IDEs
	 */
	getIDEList(): IIDEInfo[]
	{
		return this.ideList;
	}

	/**
	 * 用於 WebviewContent
	 *
	 * @see src/webview/settingsSyncPanel.ts
	 * @example let ideList = ${JSON.stringify(this.ideProvider.getIDEListToWebviewContent())};
	 * @returns Array<Object> - 用於 Webview 的 IDE 列表內容 (包含 settings)
	 */
	getIDEListToWebviewContent()
	{
		return this.ideList.map(ide =>
		{
			return {
				...ide,
				settings: ide.settingProvider.load().valueOf(),
			}
		})
	}

	/**
	 * 取得不可用的 IDE 列表
	 * Get list of unavailable IDEs
	 *
	 * 不可用的 IDE 包括：
	 * - 在偵測清單中但系統上未找到的 IDE
	 * - 路徑存在但無法讀取設定檔案的 IDE
	 *
	 * @returns 不可用的 IDE 陣列 / Array of unavailable IDEs
	 */
	getUnavailableIDEs(): IUnavailableIDE[]
	{
		return this.unavailableIDEs;
	}

	/**
	 * 將可用的 IDE 新增到列表
	 * Add an available IDE to the list
	 *
	 * @param name - IDE 顯示名稱
	 * @param type - IDE 類型
	 * @param nativePath - IDE 實際路徑
	 * @param settingProvider - 設定供應商
	 * @param successLog - 成功時的日誌訊息
	 */
	private addAvailableIDE(
		name: string,
		type: EnumIDEInfoType,
		nativePath: string,
		settingProvider: IdeSettingProvider,
		successLog: string,
	): void
	{
		this.ideList.push({
			name,
			type,
			available: true,
			nativePath,
			settingProvider,
		});

		console.log(successLog);
		console.log(`[IDE] ✓ Successfully loaded settings for ${name}`);
	}

	/**
	 * 將不可用的 IDE 新增到列表
	 * Add an unavailable IDE to the list
	 *
	 * @param name - IDE 顯示名稱
	 * @param type - IDE 類型
	 * @param expectedPath - 預期路徑
	 * @param errorLog - 錯誤日誌訊息
	 */
	private addUnavailableIDE(
		name: string,
		type: EnumIDEInfoType,
		expectedPath: string,
		errorLog: string,
	): void
	{
		this.unavailableIDEs.push({
			name,
			type,
			expectedPath,
			reason: errorLog,
		});

		console.error(errorLog);
		console.error(`[IDE] ✗ ${name} not available`);
	}

	/**
	 * 處理 IDE 設定檔載入
	 * Process IDE settings file loading
	 *
	 * 此方法嘗試載入 IDE 的 settings.json，並處理成功/失敗情況。
	 *
	 * @param name - IDE 顯示名稱
	 * @param type - IDE 類型
	 * @param settingsJsonPath - settings.json 檔案路徑
	 * @param nativePath - IDE 實際資料夾路徑
	 * @returns 是否成功載入
	 */
	private processIDE(
		name: string,
		type: EnumIDEInfoType,
		settingsJsonPath: string,
		nativePath: string,
	): boolean
	{
		try
		{
			// 使用 IdeSettingProvider 載入設定檔案
			// Use IdeSettingProvider to load settings file
			const settingProvider = new IdeSettingProvider(settingsJsonPath, nativePath);
			settingProvider.load();

			// 成功載入，新增到 IDE 列表
			// Successfully loaded, add to IDE list
			this.addAvailableIDE(
				name,
				type,
				nativePath,
				settingProvider,
				`[IDE] ✓ 成功載入 ${name} 的設定`,
			);

			return true;
		}
		catch (error)
		{
			// settings.json 存在但無法解析
			// settings.json exists but cannot be parsed
			this.addUnavailableIDE(
				name,
				type,
				nativePath,
				`[IDE] ✗ 無法讀取或解析 ${name} 的設定檔案: ${error}`,
			);

			return false;
		}
	}

	/**
	 * 取得可用 IDE 的數量
	 * Get count of available IDEs
	 *
	 * @returns 可用 IDE 的數量 / Number of available IDEs
	 */
	getAvailableIDECount(): number
	{
		return this.ideList.length;
	}

	/**
	 * 透過索引取得 IDE
	 * @param ideIndex - IDE 在列表中的索引 / Index of IDE in list
	 * @param isCustomIDE - 選填，若為 true 則表示為自訂 IDE
	 * @returns IIDEInfo | undefined - 找到則回傳該 IDE，否則回傳 undefined
	 */
	getIdeByIndex(ideIndex: number, isCustomIDE?: boolean): IIDEInfo | undefined
	{
		// 驗證索引有效性 / Validate index is within bounds
		if (ideIndex >= 0 && ideIndex < this.ideList.length)
		{
			return this.ideList[ideIndex];
		}

		console.warn(`[${isCustomIDE ? 'Custom ' : ''}IDE] 無效的索引 / Invalid index: ${ideIndex}`);
		return undefined;
	}

	/**
	 * 取得 IDE 的設定值
	 * Get setting value from an IDE
	 *
	 * 支援嵌套設定鍵（例如 "editor.fontFamily" 會查找 settings.editor.fontFamily）
	 * Supports nested setting keys (e.g., "editor.fontFamily" looks for settings.editor.fontFamily)
	 *
	 * @param ideIndex - IDE 在列表中的索引 / Index of IDE in list
	 * @param settingKey - 設定鍵值，使用點號分隔嵌套層級 / Setting key with dot notation for nested levels
	 * @returns 設定值，如果不存在返回 undefined / Setting value or undefined if not found
	 */
	async getSettingValue(ideIndex: number, settingKey: string): Promise<any>
	{
		const ide = this.getIdeByIndex(ideIndex);

		return ide?.settingProvider.load().get([settingKey]);
	}

	/**
	 * 設定 IDE 的設定值
	 * Set setting value in an IDE
	 *
	 * 此方法會：
	 * 1. 驗證 IDE 索引
	 * 2. 在內存中更新設定值（建立必要的嵌套物件）
	 * 3. 將更新寫入 settings.json 檔案
	 *
	 * @param ideIndex - IDE 在列表中的索引 / Index of IDE in list
	 * @param settingKey - 設定鍵值，支援嵌套 / Setting key with dot notation
	 * @param value - 要設定的值 / Value to set
	 */
	async setSetting(ideIndex: number, settingKey: string, value: any): Promise<void>
	{
		const ide = this.getIdeByIndex(ideIndex);

		if (ide)
		{
			ide.settingProvider.set([settingKey], value);
			// ide?.settingProvider.save();

			console.log(
				`[Settings Update] 已更新 ${ide.name} 的設定: ${settingKey} = ${JSON.stringify(value)}`,
			);
		}
	}

	saveSync(sourceIDEIndex: number, targetIDEIndices: number[])
	{
		targetIDEIndices = [
			...targetIDEIndices,
			sourceIDEIndex,
		];

		console.log(
			`[Settings Sync] 開始同步 ${targetIDEIndices} 的設定`,
		);

		for (const ideIndex of targetIDEIndices)
		{
			const ide = this.getIdeByIndex(ideIndex);

			if (ide)
			{
				ide.settingProvider.load().save();

				console.log(
					`[Settings Sync] 已同步 ${ide.name} 的設定`,
				);
			}
		}
	}

	/**
	 * 刪除 IDE 的設定值
	 * Delete setting value from an IDE
	 *
	 * @param ideIndex - IDE 在列表中的索引 / Index of IDE in list
	 * @param settingKey - 設定鍵值，支援嵌套 / Setting key with dot notation
	 */
	async deleteSetting(ideIndex: number, settingKey: string): Promise<void>
	{
		const ide = this.getIdeByIndex(ideIndex)!;

		const deleted = ide?.settingProvider.delete([settingKey]);
		if (deleted)
		{
			// ide.settingProvider.save();
			console.log(`[Settings Delete] 已從 ${ide.name} 刪除: ${settingKey}`);
		}
	}

	/**
	 * 添加自訂 IDE 路徑
	 * Add a custom IDE path
	 *
	 * 此方法會執行以下驗證：
	 * - 路徑必須是絕對路徑
	 * - 名稱不能與內建 IDE 名稱相同
	 * - 路徑不能與內建 IDE 路徑相同（使用 fsSameRealpath 比較實際路徑）
	 * - 名稱不能與已新增的自訂 IDE 名稱相同
	 * - 路徑不能與已新增的自訂 IDE 路徑相同（使用 fsSameRealpath 比較實際路徑）
	 *
	 * @param name - 自訂 IDE 的顯示名稱 / Display name for custom IDE
	 * @param settingsPath - IDE 設定資料夾的完整路徑 / Full path to IDE settings folder
	 * @returns 是否成功添加 / Whether the addition was successful
	 * @throws Error 當驗證失敗時拋出錯誤 / Throws error when validation fails
	 */
	async addCustomIDE(name: string, settingsPath: string): Promise<boolean>
	{
		// 1. 檢查路徑是否為絕對路徑 / Check if path is absolute
		if (!path.isAbsolute(settingsPath))
		{
			const errorMsg = `[Custom IDE] 路徑必須是絕對路徑 / Path must be absolute: ${settingsPath}`;
			console.error(errorMsg);
			throw new Error(errorMsg);
		}

		// 從全域狀態讀取現有自訂 IDE 列表 / Read existing custom IDE list
		const customIDEs = this.context.globalState.get<Array<{ name: string; path: string }>>(
			EnumGlobalStateName.customIDEs,
			[],
		);

		// 2. 檢查名稱是否與內建 IDE 名稱相同（忽略大小寫）/ Check if name matches built-in IDE name
		const normalizedInputName = name.toLowerCase();
		const builtInNameMatch = knownIDEs.find(
			(ide) => ide.name.toLowerCase() === normalizedInputName,
		);
		if (builtInNameMatch)
		{
			const errorMsg = `[Custom IDE] 名稱與內建 IDE "${builtInNameMatch.name}" 相同 / Name matches built-in IDE: ${name}`;
			console.error(errorMsg);
			throw new Error(errorMsg);
		}

		// 3. 檢查路徑是否與內建 IDE 路徑相同（使用 fsSameRealpath）/ Check if path matches built-in IDE path
		for (const ide of knownIDEs)
		{
			for (const folderName of ide.appFolderNames)
			{
				const builtInPath = this.getUserDataPath(folderName, 'User');
				if (await fsSameRealpath(settingsPath, builtInPath))
				{
					const errorMsg = `[Custom IDE] 路徑與內建 IDE "${ide.name}" 相同 / Path matches built-in IDE: ${settingsPath}`;
					console.error(errorMsg);
					throw new Error(errorMsg);
				}
			}
		}

		// 4. 檢查名稱是否與已新增的自訂 IDE 名稱相同（忽略大小寫）/ Check if name matches existing custom IDE name
		const existingCustomNameMatch = customIDEs.find(
			(ide) => ide.name.toLowerCase() === normalizedInputName,
		);
		if (existingCustomNameMatch)
		{
			const errorMsg = `[Custom IDE] 名稱與已存在的自訂 IDE "${existingCustomNameMatch.name}" 相同 / Name matches existing custom IDE: ${name}`;
			console.error(errorMsg);
			throw new Error(errorMsg);
		}

		// 5. 檢查路徑是否與已新增的自訂 IDE 路徑相同（使用 fsSameRealpath）/ Check if path matches existing custom IDE path
		for (const ide of customIDEs)
		{
			if (await fsSameRealpath(settingsPath, ide.path))
			{
				const errorMsg = `[Custom IDE] 路徑與已存在的自訂 IDE "${ide.name}" 相同 / Path matches existing custom IDE: ${settingsPath}`;
				console.error(errorMsg);
				throw new Error(errorMsg);
			}
		}

		// 所有驗證通過，添加新的自訂 IDE / All validations passed, add new custom IDE
		customIDEs.push({ name, path: settingsPath });
		await this.context.globalState.update(EnumGlobalStateName.customIDEs, customIDEs);

		console.log(`[Custom IDE] 已添加 / Added: ${name} at ${settingsPath}`);

		// 重新整理以驗證新路徑 / Refresh to validate new path
		await this.refreshIDEList();

		return true;
	}

	/**
	 * 移除自訂 IDE 路徑
	 * Remove a custom IDE path
	 *
	 * @param ideIndex - IDE 在列表中的索引 / Index of IDE in list
	 */
	async removeCustomIDE(ideIndex: number, name: string): Promise<void>
	{
		const ide = this.getIdeByIndex(ideIndex, true);

		if (!ide || ide.type !== EnumIDEInfoType.custom || ide.name !== name)
		{
			console.warn(`[${ide?.type !== EnumIDEInfoType.known
				? `Custom `
				: ''}IDE] 無法移除目標 IDE / Cannot remove target IDE: [${ideIndex}] ${name}`);

			return;
		}

		// 只允許移除自訂 IDE，不能移除內建 IDE / Only allow removal of custom IDEs
		if (ide.type === EnumIDEInfoType.custom)
		{
			// 從全域狀態讀取自訂 IDE 列表 / Read custom IDE list from global state
			const customIDEs = this.context.globalState.get<Array<{ name: string; path: string }>>(
				EnumGlobalStateName.customIDEs,
				[],
			);

			// 過濾掉要移除的 IDE / Filter out the IDE to be removed
			const filtered = customIDEs.filter((c) => c.path !== ide.nativePath);
			await this.context.globalState.update(EnumGlobalStateName.customIDEs, filtered);

			console.log(`[Custom IDE] 已移除 / Removed: [${ideIndex}] ${ide.name}`);

			// 重新整理 IDE 列表 / Refresh IDE list
			await this.refreshIDEList();
		}
		else
		{
			// 試圖移除內建 IDE / Attempted to remove built-in IDE
			console.warn(`[Custom IDE] 無法移除內建 IDE / Cannot remove built-in IDE: [${ideIndex}] ${ide.name}`);
		}
	}
}
