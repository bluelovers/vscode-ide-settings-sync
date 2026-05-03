/**
 * Selected Settings 分頁組件（SSR 骨架）
 * Selected Settings tab component (SSR skeleton)
 *
 * Tab 顯示/隱藏由 index.tsx 的 effect() 透過 CSS class 控制。
 * Tab show/hide is controlled by effect() in index.tsx via CSS class.
 */

import { EnumTabName } from '../../enums';
import { EnumWebviewElemId } from '../../scripts/elem-get';

export function SelectedTab()
{
	return (
		<div id={EnumTabName.selected} className="tab-content">
			<div className="section">
				<h2>Selected Settings List</h2>
				<p style={{ color: 'var(--vscode-descriptionForeground)', marginBottom: '15px', fontSize: '13px' }}>
					👇 All checked settings from both Search &amp; Sync and View All sections
				</p>
				<div id={EnumWebviewElemId.selectedSettingsList} className="settings-list"></div>
				<div className="actions">
					{/* @ts-ignore */}
					<button className="btn" onclick="refreshSettings && refreshSettings()" title="Reload settings from disk">↻ Refresh Settings</button>
					{/* @ts-ignore */}
					<button className="btn" onclick="clearAllSelectedSettings && clearAllSelectedSettings()" title="Remove all saved selections">🗑️ Clear All Selected</button>
					{/* @ts-ignore */}
					<button className="btn btn-sync" onclick="syncSettings && syncSettings()" title="Start syncing selected settings">✓ Sync Selected</button>
					{/* @ts-ignore */}
					<button className="btn btn-delete" onclick="deleteSettings && deleteSettings()" title="Delete selected settings">✗ Delete Selected</button>
				</div>
			</div>
		</div>
	);
}
