/**
 * 格式化路徑顯示，將完整路徑縮短為最後 3 個部分並在前方添加 "..."
 * Format path display by shortening the full path to the last 3 segments with "..." prefix
 *
 * @param fullPath - 完整檔案路徑 / Full file path
 * @returns 格式化後的縮短路徑 / Shortened formatted path
 */
export function formatPath(fullPath: string): string
{
	const parts = fullPath.replace(/\\/g, '/').split('/');
	if (parts.length > 3)
	{
		return '...' + parts.slice(-3).join('/');
	}
	return fullPath;
}
