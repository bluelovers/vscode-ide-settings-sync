export function SelectedTab() {
	return (
		<div id="selected" className="tab-content">
			<div className="section">
				<h2>Selected Settings List</h2>
				<p style={{ color: 'var(--vscode-descriptionForeground)', marginBottom: '15px', fontSize: '13px' }}>
					👇 All checked settings from both Search &amp; Sync and View All sections
				</p>
				<div id="selectedSettingsList" className="settings-list"></div>
				<div className="actions">
					{/* @ts-ignore */}
					<button className="btn" onclick="refreshSettings()" title="Reload settings from disk">↻ Refresh Settings</button>
					{/* @ts-ignore */}
					<button className="btn" onclick="clearAllSelectedSettings()" title="Remove all saved selections">🗑️ Clear All Selected</button>
					{/* @ts-ignore */}
					<button className="btn btn-sync" onclick="syncSettings()" title="Start syncing selected settings">✓ Sync Selected</button>
					{/* @ts-ignore */}
					<button className="btn btn-delete" onclick="deleteSettings()" title="Delete selected settings">✗ Delete Selected</button>
				</div>
			</div>
		</div>
	);
}
