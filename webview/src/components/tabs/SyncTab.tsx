

import { EnumTabName, EnumWebviewElemId } from '../../types/elem-const';

/**
 * Sync 分頁組件（SSR 骨架）
 * Sync tab component (SSR skeleton)
 *
 * 搜尋與同步設定分頁的靜態骨架。
 * Static skeleton for the search and sync settings tab.
 *
 * Tab 顯示/隱藏由 index.tsx 的 effect() 透過 CSS class 控制。
 * Tab show/hide is controlled by effect() in index.tsx via CSS class.
 *
 * 按鈕事件由 window 掛載的函數處理（onclick 字串）。
 * Button events are handled by window-mounted functions (onclick strings).
 */

export function SyncTab()
{
	return (
		<div id={EnumTabName.sync} className="tab-content active">
			<div className="section">
				<h2>Search &amp; Sync Settings</h2>
				<div className="search-container">
					<input
						type="text"
						className="search-input"
						id={EnumWebviewElemId.searchInput}
						placeholder="e.g., editor.fontFamily, editor.fontSize..."
						// @ts-ignore

					/>
					{/* @ts-ignore */}
					<button className="btn" onclick="clearSearch()" title="Clear search field">Clear</button>
				</div>
				<div id={EnumWebviewElemId.searchResults} className="settings-list"></div>
				<div className="actions">
					{/* @ts-ignore */}
					<button className="btn" onclick="refreshSettings()" title="Reload settings from disk">↻ Refresh Settings</button>
					{/* @ts-ignore */}
					<button className="btn" onclick="addSelectedSettingsListOnSearchPanel()" title="Add selected settings">💾 Add Selected Settings</button>
					{/* @ts-ignore */}
					<button className="btn btn-sync" onclick="syncSettings()" title="Start syncing selected settings">✓ Sync Selected</button>
					{/* @ts-ignore */}
					<button className="btn btn-delete" onclick="deleteSettings()" title="Delete selected settings">✗ Delete Selected</button>
				</div>
				<div id={EnumWebviewElemId.message} className="message"></div>
			</div>
		</div>
	);
}
