import { EnumTabName } from '../../enums';
import { EnumWebviewElemId } from '../../scripts/elem-get';

/**
 * All Settings 分頁組件（SSR 骨架）
 * All Settings tab component (SSR skeleton)
 *
 * Tab 顯示/隱藏由 index.tsx 的 effect() 透過 CSS class 控制。
 * Tab show/hide is controlled by effect() in index.tsx via CSS class.
 */

export function AllSettingsTab()
{
	return (
		<div id={EnumTabName.values} className="tab-content">
			<div className="section">
				<h2>All IDE Settings</h2>
				<div id={EnumWebviewElemId.allSettings} className="settings-list"></div>
				<div className="actions">
					{/* @ts-ignore */}
					<button className="btn" onclick="refreshSettings && refreshSettings()" title="Reload settings from disk">↻ Refresh Settings</button>
					{/* @ts-ignore */}
					<button className="btn" onclick="addSelectedSettingsListOnAllPanel && addSelectedSettingsListOnAllPanel()" title="Add selected settings">💾 Add Selected Settings</button>
					{/* @ts-ignore */}
					<button className="btn btn-sync" onclick="syncSettings && syncSettings()" title="Start syncing selected settings">✓ Sync Selected</button>
					{/* @ts-ignore */}
					<button className="btn btn-delete" onclick="deleteSettings && deleteSettings()" title="Delete selected settings">✗ Delete Selected</button>
				</div>
			</div>
		</div>
	);
}
