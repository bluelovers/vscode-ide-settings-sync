export function SyncTab() {
	return (
		<div id="sync" className="tab-content active">
			<div className="section">
				<h2>Search &amp; Sync Settings</h2>
				<div className="search-container">
					<input
						type="text"
						className="search-input"
						id="searchInput"
						placeholder="e.g., editor.fontFamily, editor.fontSize..."
						// @ts-ignore
						onkeyup="searchSettings();saveSearchHistory()"
					/>
					{/* @ts-ignore */}
					<button className="btn" onclick="clearSearch()" title="Clear search field">Clear</button>
				</div>
				<div id="searchResults" className="settings-list"></div>
				<div className="actions">
					{/* @ts-ignore */}
					<button className="btn" onclick="refreshSettings()" title="Reload settings from disk">↻ Refresh Settings</button>
					{/* @ts-ignore */}
					<button className="btn" onclick="saveSearchSelectedSettings()" title="Save checked settings">💾 Save Selected Settings List</button>
					{/* @ts-ignore */}
					<button className="btn btn-sync" onclick="syncSettings()" title="Start syncing selected settings">✓ Sync Selected</button>
					{/* @ts-ignore */}
					<button className="btn btn-delete" onclick="deleteSettings()" title="Delete selected settings">✗ Delete Selected</button>
				</div>
				<div id="message" className="message"></div>
			</div>
		</div>
	);
}
