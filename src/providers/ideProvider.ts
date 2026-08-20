import * as vscode from 'vscode';
import { existsSync } from 'fs';
import * as path from 'path';
import { fsSameRealpath } from 'path-is-same';
import { nanoid } from 'nanoid';
import { EnumGlobalStateName, EnumIDEInfoType, IIDEInfo, IUnavailableIDE, ICustomIDEWithUuid } from '../types';
import { _keyToPath } from '../utils/json';
import { IdeSettingProvider } from './ideSettingProvider';
import { knownIDEs } from '../data/knownIDEs';
import { BACKUP_IDE_NAME, BACKUP_IDE_NOT_CONFIGURED_REASON } from '../data/backupIDE';
import { IDEDetector, IDetectionResult } from '../utils/ideDetector';
import { transformIDEListForWebview } from '../utils/ideListToWebviewContent';
import { loadIDECache, getExistingUuid } from '../utils/ideCache';
import { AbstractClassWithContextGlobalState, AbstractClassWithGlobalState, VscodeExtensionContextGlobalState } from './vscode/globalState';

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
export class IDEProvider extends AbstractClassWithContextGlobalState
{
	/** IDE 列表：存儲成功偵測到的可用 IDE / IDE list: Stores successfully detected available IDEs */
	protected ideList: IIDEInfo[] = [];

	/** 不可用 IDE 列表：存儲偵測清單中但未找到的 IDE / Unavailable IDEs: Stores IDEs in detection list but not found */
	protected unavailableIDEs: IUnavailableIDE[] = [];

	/** VS Code 擴展上下文 / VS Code extension context */
	protected context: vscode.ExtensionContext;

	/** 獨立 IDE 偵測器 / Standalone IDE detector */
	protected ideDetector: IDEDetector;

	/**
	 * 建構子
	 * @param {vscode.ExtensionContext} context - VS Code 擴展上下文
	 */
	constructor(context: vscode.ExtensionContext)
	{
		super();
		this.context = context;
		this.ideDetector = new IDEDetector({
			verbose: true,
			logger: (message: string) => console.log(message),
		});
	}

	/**
	 * 重新整理 IDE 列表
	 * Refresh the IDE detection list
	 *
	 * 此方法會：
	 * 1. 清空現有的 IDE 列表
	 * 2. 偵測所有已知的 IDE
	 * 3. 載入使用者定義的自訂 IDE 路徑
	 *
	 * This method will:
	 * 1. Clear existing IDE list
	 * 2. Detect all known IDEs
	 * 3. Load user-defined custom IDE paths
	 */
	async refreshIDEList(): Promise<void>
	{
		this.ideList = [];
		this.unavailableIDEs = [];

		/** 偵測內建已知的 IDE / Detect built-in known IDEs (VS Code, Insiders, etc.) */
		await this.detectKnownIDEs();

		/** 從擴充設定中載入自訂 IDE 路徑 / Load custom IDE paths from extension settings */
		await this.loadCustomIDEs();

		/** 載入內建備份 IDE / Load the built-in backup IDE */
		await this.loadBackupIDE();
	}

	/**
	 * 偵測已知的 IDE
	 * Detect known IDEs installed on the system
	 *
	 * 使用獨立的 IDE 偵測器進行偵測，然後將結果轉換為 VSCode 擴充格式
	 * Uses standalone IDE detector for detection, then converts results to VSCode extension format
	 *
	 * @param cachedIDEs - 快取的 IDE 列表，用於保持 UUID 一致性 / Cached IDE list for UUID consistency
	 */
	protected async detectKnownIDEs(): Promise<void>
	{
		/** 使用獨立偵測器偵測所有已知 IDE / Use standalone detector to detect all known IDEs */
		const detectionResults = this.ideDetector.detectIDEs([...knownIDEs]);

		/** 處理偵測結果 / Process detection results */
		for (const result of detectionResults)
		{
			/** 使用工具函數取得現有的 UUID / Use utility function to get existing UUID */
			const existingUuid = getExistingUuid({
				extensionPath: this.context.extensionPath,
				ideName: result.name,
				idePath: result.path || '',
			});

			if (result.detected && result.path && result.settingsPath)
			{
				/** 成功找到 IDE，嘗試載入設定 / Successfully found IDE, attempt to load settings */
				this.processIDE(result.name, EnumIDEInfoType.known, result.settingsPath, result.path, existingUuid);
			}
			else
			{
				/** 未能找到 IDE，標記為不可用 / Failed to find IDE, mark as unavailable */
				const defaultPath = this.getUserDataPath(knownIDEs.find(ide => ide.name === result.name)?.appFolderNames[0] || result.name, 'User');

				this.addUnavailableIDE(
					result.name,
					EnumIDEInfoType.known,
					result.path || defaultPath,
					result.reason || `[IDE Detection] ✗ ${result.name} not detected`,
				);
			}
		}
	}

	/**
	 * 載入自訂 IDE 路徑
	 * Load custom IDE paths from extension settings
	 *
	 * 此方法讀取用戶先前新增的自訂 IDE 路徑，
	 * 並使用獨立偵測器進行偵測。
	 * This method reads custom IDE paths added by users previously,
	 * and uses the standalone detector for detection.
	 *
	 * @param cachedIDEs - 快取的 IDE 列表，用於保持 UUID 一致性
	 */
	protected async loadCustomIDEs(cachedIDEs: Array<{
		uuid: string;
		name: string;
		type: string;
		nativePath: string
	}> = []): Promise<void>
	{
		// 從全域狀態讀取自訂 IDE 清單
		// Read custom IDE list from global state
		const customIDEs = this.globalState.get(
			EnumGlobalStateName.customIDEs,
			[], // 預設值：空陣列 / Default value: empty array
		);

		console.log(`[Custom IDE] 載入 ${customIDEs.length} 個自訂 IDE`);
		console.log(`[Custom IDE] Loading ${customIDEs.length} custom IDEs`);

		// 使用獨立偵測器偵測自訂 IDE
		// Use standalone detector to detect custom IDEs
		const customResults = this.ideDetector.detectCustomIDEs(customIDEs);

		// 處理偵測結果
		// Process detection results
		for (const result of customResults)
		{
			if (result.detected && result.path && result.settingsPath)
			{
				// 使用工具函數取得現有的 UUID
				// Use utility function to get existing UUID
				const existingUuid = getExistingUuid({
					extensionPath: this.context.extensionPath,
					ideName: result.name,
					idePath: result.path || '',
					globalStateIDEs: customIDEs,
				});

				console.log(`[Custom IDE] 載入自訂 IDE: ${result.name} (UUID: ${existingUuid || 'new'})`);
				console.log(`[Custom IDE] Loading custom IDE: ${result.name} (UUID: ${existingUuid || 'new'})`);

				// 成功找到自訂 IDE，嘗試載入設定
				// Successfully found custom IDE, attempt to load settings
				this.processIDE(result.name, EnumIDEInfoType.custom, result.settingsPath, result.path, existingUuid);
			}
			else
			{
				// 未能找到自訂 IDE，標記為不可用
				// Failed to find custom IDE, mark as unavailable
				const existingCustomIDE = customIDEs.find(ide => ide.name === result.name);
				console.log(`[Custom IDE] 無法載入自訂 IDE: ${result.name} (UUID: ${existingCustomIDE?.uuid || 'unknown'}) - ${result.reason}`);
				console.log(`[Custom IDE] Failed to load custom IDE: ${result.name} (UUID: ${existingCustomIDE?.uuid || 'unknown'}) - ${result.reason}`);

				this.addUnavailableIDE(
					result.name,
					EnumIDEInfoType.custom,
					result.path || customIDEs.find(ide => ide.name === result.name)?.path || '',
					result.reason || `[Custom IDE] ✗ ${result.name} not detected`,
				);
			}
		}
	}

	/**
	 * 取得內建備份 IDE 的路徑設定
	 * Get the configured path of the built-in backup IDE
	 *
	 * @returns 備份路徑字串（空字串代表尚未設定）/ Backup path string (empty string means not configured)
	 */
	getBackupIDEPath(): string
	{
		return this.globalState.get(EnumGlobalStateName.backupIDEPath, '') || '';
	}

	/**
	 * 設定內建備份 IDE 的路徑
	 * Set the path of the built-in backup IDE
	 *
	 * 驗證路徑為絕對路徑後持久化至 globalState，並重新整理 IDE 列表
	 * 讓備份 IDE 立即以新路徑重新偵測。
	 *
	 * Validates that the path is absolute, persists it to globalState,
	 * then refreshes the IDE list so the backup IDE is re-detected at the new path.
	 *
	 * @param backupPath - 新的備份路徑（空字串可清除設定）/ New backup path (empty string clears the setting)
	 * @throws Error 當路徑非絕對路徑時拋出錯誤 / Throws error when the path is not absolute
	 */
	async setBackupIDEPath(backupPath: string): Promise<void>
	{
		const trimmed = (backupPath || '').trim();

		if (trimmed && !path.isAbsolute(trimmed))
		{
			const errorMsg = `[Backup IDE] 路徑必須是絕對路徑 / Backup path must be absolute: ${trimmed}`;
			console.error(errorMsg);
			throw new Error(errorMsg);
		}

		console.log(`[Backup IDE] 設定備份路徑 / Setting backup path: ${trimmed}`);
		await this.globalState.update(EnumGlobalStateName.backupIDEPath, trimmed);

		/** 重新整理 IDE 列表，讓備份 IDE 以新路徑重新偵測 / Refresh the IDE list to re-detect the backup IDE at the new path */
		await this.refreshIDEList();
	}

	/**
	 * 載入內建備份 IDE
	 * Load the built-in backup IDE
	 *
	 * 內建備份 IDE 永遠存在於列表中（專用於利用同步功能備份設定）。
	 * 若尚未設定路徑，則以「尚未設定」提示加入不可用列表；
	 * 若已設定路徑，則無論 settings.json 是否存在都會加入「可用」列表，
	 * 使其可被選取為同步對象。當 settings.json 不存在時，
	 * IdeSettingProvider 會在載入/同步時自動建立（含父資料夾）。
	 *
	 * The built-in backup IDE always exists in the list (dedicated to backing up settings via the sync feature).
	 * If no path is configured, it is added to the unavailable list with a "not configured" hint;
	 * otherwise it is added to the available list regardless of whether settings.json exists,
	 * so it can always be selected as a sync target. When settings.json is missing,
	 * the IdeSettingProvider auto-creates it (including parent folders) on load/sync.
	 */
	protected async loadBackupIDE(): Promise<void>
	{
		const backupPath = this.getBackupIDEPath();

		/**
		 * 尚未設定路徑：顯示提示訊息
		 * Path not configured: show a hint message
		 */
		if (!backupPath)
		{
			this.addUnavailableIDE(
				BACKUP_IDE_NAME,
				EnumIDEInfoType.backup,
				'',
				BACKUP_IDE_NOT_CONFIGURED_REASON,
			);
			return;
		}

		console.log(`[Backup IDE] 偵測備份路徑 / Detecting backup path: ${backupPath}`);

		/**
		 * 使用獨立偵測器尋找既有的 settings.json（可能在路徑下或 User 子資料夾）
		 * Use the standalone detector to find an existing settings.json (at the path or in a User subfolder)
		 */
		const [result] = this.ideDetector.detectCustomIDEs([{ name: BACKUP_IDE_NAME, path: backupPath }]);

		/**
		 * 已偵測到 settings.json 時沿用既有檔案路徑；
		 * 否則預設在備份路徑下建立 settings.json（同步時自動建立）
		 * Use the detected settings.json path when found;
		 * otherwise default to creating settings.json under the backup path (auto-created on sync)
		 */
		const detected = !!(result.detected && result.path && result.settingsPath);
		const settingsJsonPath = detected
			? result.settingsPath!
			: path.join(backupPath, 'settings.json');
		const idePath = detected ? result.path! : backupPath;

		/**
		 * 使用工具函數取得現有的 UUID（從檔案快取比對 name + path）
		 * Use the utility to get the existing UUID (matched by name + path from the file cache)
		 */
		const existingUuid = getExistingUuid({
			extensionPath: this.context.extensionPath,
			ideName: BACKUP_IDE_NAME,
			idePath,
		});

		/**
		 * 啟用 autoCreate：settings.json 不存在時於載入/同步時自動建立
		 * Enable autoCreate: settings.json is auto-created on load/sync when missing
		 */
		const settingProvider = new IdeSettingProvider(settingsJsonPath, backupPath, true);

		try
		{
			settingProvider.load();

			console.log(`[Backup IDE] ✓ 備份 IDE 已可用 / Backup IDE is available (UUID: ${existingUuid || 'new'})`);
			console.log(`[Backup IDE] settings.json 不存在時將自動建立 / settings.json is auto-created when missing`);

			this.addAvailableIDE(
				BACKUP_IDE_NAME,
				EnumIDEInfoType.backup,
				idePath,
				settingProvider,
				`[Backup IDE] ✓ 成功載入 ${BACKUP_IDE_NAME} 的設定`,
				existingUuid,
				/**
				 * settings.json 原本不存在（載入時自動建立）時不可作為同步來源，
				 * 因為沒有資料可複製；但仍可作為同步目標。
				 * When settings.json did not exist (auto-created on load), the backup IDE
				 * cannot be a sync source because there is no data to copy; it can still be a target.
				 */
				!settingProvider.isAutoCreated,
			);
		}
		catch (error)
		{
			/**
			 * settings.json 存在但無法解析（如格式錯誤）：標記為不可用
			 * settings.json exists but cannot be parsed (e.g. malformed): mark as unavailable
			 */
			console.log(`[Backup IDE] 無法載入備份 IDE / Failed to load backup IDE: ${error}`);
			this.addUnavailableIDE(
				BACKUP_IDE_NAME,
				EnumIDEInfoType.backup,
				idePath,
				`[Backup IDE] ✗ 無法讀取或解析備份設定檔案: ${error}`,
			);
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
	protected getUserDataPath(appName: string, folderName: string): string
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
		return transformIDEListForWebview(this.ideList);
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
	 * @param uuid - 可選的 IDE UUID（保持識別碼一致性）
	 * @param canBeSource - 是否可被選為同步來源 IDE（預設 true）
	 */
	protected addAvailableIDE(
		name: string,
		type: EnumIDEInfoType,
		nativePath: string,
		settingProvider: IdeSettingProvider,
		successLog: string,
		uuid?: string,
		canBeSource: boolean = true,
	): void
	{
		const finalUuid = uuid || nanoid();
		this.ideList.push({
			uuid: finalUuid,
			name,
			type,
			available: true,
			nativePath,
			settingProvider,
			canBeSource,
		});

		console.log(successLog);
		console.log(`[IDE] ✓ Successfully loaded settings for ${name} (UUID: ${finalUuid})`);
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
	protected addUnavailableIDE(
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
	 * @param uuid - 可選的 UUID，用於保持 IDE 識別碼一致性
	 * @returns 是否成功載入
	 */
	protected processIDE(
		name: string,
		type: EnumIDEInfoType,
		settingsJsonPath: string,
		nativePath: string,
		uuid?: string,
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
			console.log(`[IDE] 載入 IDE 設定成功: ${name} (類型: ${type}, UUID: ${uuid || 'auto-generated'})`);
			console.log(`[IDE] Loaded IDE settings successfully: ${name} (type: ${type}, UUID: ${uuid || 'auto-generated'})`);

			this.addAvailableIDE(
				name,
				type,
				nativePath,
				settingProvider,
				`[IDE] ✓ 成功載入 ${name} 的設定`,
				uuid,
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
	 * 根據 UUID 取得 IDE 資訊
	 * Get IDE information by UUID
	 *
	 * @param uuid - IDE 的唯一識別符 / UUID of the IDE
	 * @returns IIDEInfo | undefined - 找到則回傳該 IDE，否則回傳 undefined
	 */
	getIdeByUuid(uuid: string): IIDEInfo | undefined
	{
		return this.ideList.find(ide => ide.uuid === uuid);
	}

	/**
	 * 根據索引取得 IDE 資訊
	 * Get IDE information by index
	 *
	 * @param ideIndex - IDE 索引 / IDE index
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
	 * 新增時會自動產生 UUID 並儲存，以確保重新整理時保持一致的識別碼。
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
		const customIDEs = this.globalState.get(
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

		// 2b. 檢查名稱是否與內建備份 IDE 相同（忽略大小寫）/ Check if name matches the built-in backup IDE name
		if (normalizedInputName === BACKUP_IDE_NAME.toLowerCase())
		{
			const errorMsg = `[Custom IDE] 名稱與內建備份 IDE "${BACKUP_IDE_NAME}" 相同 / Name matches built-in backup IDE: ${name}`;
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

		// 所有驗證通過，產生 UUID 並添加新的自訂 IDE
		// All validations passed, generate UUID and add new custom IDE
		const newUuid = nanoid();
		customIDEs.push({ uuid: newUuid, name, path: settingsPath });
		await this.globalState.update(EnumGlobalStateName.customIDEs, customIDEs);

		console.log(`[Custom IDE] 已添加 / Added: ${name} at ${settingsPath} (UUID: ${newUuid})`);

		// 重新整理以驗證新路徑 / Refresh to validate new path
		await this.refreshIDEList();

		return true;
	}

	/**
	 * 移除自訂 IDE 路徑（根據 UUID）
	 * Remove a custom IDE path (by UUID)
	 *
	 * @param uuid - IDE 的唯一識別符 / IDE UUID
	 */
	async removeCustomIDEByUuid(uuid: string): Promise<void>
	{
		console.log(`[Custom IDE] 嘗試移除自訂 IDE，UUID: ${uuid}`);
		console.log(`[Custom IDE] Attempting to remove custom IDE, UUID: ${uuid}`);

		const ide = this.getIdeByUuid(uuid);

		if (!ide)
		{
			console.warn(`[Custom IDE] 找不到 ID 為 ${uuid} 的 IDE`);
			console.warn(`[Custom IDE] Cannot find IDE with UUID: ${uuid}`);
			return;
		}

		if (ide.type !== EnumIDEInfoType.custom)
		{
			console.warn(`[Custom IDE] IDE "${ide.name}" (UUID: ${uuid}) 不是自訂 IDE，無法移除`);
			console.warn(`[Custom IDE] IDE "${ide.name}" (UUID: ${uuid}) is not a custom IDE, cannot remove`);
			return;
		}

		// 從全域狀態讀取自訂 IDE 列表 / Read custom IDE list from global state
		const customIDEs = this.globalState.get(
			EnumGlobalStateName.customIDEs,
			[],
		);

		console.log(`[Custom IDE] 目前的自訂 IDE 數量: ${customIDEs.length}`);
		console.log(`[Custom IDE] Current custom IDE count: ${customIDEs.length}`);

		// 過濾掉要移除的 IDE / Filter out the IDE to be removed
		const filtered = customIDEs.filter((c) => c.uuid !== uuid);

		if (filtered.length === customIDEs.length)
		{
			console.warn(`[Custom IDE] 在 globalState 中找不到 UUID 為 ${uuid} 的自訂 IDE`);
			console.warn(`[Custom IDE] Cannot find custom IDE with UUID ${uuid} in globalState`);
			return;
		}

		await this.globalState.update(EnumGlobalStateName.customIDEs, filtered);

		console.log(`[Custom IDE] 已移除 / Removed: ${ide.name} (UUID: ${uuid}, Path: ${ide.nativePath})`);
		console.log(`[Custom IDE] Removed successfully: ${ide.name} (UUID: ${uuid}, Path: ${ide.nativePath})`);

		// 重新整理 IDE 列表 / Refresh IDE list
		await this.refreshIDEList();
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
			const customIDEs = this.globalState.get(
				EnumGlobalStateName.customIDEs,
				[],
			);

			// 過濾掉要移除的 IDE / Filter out the IDE to be removed
			const filtered = customIDEs.filter((c) => c.path !== ide.nativePath);
			await this.globalState.update(EnumGlobalStateName.customIDEs, filtered);

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
