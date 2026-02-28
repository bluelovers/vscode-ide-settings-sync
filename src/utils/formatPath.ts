/**
 * 格式化路徑顯示
 * 將完整路徑縮短為最後 3 個部分，前綴 "..."
 *
 * @param fullPath - 完整檔案路徑
 * @returns 格式化後的縮短路徑
 */
export function formatPath(fullPath: string): string {
	const parts = fullPath.replace(/\\/g, '/').split('/');
	if (parts.length > 3) {
		return '...' + parts.slice(-3).join('/');
	}
	return fullPath;
}
