

import { EnumTabName, EnumWebviewElemId } from '../../types/elem-const';

/**
 * All Settings 分頁組件（SSR 骨架）
 * All Settings tab component (SSR skeleton)
 *
 * Tab 顯示/隱藏由 index.tsx 的 effect() 透過 CSS class 控制。
 * Tab show/hide is controlled by effect() in index.tsx via CSS class.
 */

/**
 * 渲染 All Settings 分頁的內容區塊
 * Render the content section of All Settings tab
 *
 * 使用 SSR 骨架模式：實際設定項目由外部腳本動態填入 settings-list 容器
 * Uses SSR skeleton pattern: actual settings items are dynamically populated
 * into the settings-list container by external scripts
 */
export function AllSettingsTab()
{
	return (
		<div id={EnumTabName.values} className="tab-content">
			<div className="section">
				{/** 分頁標題 / Tab title */}
				<h2>All IDE Settings</h2>

				{/**
				 * 設定項目容器 - 由外部腳本 (settings-panel.ts) 動態填入
				 * Settings items container - dynamically populated by external script (settings-panel.ts)
				 *
				 * 使用空的 div 作為掛載點，避免 SSR 時產生不必要的 DOM 操作
				 * Using empty div as mount point to avoid unnecessary DOM manipulation during SSR
				 */}
				<div id={EnumWebviewElemId.allSettings} className="settings-list"></div>

				<div className="actions">

					{/**
					 * 重新從磁碟載入設定項目
					 * Reload settings from disk
					 *
					 * 當使用者修改了 VS Code 設定檔後，可以透過此按鈕重新整理
					 * Allows user to refresh after modifying VS Code settings files directly
					 */}
					{/* @ts-ignore */}
					<button className="btn" onclick="refreshSettings()" title="Reload settings from disk">↻ Refresh Settings</button>

					{/**
					 * 將當前選取的設定加入 Selected 分頁
					 * Add currently selected settings to Selected tab
					 *
					 * 提供快速將多個設定加入同步清單的方式
					 * Provides a quick way to add multiple settings to the sync list
					 */}
					{/* @ts-ignore */}
					<button className="btn" onclick="addSelectedSettingsListOnAllPanel()" title="Add selected settings">💾 Add Selected Settings</button>

					{/**
					 * 開始同步已選取的設定項目
					 * Start syncing selected settings
					 *
					 * 會將選取的設定同步到所有已設定的 IDE 環境
					 * Syncs selected settings to all configured IDE environments
					 */}
					{/* @ts-ignore */}
					<button className="btn btn-sync" onclick="syncSettings()" title="Start syncing selected settings">✓ Sync Selected</button>

					{/**
					 * 刪除已選取的設定項目
					 * Delete selected settings
					 *
					 * 從設定清單中移除不需要的項目
					 * Removes unwanted items from the settings list
					 */}
					{/* @ts-ignore */}
					<button className="btn btn-delete" onclick="deleteSettings()" title="Delete selected settings">✗ Delete Selected</button>
				</div>
			</div>
		</div>
	);
}
