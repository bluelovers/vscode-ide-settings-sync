/**
 * IDE 列表檔案快取工具
 * IDE List File Cache Utility
 *
 * 將 IDE 列表儲存至檔案，實現跨工作區的持久化
 * Stores IDE list to file for cross-workspace persistence
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IIDEInfoWebview } from '../webview/components/types';

/**
 * 快取檔案名稱
 * Cache file name
 */
const CACHE_FILE_NAME = '.vscode-ide-cache.json';

/**
 * 快取資料結構
 * Cache data structure
 */
export interface IIDECacheData
{
	/** 快取版本 / Cache version */
	version: string;
	/** 快取時間 / Cache timestamp */
	cachedAt: string;
	/** IDE 列表 / IDE list */
	ides: Array<{
		uuid: string;
		name: string;
		type: string;
		nativePath: string;
	}>;
	/** 來源 IDE UUID / Source IDE UUID */
	sourceIDEUuid?: string;
}

/**
 * 用於比對的 IDE 項目
 * IDE item for matching
 */
export interface IIDEInfoForMatch
{
	uuid: string;
	name: string;
	type: string;
	nativePath: string;
}

/**
 * 取得快取檔案路徑
 * Get cache file path
 *
 * @param extensionPath - 擴充套件路徑
 * @returns 快取檔案完整路徑
 */
function getCacheFilePath(extensionPath: string): string
{
	return path.join(extensionPath, CACHE_FILE_NAME);
}

/**
 * 從多個來源取得現有的 UUID
 * Get existing UUID from multiple sources
 *
 * 優先順序：
 * 1. 檔案快取中的 UUID
 * 2. globalState 中的 UUID
 *
 * Priority:
 * 1. UUID from file cache
 * 2. UUID from globalState
 *
 * @param options - 選項物件
 * @param options.extensionPath - 擴充套件路徑
 * @param options.ideName - IDE 名稱
 * @param options.idePath - IDE 路徑
 * @param options.globalStateIDEs - globalState 中的 IDE 列表（可選）
 * @returns 現有的 UUID 或 undefined
 */
export function getExistingUuid(options: {
	extensionPath: string;
	ideName: string;
	idePath: string;
	globalStateIDEs?: Array<{ uuid: string; name: string; path: string }>;
}): string | undefined
{
	const { extensionPath, ideName, idePath, globalStateIDEs } = options;

	// 嘗試從檔案快取取得 UUID
	// Try to get UUID from file cache
	const cachedData = loadIDECache(extensionPath);
	if (cachedData?.ides)
	{
		const cachedIDE = cachedData.ides.find(
			c => c.name === ideName && c.nativePath === idePath,
		);
		if (cachedIDE?.uuid)
		{
			console.log(`[IDE Cache] 從檔案快取找到 UUID: ${cachedIDE.uuid} for ${ideName}`);
			console.log(`[IDE Cache] Found UUID from file cache: ${cachedIDE.uuid} for ${ideName}`);
			return cachedIDE.uuid;
		}
	}

	// 嘗試從 globalState 取得 UUID
	// Try to get UUID from globalState
	if (globalStateIDEs && globalStateIDEs.length > 0)
	{
		const globalStateIDE = globalStateIDEs.find(ide => ide.name === ideName);
		if (globalStateIDE?.uuid)
		{
			console.log(`[IDE Cache] 從 globalState 找到 UUID: ${globalStateIDE.uuid} for ${ideName}`);
			console.log(`[IDE Cache] Found UUID from globalState: ${globalStateIDE.uuid} for ${ideName}`);
			return globalStateIDE.uuid;
		}
	}

	return undefined;
}

/**
 * 檢查快取檔案是否存在
 * Check if cache file exists
 *
 * @param extensionPath - 擴充套件路徑
 * @returns 是否存在
 */
export function isIDECacheExists(extensionPath: string): boolean
{
	const cachePath = getCacheFilePath(extensionPath);
	return fs.existsSync(cachePath);
}

/**
 * 儲存 IDE 列表到檔案快取
 * Save IDE list to file cache
 *
 * @param extensionPath - 擴充套件路徑
 * @param ides - IDE 列表
 * @param sourceIDEUuid - 來源 IDE UUID（可選）
 * @returns 是否成功
 */
export function saveIDECache(
	extensionPath: string,
	ides: IIDEInfoWebview[],
	sourceIDEUuid?: string,
): boolean
{
	try
	{
		const cachePath = getCacheFilePath(extensionPath);
		const cacheData: IIDECacheData = {
			version: '1.0.0',
			cachedAt: new Date().toISOString(),
			ides: ides.map(ide => ({
				uuid: ide.uuid,
				name: ide.name,
				type: ide.type,
				nativePath: ide.nativePath,
			})),
			sourceIDEUuid,
		};

		fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
		console.log(`[IDE Cache] 已儲存 ${ides.length} 個 IDE 至檔案快取`);
		console.log(`[IDE Cache] Saved ${ides.length} IDEs to file cache`);
		return true;
	}
	catch (error)
	{
		console.error(`[IDE Cache] 儲存失敗 / Save failed:`, error);
		return false;
	}
}

/**
 * 從檔案快取載入 IDE 列表
 * Load IDE list from file cache
 *
 * @param extensionPath - 擴充套件路徑
 * @returns IDE 列表與來源 IDE UUID，或 null（如果不存在）
 */
export function loadIDECache(
	extensionPath: string,
): { ides: IIDEInfoWebview[]; sourceIDEUuid?: string } | null
{
	try
	{
		const cachePath = getCacheFilePath(extensionPath);
		if (!fs.existsSync(cachePath))
		{
			return null;
		}

		const content = fs.readFileSync(cachePath, 'utf-8');
		const cacheData: IIDECacheData = JSON.parse(content);

		console.log(`[IDE Cache] 已載入 ${cacheData.ides.length} 個 IDE 從檔案快取`);
		console.log(`[IDE Cache] Loaded ${cacheData.ides.length} IDEs from file cache`);

		return {
			ides: cacheData.ides,
			sourceIDEUuid: cacheData.sourceIDEUuid,
		};
	}
	catch (error)
	{
		console.error(`[IDE Cache] 載入失敗 / Load failed:`, error);
		return null;
	}
}

/**
 * 清除檔案快取
 * Clear file cache
 *
 * @param extensionPath - 擴充套件路徑
 * @returns 是否成功
 */
export function clearIDECache(extensionPath: string): boolean
{
	try
	{
		const cachePath = getCacheFilePath(extensionPath);
		if (fs.existsSync(cachePath))
		{
			fs.unlinkSync(cachePath);
			console.log(`[IDE Cache] 已清除檔案快取`);
			console.log(`[IDE Cache] File cache cleared`);
		}
		return true;
	}
	catch (error)
	{
		console.error(`[IDE Cache] 清除失敗 / Clear failed:`, error);
		return false;
	}
}

/**
 * 匯出 IDE 列表快取（用於導出功能）
 * Export IDE list cache (for export feature)
 *
 * @param extensionPath - 擴充套件路徑
 * @returns 快取資料 JSON 字串
 */
export function exportIDECache(extensionPath: string): string | null
{
	const cache = loadIDECache(extensionPath);
	if (!cache)
	{
		return null;
	}

	return JSON.stringify({
		version: '1.0.0',
		exportedAt: new Date().toISOString(),
		ides: cache.ides,
		sourceIDEUuid: cache.sourceIDEUuid,
	}, null, 2);
}

/**
 * 匯入 IDE 列表快取（用於導入功能）
 * Import IDE list cache (for import feature)
 *
 * @param extensionPath - 擴充套件路徑
 * @param jsonData - 快取資料 JSON 字串
 * @returns 是否成功
 */
export function importIDECache(extensionPath: string, jsonData: string): boolean
{
	try
	{
		const data = JSON.parse(jsonData);
		if (!data.ides || !Array.isArray(data.ides))
		{
			throw new Error('Invalid cache data format');
		}

		return saveIDECache(
			extensionPath,
			data.ides,
			data.sourceIDEUuid,
		);
	}
	catch (error)
	{
		console.error(`[IDE Cache] 匯入失敗 / Import failed:`, error);
		return false;
	}
}
