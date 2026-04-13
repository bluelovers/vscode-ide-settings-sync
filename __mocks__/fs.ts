/**
 * fs 模組手動模擬
 * fs module manual mock
 *
 * 參考：https://jestjs.io/docs/manual-mocks
 *
 * 使用工廠函數模式，讓每個測試可以配置 mock 行為
 * Use factory function pattern so each test can configure mock behavior
 */

// 用於存儲mock配置的類別
// Class to store mock configuration
class MockFsConfig
{
	// 記錄哪些路徑存在
	// Track which paths exist
	existingPaths: Set<string> = new Set();
	// 記錄哪些路徑不存在
	// Track which paths don't exist
	nonExistingPaths: Set<string> = new Set();
	// 檔案內容映射
	// File content mapping
	fileContents: Map<string, string> = new Map();
	// 是否記錄所有調用
	// Whether to log all calls
	logCalls: boolean = false;
}

// 全域配置實例
// Global configuration instance
const mockConfig = new MockFsConfig();

/**
 * 設定哪些路徑存在
 * Set which paths exist
 *
 * @param paths - 路徑陣列 / Array of paths
 */
export function __mockFsSetExistingPaths(paths: string[]): void
{
	mockConfig.existingPaths ??= new Set(paths);

	paths.forEach(path => mockConfig.existingPaths.add(path));
}

/**
 * 設定哪些路徑不存在
 * Set which paths don't exist
 *
 * @param paths - 路徑陣列 / Array of paths
 */
export function __mockFsSetNonExistingPaths(paths: string[]): void
{
	mockConfig.nonExistingPaths = new Set(paths);
}

/**
 * 設定檔案內容
 * Set file contents
 *
 * @param filePath - 檔案路徑 / File path
 * @param content - 檔案內容 / File content
 */
export function __mockFsSetFileContent(filePath: string, content: string): void
{
	mockConfig.fileContents.set(filePath, content);
}

/**
 * 重置所有 mock 配置
 * Reset all mock configuration
 */
export function __mockFsReset(): void
{
	mockConfig.existingPaths.clear();
	mockConfig.nonExistingPaths.clear();
	mockConfig.fileContents.clear();
}

/**
 * 啟用/停用調用日誌
 * Enable/disable call logging
 *
 * @param enabled - 是否啟用 / Whether to enable
 */
export function __mockFsSetLogEnabled(enabled: boolean): void
{
	mockConfig.logCalls = enabled;
}

// 實現 existsSync mock
// Implement existsSync mock
export function existsSync(path: string): boolean
{
	if (mockConfig.logCalls)
	{
		console.log('[mock fs] existsSync called with:', path);
	}

	// 先檢查明確設定不存在的路徑
	// First check explicitly set non-existing paths
	if (mockConfig.nonExistingPaths.has(path))
	{
		return false;
	}

	// 檢查明確設定存在的路徑
	// Check explicitly set existing paths
	if (mockConfig.existingPaths.has(path))
	{
		return true;
	}

	// 預設回傳 false（模擬檔案不存在）
	// Default to false (simulate file doesn't exist)
	return false;
}

// 實現 readFileSync mock
// Implement readFileSync mock
export function readFileSync(path: string, options?: { encoding?: string; flag?: string }): string
{
	if (mockConfig.logCalls)
	{
		console.log('[mock fs] readFileSync called with:', path);
	}

	const content = mockConfig.fileContents.get(path);
	if (content !== undefined)
	{
		return content;
	}

	// 如果沒有設定內容，拋出錯誤
	// If no content is set, throw error
	throw new Error(`ENOENT: no such file or directory, open '${path}'`);
}

// 實現 writeFileSync mock (可選)
// Implement writeFileSync mock (optional)
export function writeFileSync(path: string, data: string | Buffer): void
{
	if (mockConfig.logCalls)
	{
		console.log('[mock fs] writeFileSync called with:', path);
	}

	// 將寫入的資料存儲起來
	// Store the written data
	mockConfig.fileContents.set(path, data.toString());
}

// 實現 mkdirSync mock (可選)
// Implement mkdirSync mock (optional)
export function mkdirSync(path: string): void
{
	if (mockConfig.logCalls)
	{
		console.log('[mock fs] mkdirSync called with:', path);
	}

	// 將路徑標記為存在
	// Mark path as existing
	mockConfig.existingPaths.add(path);
}

// 實現其他常用的 fs 函數（返回預設值）
// Implement other commonly used fs functions (return default values)
export function statSync(_path: string): { isDirectory: () => boolean; isFile: () => boolean }
{
	return {
		isDirectory: () => false,
		isFile: () => false,
	};
}

export function readdirSync(_path: string): string[]
{
	return [];
}
