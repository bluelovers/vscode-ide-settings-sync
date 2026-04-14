/**
 * 獨立的 IDE 偵測工具
 * Standalone IDE Detection Utility
 *
 * 此工具提供不依賴 VSCode 擴展架構的 IDE 偵測功能，
 * 可在 Node.js 環境中獨立運行或通過參數化使用。
 *
 * This utility provides IDE detection functionality without VSCode extension dependencies,
 * can run independently in Node.js environment or be used with parameters.
 */

import path from 'upath2';
import { existsSync } from 'fs';
import { IKnownIDE } from '../data/knownIDEs';
import { IPathType } from '@lazy-node/types-path';
import { ITSPickExtra, ITSRequireAtLeastOne, ITSRequiredPick } from 'ts-type';

/**
 * IDE 偵測結果介面
 * IDE detection result interface
 */
export interface IDetectionResult
{
	/**
	 * IDE 顯示名稱
	 * IDE display name
	 */
	name: string;
	/**
	 * 是否成功偵測到
	 * Whether successfully detected
	 */
	detected: boolean;
	/**
	 * IDE 的實際路徑（如果偵測到）
	 * Actual IDE path (if detected)
	 */
	path?: string;
	/**
	 * settings.json 檔案路徑（如果偵測到）
	 * settings.json file path (if detected)
	 */
	settingsPath?: string;
	/**
	 * 嘗試過的路徑列表
	 * List of attempted paths
	 */
	attemptedPaths: string[];
	/**
	 * 偵測失敗的原因（如果未偵測到）
	 * Reason for detection failure (if not detected)
	 */
	reason?: string;
}

/**
 * 自訂 IDE 配置介面
 * Custom IDE configuration interface
 */
export interface ICustomIDEConfig
{
	name: string;
	path: string;
}

/**
 * IDE 偵測配置介面
 * IDE detection configuration interface
 */
export interface IDetectionConfig
{
	/**
	 * 自訂用戶資料目錄（可選）
	 * Custom user data directory (optional)
	 * 如果未提供，將使用系統環境變數
	 * If not provided, will use system environment variables
	 */
	userDataDir?: string;
	/**
	 * 是否啟用詳細日誌
	 * Whether to enable verbose logging
	 */
	verbose?: boolean;
	/**
	 * 自訂日誌函數（可選）
	 * Custom log function (optional)
	 */
	logger?: (message: string) => void;
	/**
	 * 自訂 IDE 列表（可選）
	 * Custom IDE list (optional)
	 */
	customIDEs?: ICustomIDEConfig[];

	/**
	 * 適用於測試環境
	 */
	pathLib?: ITSRequireAtLeastOne<Partial<IPathType>, 'normalize' | 'join' | 'resolve'>;
}

/**
 * 核心 IDE 偵測工具類別
 * Core IDE detection utility class
 */
export class IDEDetector
{
	protected config: Omit<IDetectionConfig, 'pathLib'> & {
		pathLib: Required<NonNullable<IDetectionConfig["pathLib"]>>,
	};

	/**
	 * 建構子
	 * @param config 偵測配置
	 */
	constructor(config: IDetectionConfig = {})
	{
		this.config = {
			verbose: false,
			...config as any,
		};

		if (this.config.pathLib)
		{
			this.config.pathLib = {
				...path,
				...this.config.pathLib,
			};
		}
		else
		{
			this.config.pathLib = path;
		}
	}

	/**
	 * 記錄日誌
	 * Log message
	 * @param message 日誌訊息
	 */
	private log(message: string): void
	{
		if (this.config.verbose)
		{
			if (this.config.logger)
			{
				this.config.logger(message);
			}
			else
			{
				console.log(message);
			}
		}
	}

	protected _getUserDataPathCore(): string
	{
		/**
		 * 使用配置的用戶資料目錄或系統環境變數
		 * Use configured user data directory or system environment variables
		 */
		const userDataDir = this.config.userDataDir ||
			process.env.APPDATA ||
			process.env.HOME ||
			'';

		return userDataDir;
	}

	/**
	 * 取得用戶資料路徑
	 * Get user data path
	 * @param appName 應用程式名稱
	 * @param folderName 資料夾名稱
	 * @returns 完整路徑
	 */
	private getUserDataPath(appName: string, folderName: string): string
	{
		const userDataDir = this._getUserDataPathCore();

		if (!userDataDir)
		{
			this.log('[IDE Detection] 警告：無法確定系統的應用資料目錄');
			this.log('[IDE Detection] Warning: Cannot determine system app data directory');
		}

		const fullPath = this.config.pathLib.join(userDataDir, appName, folderName);
		this.log(`[Path Resolution] ${appName}/${folderName} -> ${fullPath}`);

		return fullPath;
	}

	/**
	 * 偵測單個 IDE
	 * Detect a single IDE
	 * @param ide IDE 配置
	 * @returns 偵測結果
	 */
	detectIDE(ide: IKnownIDE): IDetectionResult
	{
		const result: IDetectionResult = {
			name: ide.name,
			detected: false,
			attemptedPaths: [],
		};

		let foundPath: string | null = null;
		let detectedPath: string | null = null;

		this.log(`[IDE Detection] 開始偵測 ${ide.name}`);
		this.log(`[IDE Detection] Starting detection for ${ide.name}`);

		// 嘗試多個可能的資料夾名稱
		// Try multiple possible folder name variations
		for (const appFolderName of ide.appFolderNames)
		{
			const testPath = this.config.pathLib.normalize(this.getUserDataPath(appFolderName, 'User'));
			const settingsJsonPath = this.config.pathLib!.join(testPath, 'settings.json');

			result.attemptedPaths.push(testPath);

			this.log(`[IDE Detection] 嘗試檢測 ${ide.name} at ${testPath}`);
			this.log(`[IDE Detection] Attempting to detect ${ide.name} at ${testPath}`);

			// 步驟 1：檢查主資料夾是否存在
			// Step 1: Check if the main folder exists
			if (existsSync(testPath))
			{
				detectedPath = testPath;
				this.log(`[IDE Detection] ✓ 找到資料夾 ${ide.name} at ${testPath}`);
				this.log(`[IDE Detection] ✓ Found folder for ${ide.name} at ${testPath}`);

				// 步驟 2：檢查 settings.json 檔案是否存在
				// Step 2: Check if settings.json file exists
				if (existsSync(settingsJsonPath))
				{
					foundPath = testPath;
					this.log(`[IDE Detection] ✓✓ 成功偵測到 ${ide.name}，settings.json 已找到`);
					this.log(`[IDE Detection] ✓✓ Successfully detected ${ide.name}, settings.json found`);
					// 成功找到，退出迴圈
					// Found successfully, exit loop
					break;
				}
				else
				{
					// 資料夾存在但缺少 settings.json 檔案
					// Folder exists but settings.json is missing
					this.log(`[IDE Detection] ⚠ 資料夾存在但找不到 settings.json: ${settingsJsonPath}`);
					this.log(`[IDE Detection] ⚠ Folder exists but settings.json not found: ${settingsJsonPath}`);
				}
			}
			else
			{
				this.log(`[IDE Detection] ✗ 路徑不存在 / Path not found: ${testPath}`);
			}
		}

		// 處理偵測結果
		// Handle detection result
		if (foundPath)
		{
			result.detected = true;
			result.path = foundPath;
			result.settingsPath = this.config.pathLib!.join(foundPath, 'settings.json');
			this.log(`[IDE Detection] ✓ 成功偵測到 ${ide.name}`);
			this.log(`[IDE Detection] ✓ Successfully detected ${ide.name}`);
		}
		else
		{
			result.detected = false;
			const triedPaths = result.attemptedPaths.join('\n- ');
			result.reason = `IDE not found. Tried paths:\n- ${triedPaths}`;
			this.log(`[IDE Detection] ✗ 未偵測到 ${ide.name}`);
			this.log(`[IDE Detection] ✗ ${ide.name} not detected`);
		}

		return result;
	}

	/**
	 * 偵測多個 IDE
	 * Detect multiple IDEs
	 * @param ides IDE 配置列表
	 * @returns 偵測結果列表
	 */
	detectIDEs(ides: IKnownIDE[]): IDetectionResult[]
	{
		this.log(`[IDE Detection] 開始偵測 ${ides.length} 個 IDE`);
		this.log(`[IDE Detection] Starting detection for ${ides.length} IDEs`);

		const results: IDetectionResult[] = [];

		for (const ide of ides)
		{
			const result = this.detectIDE(ide);
			results.push(result);
		}

		const detectedCount = results.filter(r => r.detected).length;
		this.log(`[IDE Detection] 偵測完成：${detectedCount}/${ides.length} 個 IDE 已偵測到`);
		this.log(`[IDE Detection] Detection complete: ${detectedCount}/${ides.length} IDEs detected`);

		return results;
	}

	/**
	 * 偵測自訂 IDE
	 * Detect custom IDEs
	 * @param customIDEs 自訂 IDE 列表
	 * @returns 偵測結果列表
	 */
	detectCustomIDEs(customIDEs: ICustomIDEConfig[]): IDetectionResult[]
	{
		const results: IDetectionResult[] = [];

		this.log(`[Custom IDE] 開始偵測 ${customIDEs.length} 個自訂 IDE`);
		this.log(`[Custom IDE] Starting detection for ${customIDEs.length} custom IDEs`);

		for (const customIDE of customIDEs)
		{
			const result = this.detectCustomIDE(customIDE);
			results.push(result);
		}

		const detectedCount = results.filter(r => r.detected).length;
		this.log(`[Custom IDE] 偵測完成：${detectedCount}/${customIDEs.length} 個自訂 IDE 已偵測到`);
		this.log(`[Custom IDE] Detection complete: ${detectedCount}/${customIDEs.length} custom IDEs detected`);

		return results;
	}

	/**
	 * 偵測單個自訂 IDE
	 * Detect a single custom IDE
	 * @param customIDE 自訂 IDE 配置
	 * @returns 偵測結果
	 */
	private detectCustomIDE(customIDE: ICustomIDEConfig): IDetectionResult
	{
		const result: IDetectionResult = {
			name: customIDE.name,
			detected: false,
			attemptedPaths: [],
		};

		this.log(`[Custom IDE] 檢查自訂 IDE: ${customIDE.name} at ${customIDE.path}`);
		this.log(`[Custom IDE] Checking custom IDE: ${customIDE.name} at ${customIDE.path}`);

		// 嘗試多個可能的 settings.json 路徑
		// Try multiple possible settings.json paths
		let settingsJsonPath: string | null = null;
		let foundPath: string | null = null;

		// 選項 1: 直接在提供的路徑下尋找
		// Option 1: Look directly in the provided path
		let _path = path.isAbsolute(customIDE.path)
			? customIDE.path
			: this.config.pathLib!.join(this._getUserDataPathCore(), customIDE.path)
		;

		const directPath = this.config.pathLib!.join(_path, 'settings.json');
		result.attemptedPaths.push(directPath);

		if (existsSync(directPath))
		{
			settingsJsonPath = directPath;
			foundPath = _path;
			this.log(`[Custom IDE] 直接路徑找到 settings.json: ${directPath}`);
			this.log(`[Custom IDE] Found settings.json in direct path: ${directPath}`);
		}

		// 選項 2: 在 User 子資料夾中尋找
		// Option 2: Look in User subfolder
		if (!settingsJsonPath)
		{
			_path = this.config.pathLib!.join(_path, 'User');

			const userSubfolderPath = this.config.pathLib!.join(_path, 'settings.json');
			result.attemptedPaths.push(userSubfolderPath);

			if (existsSync(userSubfolderPath))
			{
				settingsJsonPath = userSubfolderPath;
				foundPath = _path;
				this.log(`[Custom IDE] User 子資料夾找到 settings.json: ${userSubfolderPath}`);
				this.log(`[Custom IDE] Found settings.json in User subfolder: ${userSubfolderPath}`);
			}
		}

		// 檢查最終結果
		// Check final result
		if (settingsJsonPath && foundPath)
		{
			result.detected = true;
			result.path = foundPath;
			result.settingsPath = settingsJsonPath;
			this.log(`[Custom IDE] ✓ 成功偵測到自訂 IDE ${customIDE.name}`);
			this.log(`[Custom IDE] ✓ Successfully detected custom IDE ${customIDE.name}`);
		}
		else
		{
			// settings.json 檔案不存在
			// settings.json file does not exist
			const directCheck = existsSync(directPath);
			const userCheck = existsSync(this.config.pathLib!.join(_path, 'settings.json'));

			let reason = 'settings.json not found';
			if (!directCheck && !userCheck)
			{
				reason = `settings.json not found in:\n- ${directPath}\n- ${this.config.pathLib!.join(_path, 'settings.json')}`;
			}

			result.reason = reason;
			this.log(`[Custom IDE] ✗ ${reason}`);
		}

		return result;
	}

	/**
	 * 取得已偵測到的 IDE 列表
	 * Get list of detected IDEs
	 * @param ides IDE 配置列表
	 * @returns 已偵測到的 IDE 列表
	 */
	getDetectedIDEs(ides: IKnownIDE[]): IDetectionResult[]
	{
		const results = this.detectIDEs(ides);
		return results.filter(result => result.detected);
	}

	/**
	 * 取得未偵測到的 IDE 列表
	 * Get list of undetected IDEs
	 * @param ides IDE 配置列表
	 * @returns 未偵測到的 IDE 列表
	 */
	getUndetectedIDEs(ides: IKnownIDE[]): IDetectionResult[]
	{
		const results = this.detectIDEs(ides);
		return results.filter(result => !result.detected);
	}

	/**
	 * 偵測所有 IDE（包含已知 IDE 和自訂 IDE）
	 * Detect all IDEs (including known IDEs and custom IDEs)
	 * @param knownIDEs 已知 IDE 列表
	 * @param customIDEs 自訂 IDE 列表（可選）
	 * @returns 完整的偵測結果
	 */
	detectAllIDEs(knownIDEs: IKnownIDE[], customIDEs?: ICustomIDEConfig[]): {
		knownResults: IDetectionResult[];
		customResults: IDetectionResult[];
		allResults: IDetectionResult[];
	}
	{
		const knownResults = this.detectIDEs(knownIDEs);
		const customResults = customIDEs ? this.detectCustomIDEs(customIDEs) : [];
		const allResults = [...knownResults, ...customResults];

		return {
			knownResults,
			customResults,
			allResults,
		};
	}
}

/**
 * 便利函數：偵測單個 IDE
 * Convenience function: detect a single IDE
 * @param ide IDE 配置
 * @param config 偵測配置
 * @returns 偵測結果
 */
export function detectIDE(ide: IKnownIDE, config?: IDetectionConfig): IDetectionResult
{
	const detector = new IDEDetector(config);
	return detector.detectIDE(ide);
}

/**
 * 便利函數：偵測多個 IDE
 * Convenience function: detect multiple IDEs
 * @param ides IDE 配置列表
 * @param config 偵測配置
 * @returns 偵測結果列表
 */
export function detectIDEs(ides: IKnownIDE[], config?: IDetectionConfig): IDetectionResult[]
{
	const detector = new IDEDetector(config);
	return detector.detectIDEs(ides);
}

/**
 * 便利函數：取得已偵測到的 IDE
 * Convenience function: get detected IDEs
 * @param ides IDE 配置列表
 * @param config 偵測配置
 * @returns 已偵測到的 IDE 列表
 */
export function getDetectedIDEs(ides: IKnownIDE[], config?: IDetectionConfig): IDetectionResult[]
{
	const detector = new IDEDetector(config);
	return detector.getDetectedIDEs(ides);
}

/**
 * 便利函數：取得未偵測到的 IDE
 * Convenience function: get undetected IDEs
 * @param ides IDE 配置列表
 * @param config 偵測配置
 * @returns 未偵測到的 IDE 列表
 */
export function getUndetectedIDEs(ides: IKnownIDE[], config?: IDetectionConfig): IDetectionResult[]
{
	const detector = new IDEDetector(config);
	return detector.getUndetectedIDEs(ides);
}

/**
 * 便利函數：偵測自訂 IDE
 * Convenience function: detect custom IDEs
 * @param customIDEs 自訂 IDE 列表
 * @param config 偵測配置
 * @returns 偵測結果列表
 */
export function detectCustomIDEs(customIDEs: ICustomIDEConfig[], config?: IDetectionConfig): IDetectionResult[]
{
	const detector = new IDEDetector(config);
	return detector.detectCustomIDEs(customIDEs);
}

/**
 * 便利函數：偵測所有 IDE（包含已知和自訂）
 * Convenience function: detect all IDEs (including known and custom)
 * @param knownIDEs 已知 IDE 列表
 * @param customIDEs 自訂 IDE 列表
 * @param config 偵測配置
 * @returns 完整的偵測結果
 */
export function detectAllIDEs(knownIDEs: IKnownIDE[], customIDEs?: ICustomIDEConfig[], config?: IDetectionConfig): {
	knownResults: IDetectionResult[];
	customResults: IDetectionResult[];
	allResults: IDetectionResult[];
}
{
	const detector = new IDEDetector(config);
	return detector.detectAllIDEs(knownIDEs, customIDEs);
}
