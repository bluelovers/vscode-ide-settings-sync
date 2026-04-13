/**
 * 測試根目錄路徑常數定義
 * Test root directory path constants definition
 *
 * 此模組定義了測試環境中使用的所有路徑常數
 * This module defines all path constants used in the test environment
 */
import { join } from "path";

/**
 * 專案根目錄路徑
 * Project root directory path
 */
export const __ROOT = join(__dirname, '..');

/**
 * 測試目錄路徑
 * Test directory path
 */
export const __ROOT_TEST = join(__ROOT, 'test');

/**
 * 測試 fixtures 目錄路徑
 * Test fixtures directory path
 */
export const __ROOT_TEST_FIXTURES = join(__ROOT_TEST, 'fixtures');

/**
 * 測試檔案快照目錄路徑
 * Test file snapshots directory path
 */
export const __ROOT_TEST_SNAPSHOTS_FILE = join(__ROOT_TEST, '__file_snapshots__');

/**
 * 測試臨時目錄路徑
 * Test temporary directory path
 */
export const __ROOT_TEST_TEMP = join(__ROOT_TEST, 'temp');

/**
 * 判斷是否為 Windows 平台
 * Determine if running on Windows platform
 */
export const isWin = process.platform === "win32";
