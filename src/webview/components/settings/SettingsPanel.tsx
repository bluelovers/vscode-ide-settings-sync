import { h, Fragment } from 'preact';

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
