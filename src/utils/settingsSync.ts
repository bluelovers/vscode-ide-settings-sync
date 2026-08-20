/**
 * 設定同步工具函數
 * Settings Sync Utilities
 *
 * 抽離設定同步邏輯，便於測試
 * Extracts settings sync logic for testability
 */

import { IDEProvider } from '../providers/ideProvider';
import { IdeSettingProvider } from '../providers/ideSettingProvider';
import { IIDEInfo } from '../types';

/**
 * 取得 source 和 target IDE
 *
 * @param sourceIDEIndex
 * @param targetIDEIndices
 * @param ideProvider
 * @returns
 */
export function _handleIDEListByIndexList<T = IIDEInfo>(ideProvider: IDEProvider,
	sourceIDEIndex: number,
	targetIDEIndices: number[],
	fn?: (info: IIDEInfo) => NonNullable<T>,
)
{

	fn ??= (info) => info as any;

	/**
	 * 取得 source IDE
	 */
	const sourceIDE = fn(ideProvider.getIdeByIndex(sourceIDEIndex)!) as NonNullable<T>;

	/**
	 * 取得 target IDE 陣列
	 */
	const targetIDEs = targetIDEIndices.reduce((acc, index) =>
	{
		if (index !== sourceIDEIndex)
		{
			const ide = ideProvider.getIdeByIndex(index)!;
			acc.push(fn!(ide));
		}
		return acc;
	}, [] as NonNullable<T>[]);

	return {
		/**
		 * 取得 source IDE
		 */
		sourceIDE,
		/**
		 * 取得 target IDE 陣列
		 */
		targetIDEs,
	};
}

/**
 * 同步結果介面
 * Sync result interface
 */
export interface ISyncResult
{
	/** 設定鍵值 / Setting key */
	settingKey: string;
	/** 同步前的值 / Value before sync */
	oldValue: unknown;
	/** 同步後的值 / Value after sync */
	newValue: unknown;
	/** 是否成功 / Whether successful */
	success: boolean;
	/** 錯誤訊息（若有）/ Error message if any */
	error?: string;
}

/**
 * 同步設定從 sourceProvider 到多個 targetProviders
 * Sync settings from source provider to multiple target providers
 *
 * @param sourceProvider - 來源 IDE 的設定供應商 / Source IDE setting provider
 * @param targetProviders - 目標 IDE 的設定供應商陣列 / Array of target IDE setting providers
 * @param settingKeys - 要同步的設定鍵值陣列 / Array of setting keys to sync
 * @returns 同步結果陣列 / Array of sync results
 */
export function _syncSettingsCore(
	sourceProvider: IdeSettingProvider,
	targetProviders: IdeSettingProvider[],
	settingKeys: string[],
)
{
	const results: ISyncResult[] = [];

	for (const settingKey of settingKeys)
	{
		const jsonPath = [settingKey];

		/**
		 * 從 source IDE 讀取設定值
		 */
		const sourceValue = sourceProvider.get(jsonPath);

		for (const targetProvider of targetProviders)
		{
			/**
			 * 將值同步到 target IDE
			 */
			targetProvider.set(jsonPath, sourceValue);
		}
	}
}

/**
 * @deprecated
 */
export async function syncSetting(
	sourceProvider: IdeSettingProvider,
	targetProvider: IdeSettingProvider,
	settingKey: string,
): Promise<ISyncResult>
{
	throw new Error(`deprecated`);
}

export async function _performSyncCore(
	ideProvider: IDEProvider,
	sourceIDEIndex: number,
	targetIDEIndices: number[],
	settingKeys: string[],
)
{
	/**
	 * 驗證來源 IDE 是否可作為同步來源
	 * Validate that the source IDE can be used as a sync source
	 *
	 * 當來源 IDE 的 settings.json 不存在（自動建立、沒有資料可複製）時，
	 * 不允許以它作為同步來源，避免把空資料同步到其他 IDE。
	 * When the source IDE's settings.json does not exist (auto-created, nothing to copy),
	 * it cannot be used as a sync source, preventing empty data from being synced to other IDEs.
	 */
	const sourceIde = ideProvider.getIdeByIndex(sourceIDEIndex);
	if (sourceIde && sourceIde.canBeSource === false)
	{
		throw new Error(`[Sync] Source IDE "${sourceIde.name}" has no data to copy (settings.json does not exist yet)`);
	}

	const {
		sourceIDE,
		targetIDEs,
	} = _handleIDEListByIndexList(ideProvider, sourceIDEIndex, targetIDEIndices, (info) => info.settingProvider.load());

	// 使用抽離的同步函數
	_syncSettingsCore(
		sourceIDE,
		targetIDEs,
		settingKeys,
	);

	// 保存所有 IDE 的設定
	ideProvider.saveSync(sourceIDEIndex, targetIDEIndices);
}
