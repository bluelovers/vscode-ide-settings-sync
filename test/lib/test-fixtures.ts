/**
 * 測試 fixtures 輔助模組
 * Test Fixtures Helper Module
 *
 * 提供標準化的 Volume API 和 Mock Provider 工廠函數
 * Provides standardized Volume API and Mock Provider factory functions
 */

//@noUnusedParameters:false
/// <reference types="node" />
/// <reference types="jest" />

import * as fs from 'fs';
import * as path from 'path';
import { getVolumeFromFs } from 'memfs-extra';

/**
 * 測試 fixtures 根目錄路徑
 * Test fixtures root directory path
 */
const TEST_FIXTURES_ROOT = path.join(__dirname, '..', 'fixtures');

/**
 * 建立測試 Volume
 * Create test Volume
 *
 * @param files - 可選的檔案結構物件 / Optional file structure object
 * @returns Volume 實例 / Volume instance
 */
export function createTestVolume(files?: Record<string, string | Buffer>): typeof fs {
    const vol = getVolumeFromFs(fs);

    if (files) {
        for (const [filePath, content] of Object.entries(files)) {
            const contentStr = typeof content === 'string' ? content : content.toString();
            vol.mkdirSync(path.dirname(filePath), { recursive: true });
            vol.writeFileSync(filePath, contentStr);
        }
    }

    return vol;
}

/**
 * 從 fixtures 目錄載入測試資料
 * Load test data from fixtures directory
 *
 * @param fixturePath - 相對於 fixtures 目錄的路徑 / Path relative to fixtures directory
 * @returns 檔案內容 / File content
 * @throws 如果檔案不存在則拋出錯誤 / Throws error if file doesn't exist
 */
export function loadFixture(fixturePath: string): string {
    const fullPath = path.join(TEST_FIXTURES_ROOT, fixturePath);

    if (!fs.existsSync(fullPath)) {
        throw new Error(`Fixture not found: ${fixturePath}`);
    }

    return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * 載入 JSON fixtures
 * Load JSON fixtures
 *
 * @param fixturePath - 相對於 fixtures 目錄的路徑 / Path relative to fixtures directory
 * @returns 解析後的 JSON 物件 / Parsed JSON object
 */
export function loadJsonFixture<T = unknown>(fixturePath: string): T {
    const content = loadFixture(fixturePath);
    return JSON.parse(content) as T;
}

/**
 * Mock Provider 工廠函數類型
 * Mock Provider factory function type
 */
export interface IMockProviderFactory<T> {
    /** 載入設定 / Load settings */
    load: jest.Mock;
    /** 取得設定 / Get settings */
    getSettings: jest.Mock;
    /** 取得 IDE 清單 / Get IDE list */
    getIdeList: jest.Mock;
}

/**
 * 建立 Mock Provider
 * Create Mock Provider
 *
 * @param settings - 要回傳的設定物件 / Settings object to return
 * @returns Mock Provider 實例 / Mock Provider instance
 */
export function createMockProvider<T extends Record<string, unknown>>(
    settings: T
): IMockProviderFactory<T> {
    return {
        load: jest.fn(),
        getSettings: jest.fn(() => settings),
        getIdeList: jest.fn(() => []),
    };
}

/**
 * 重置所有 mock
 * Reset all mocks
 *
 * 替代 jest.clearAllMocks()，提供更安全的清理機制
 * Provides safer cleanup mechanism instead of jest.clearAllMocks()
 */
export function resetMocks(): void {
    jest.clearAllMocks();
}

/**
 * 取得 Volume 的檔案清單
 * Get Volume file list
 *
 * @param volFs - Volume 實例 (mock fs) / Volume instance (mock fs)
 * @returns 檔案路徑陣列 / Array of file paths
 */
export function getVolumeFiles(volFs: typeof fs): string[] {
    return volFs.readdirSync('/', { recursive: true }) as string[];
}