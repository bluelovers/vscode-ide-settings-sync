export function ValuesTab() {
	return (
		<div id="values" className="tab-content">
			<div className="section">
				<h2>All IDE Settings</h2>
				<div id="allSettings" className="settings-list"></div>
				<div className="actions">
					{/* @ts-ignore */}
					<button className="btn" onclick="refreshSettings()" title="Reload settings from disk">↻ Refresh Settings</button>
					{/* @ts-ignore */}
					<button className="btn" onclick="saveAllSelectedSettings()" title="Save checked settings">💾 Save Selected Settings</button>
					{/* @ts-ignore */}
					<button className="btn btn-sync" onclick="syncSettings()" title="Start syncing selected settings">✓ Sync Selected</button>
					{/* @ts-ignore */}
					<button className="btn btn-delete" onclick="deleteSettings()" title="Delete selected settings">✗ Delete Selected</button>
				</div>
			</div>
		</div>
	);
}
