/**
 * Selected Settings 分頁組件（SSR 骨架）
 * Selected Settings tab component (SSR skeleton)
 *
 * Tab 顯示/隱藏由 index.tsx 的 effect() 透過 CSS class 控制。
 * Tab show/hide is controlled by effect() in index.tsx via CSS class.
 */

import { EnumTabName, EnumWebviewElemId } from '../../types/elem-const';

/**
 * 渲染 Selected Settings 分頁的內容區塊
 * Render the content section of Selected Settings tab
 *
 * 顯示使用者已選取的設定清單，提供同步與管理功能
 * Displays user's selected settings list with sync and management capabilities
 */
export function SelectedTab()
{
	return (
		<div id={EnumTabName.selected} className="tab-content">
			<div className="section">
				{/** 分頁標題 / Tab title */}
				<h2>Selected Settings List</h2>

				{/** 說明文字 - 提示使用者此列表的來源 / Description - hints about the source of this list */}
				<p style={{ color: 'var(--vscode-descriptionForeground)', marginBottom: '15px', fontSize: '13px' }}>
					👇 All checked settings from both Search &amp; Sync and View All sections
				</p>

				{/**
				 * 已選取設定容器 - 由外部腳本動態填入
				 * Selected settings container - dynamically populated by external script
				 *
				 * 顯示使用者從 Search 和 All Settings 分頁中選取的項目
				 * Shows items user selected from Search and All Settings tabs
				 */}
				<div id={EnumWebviewElemId.selectedSettingsList} className="settings-list"></div>

				<div className="actions">

					{/**
					 * 重新從磁碟載入設定項目
					 * Reload settings from disk
					 *
					 * 當使用者直接修改 VS Code 設定檔後，可以透過此按鈕重新整理
					 * Allows user to refresh after modifying VS Code settings files directly
					 */}
					{/* @ts-ignore */}
					<button className="btn" onclick="refreshSettings()" title="Reload settings from disk">↻ Refresh Settings</button>

					{/**
					 * 清空所有已選取的設定
					 * Clear all selected settings
					 *
					 * 提供快速清除整個選取清單的方式，避免逐項刪除
					 * Provides a quick way to clear entire selection list instead of deleting one by one
					 */}
					{/* @ts-ignore */}
					<button className="btn" onclick="clearAllSelectedSettings()" title="Remove all saved selections">🗑️ Clear All Selected</button>

					{/**
					 * 開始同步已選取的設定項目到所有 IDE
					 * Start syncing selected settings to all IDEs
					 *
					 * 核心功能：將選取的設定同步到所有已設定的 IDE 環境
					 * Core feature: syncs selected settings to all configured IDE environments
					 */}
					{/* @ts-ignore */}
					<button className="btn btn-sync" onclick="syncSettings()" title="Start syncing selected settings">✓ Sync Selected</button>

					{/**
					 * 刪除已選取的設定項目
					 * Delete selected settings
					 *
					 * 從選取清單中移除不需要的項目
					 * Removes unwanted items from the selection list
					 */}
					{/* @ts-ignore */}
					<button className="btn btn-delete" onclick="deleteSettings()" title="Delete selected settings">✗ Delete Selected</button>
				</div>
			</div>
		</div>
	);
}
