/**
 * 設定導覽列組件
 * Settings navigation bar component
 *
 * 渲染分頁切換按鈕列，讓使用者在 Sync、View All、Selected、Export/Import 分頁間切換。
 * Renders the tab switching button bar, allowing users to switch between Sync, View All, Selected, and Export/Import tabs.
 */

/**
 * 設定導覽列組件
 * Settings navigation bar component
 *
 * 使用 onclick 字串屬性呼叫 Webview bundle 中的 switchTab() 函數。
 * Uses onclick string attributes to call the switchTab() function in the Webview bundle.
 */
export function SettingsNav()
{
	return (
		<div className="tabs">
			{/* @ts-ignore */}
			<button className="tab active" onclick="switchTab('sync')">Sync Settings</button>
			{/* @ts-ignore */}
			<button className="tab" onclick="switchTab('values')">View All Settings</button>
			{/* @ts-ignore */}
			<button className="tab" onclick="switchTab('selected')">Selected Settings</button>
			{/* @ts-ignore */}
			<button className="tab" onclick="switchTab('export-import')">Export/Import</button>
		</div>
	);
}
