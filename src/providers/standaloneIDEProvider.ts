/**
 * 獨立的 IDE 偵測 Provider
 * Standalone IDE Detection Provider
 *
 * 此 Provider 提供不依賴 VSCode 擴展架構的 IDE 偵測和管理功能，
 * 可在 Node.js 環境中獨立運行。
 *
 * This provider provides IDE detection and management functionality without VSCode extension dependencies,
 * can run independently in Node.js environment.
 */

import { IKnownIDE } from '../data/knownIDEs';
import {
	IDetectionResult,
	IDetectionConfig,
	IDEDetector,
	detectIDEs,
	getDetectedIDEs,
	getUndetectedIDEs,
} from '../utils/ideDetector';
import { IPathType } from '@lazy-node/types-path';

/**
 * IDE 資訊介面（獨立版本）
 * IDE information interface (standalone version)
 */
export interface IStandaloneIDEInfo
{
	/**
	 * IDE 顯示名稱
	 * IDE display name
	 */
	name: string;
	/**
	 * 是否已偵測到並可用
	 * Whether detected and available
	 */
	available: boolean;
	/**
	 * IDE 的實際資料夾路徑
	 * IDE actual folder path
	 */
	nativePath: string;
	/**
	 * settings.json 檔案路徑
	 * settings.json file path
	 */
	settingsPath: string;
	/**
	 * 偵測結果詳情
	 * Detection result details
	 */
	detectionResult: IDetectionResult;
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
 * 獨立 IDE Provider 配置介面
 * Standalone IDE Provider configuration interface
 */
export interface IStandaloneProviderConfig extends IDetectionConfig
{

}

/**
 * 獨立的 IDE 偵測 Provider
 * Standalone IDE Detection Provider
 */
export class StandaloneIDEProvider
{
	private config: IStandaloneProviderConfig;
	private detector: IDEDetector;
	private knownIDEs: IKnownIDE[];
	private detectionResults: Map<string, IDetectionResult> = new Map();

	/**
	 * 建構子
	 * @param knownIDEs 已知 IDE 列表
	 * @param config Provider 配置
	 */
	constructor(knownIDEs: IKnownIDE[], config: IStandaloneProviderConfig = {})
	{
		this.knownIDEs = knownIDEs;
		this.config = config;
		this.detector = new IDEDetector(config);
	}

	/**
	 * 重新偵測所有 IDE
	 * Redetect all IDEs
	 * @returns 偵測結果
	 */
	async refresh(): Promise<IDetectionResult[]>
	{
		this.detectionResults.clear();

		// 使用統一的偵測方法
		// Use unified detection method
		const allResults = this.detector.detectAllIDEs(this.knownIDEs, this.config.customIDEs);

		// 存儲所有結果
		// Store all results
		for (const result of allResults.allResults)
		{
			this.detectionResults.set(result.name, result);
		}

		return allResults.allResults;
	}

	/**
	 * 取得所有 IDE 資訊
	 * Get all IDE information
	 * @returns IDE 資訊列表
	 */
	getAllIDEs(): IStandaloneIDEInfo[]
	{
		const ideInfos: IStandaloneIDEInfo[] = [];

		for (const result of this.detectionResults.values())
		{
			if (result.detected && result.path && result.settingsPath)
			{
				ideInfos.push({
					name: result.name,
					available: true,
					nativePath: result.path,
					settingsPath: result.settingsPath,
					detectionResult: result,
				});
			}
		}

		return ideInfos;
	}

	/**
	 * 取得可用的 IDE 列表
	 * Get available IDE list
	 * @returns 可用的 IDE 列表
	 */
	getAvailableIDEs(): IStandaloneIDEInfo[]
	{
		return this.getAllIDEs().filter(ide => ide.available);
	}

	/**
	 * 取得不可用的 IDE 列表
	 * Get unavailable IDE list
	 * @returns 不可用的 IDE 列表
	 */
	getUnavailableIDEs(): IDetectionResult[]
	{
		const unavailableResults: IDetectionResult[] = [];

		for (const result of this.detectionResults.values())
		{
			if (!result.detected)
			{
				unavailableResults.push(result);
			}
		}

		return unavailableResults;
	}

	/**
	 * 根據名稱取得 IDE 資訊
	 * Get IDE information by name
	 * @param name IDE 名稱
	 * @returns IDE 資訊或 undefined
	 */
	getIDEByName(name: string): IStandaloneIDEInfo | undefined
	{
		return this.getAllIDEs().find(ide => ide.name === name);
	}

	/**
	 * 根據名稱取得偵測結果
	 * Get detection result by name
	 * @param name IDE 名稱
	 * @returns 偵測結果或 undefined
	 */
	getDetectionResult(name: string): IDetectionResult | undefined
	{
		return this.detectionResults.get(name);
	}

	/**
	 * 檢查 IDE 是否可用
	 * Check if IDE is available
	 * @param name IDE 名稱
	 * @returns 是否可用
	 */
	isIDEAvailable(name: string): boolean
	{
		const result = this.detectionResults.get(name);
		return result?.detected ?? false;
	}

	/**
	 * 取得可用 IDE 的數量
	 * Get count of available IDEs
	 * @returns 可用 IDE 的數量
	 */
	getAvailableIDECount(): number
	{
		return this.getAvailableIDEs().length;
	}

	/**
	 * 取得偵測統計資訊
	 * Get detection statistics
	 * @returns 統計資訊
	 */
	getStatistics(): {
		total: number;
		detected: number;
		undetected: number;
		detectionRate: number;
	}
	{
		const total = this.detectionResults.size;
		const detected = Array.from(this.detectionResults.values()).filter(r => r.detected).length;
		const undetected = total - detected;
		const detectionRate = total > 0 ? detected / total : 0;

		return {
			total,
			detected,
			undetected,
			detectionRate,
		};
	}

	/**
	 * 匯出偵測結果為 JSON
	 * Export detection results as JSON
	 * @returns JSON 字串
	 */
	exportResults(): string
	{
		const results = {
			timestamp: new Date().toISOString(),
			statistics: this.getStatistics(),
			availableIDEs: this.getAvailableIDEs(),
			unavailableIDEs: this.getUnavailableIDEs(),
			allResults: Array.from(this.detectionResults.values()),
		};

		return JSON.stringify(results, null, 2);
	}

	/**
	 * 設定自訂 IDE 列表
	 * Set custom IDE list
	 * @param customIDEs 自訂 IDE 列表
	 */
	setCustomIDEs(customIDEs: ICustomIDEConfig[]): void
	{
		this.config.customIDEs = customIDEs;
	}

	/**
	 * 新增自訂 IDE
	 * Add custom IDE
	 * @param customIDE 自訂 IDE 配置
	 */
	addCustomIDE(customIDE: ICustomIDEConfig): void
	{
		if (!this.config.customIDEs)
		{
			this.config.customIDEs = [];
		}
		this.config.customIDEs.push(customIDE);
	}

	/**
	 * 移除自訂 IDE
	 * Remove custom IDE
	 * @param name IDE 名稱
	 * @returns 是否成功移除
	 */
	removeCustomIDE(name: string): boolean
	{
		if (!this.config.customIDEs)
		{
			return false;
		}

		const index = this.config.customIDEs.findIndex(ide => ide.name === name);
		if (index !== -1)
		{
			this.config.customIDEs.splice(index, 1);
			return true;
		}

		return false;
	}
}

/**
 * 便利函數：創建獨立 IDE Provider
 * Convenience function: create standalone IDE provider
 * @param knownIDEs 已知 IDE 列表
 * @param config 配置
 * @returns 獨立 IDE Provider 實例
 */
export function createStandaloneIDEProvider(knownIDEs: IKnownIDE[],
	config?: IStandaloneProviderConfig,
): StandaloneIDEProvider
{
	return new StandaloneIDEProvider(knownIDEs, config);
}

/**
 * 便利函數：快速偵測所有 IDE
 * Convenience function: quick detect all IDEs
 * @param knownIDEs 已知 IDE 列表
 * @param config 配置
 * @returns 偵測結果
 */
export async function quickDetectIDEs(knownIDEs: IKnownIDE[], config?: IStandaloneProviderConfig): Promise<{
	available: IStandaloneIDEInfo[];
	unavailable: IDetectionResult[];
	statistics: ReturnType<StandaloneIDEProvider['getStatistics']>;
}>
{
	const provider = createStandaloneIDEProvider(knownIDEs, config);
	await provider.refresh();

	return {
		available: provider.getAvailableIDEs(),
		unavailable: provider.getUnavailableIDEs(),
		statistics: provider.getStatistics(),
	};
}
