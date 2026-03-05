import { h, Fragment } from 'preact';
import { IImportResult } from '../../types';
import { ExportSection } from './export-import/ExportSection';
import { ImportSection } from './export-import/ImportSection';
import { ImportResultDisplay } from './export-import/ImportResultDisplay';

interface IExportImportPanelProps {
	importResult?: IImportResult;
	isProcessing?: boolean;
}

export function ExportImportPanel({
	importResult,
	isProcessing = false
}: IExportImportPanelProps) {
	return (<>
		<ExportImportScript />
		<div class="export-import-section">
			<div class="section">
				<h2>Export / Import Settings</h2>
				
				<ExportSection 
					title="📤 Export Custom IDEs"
					pathId="exportCustomPath"
					pathPlaceholder="Enter custom path or leave empty to use file dialog"
					checkboxId="exportIncludeKnownIDEs"
					checkboxLabel="Include known IDEs in export"
					actionOnClick="handleExportCustomIDEs()"
					actionTitle="Export custom IDE configurations"
					actionText="📤 Export Custom IDEs"
					isProcessing={isProcessing}
				/>

				<ExportSection 
					title="📤 Export Selected Settings"
					pathId="exportSelectedPath"
					pathPlaceholder="Enter custom path or leave empty to use file dialog"
					actionOnClick="handleExportSelectedSettings()"
					actionTitle="Export selected settings"
					actionText="📤 Export Selected Settings"
					isProcessing={isProcessing}
				/>

				<ExportSection 
					title="📤 Export All Settings"
					pathId="exportAllPath"
					pathPlaceholder="Enter custom path or leave empty to use file dialog"
					checkboxId="exportAllIncludeKnownIDEs"
					checkboxLabel="Include known IDEs in export"
					actionOnClick="handleExportAll()"
					actionTitle="Export all settings and IDE configurations"
					actionText="📤 Export All"
					isProcessing={isProcessing}
				/>

				<ImportSection 
					actionOnClick="handleImport()"
					actionTitle="Import settings from file"
					actionText="📥 Import Settings"
					isProcessing={isProcessing}
				/>

				<ImportResultDisplay importResult={importResult} />
			</div>
		</div>
	</>);
}

export function ExportImportScript()
{
	const js = `
		// Handle path selection responses
		window.addEventListener('message', event => {
			const message = event.data;
			
			switch (message.command) {
				case 'exportPathSelected':
					// Fill all export path inputs with the selected path
					document.getElementById('exportCustomPath').value = message.path;
					document.getElementById('exportSelectedPath').value = message.path;
					document.getElementById('exportAllPath').value = message.path;
					break;
					
				case 'importPathSelected':
					// Fill import path input with the selected path
					document.getElementById('importPath').value = message.path;
					break;
					
				case 'exportComplete':
					// Handle export completion
					if (message.success) {
						console.log('Export completed successfully');
					} else {
						console.error('Export failed:', message.error);
					}
					break;
					
				case 'importComplete':
					// Handle import completion
					if (message.success) {
						console.log('Import completed successfully');
					} else {
						console.error('Import failed:', message.error);
					}
					break;
			}
		});

		function handleExportCustomIDEs()
		{
			const customPath = document.getElementById('exportCustomPath').value;
			const includeKnownIDEs = document.getElementById('exportIncludeKnownIDEs').checked;
			
			vscode.postMessage({ 
				command: 'exportCustomIDEs', 
				includeKnownIDEs: includeKnownIDEs,
				customPath: customPath || undefined
			});
		}

		function handleExportSelectedSettings()
		{
			const customPath = document.getElementById('exportSelectedPath').value;
			
			vscode.postMessage({ 
				command: 'exportSelectedSettings',
				customPath: customPath || undefined
			});
		}

		function handleExportAll()
		{
			const customPath = document.getElementById('exportAllPath').value;
			const includeKnownIDEs = document.getElementById('exportAllIncludeKnownIDEs').checked;
			
			vscode.postMessage({ 
				command: 'exportAll', 
				includeKnownIDEs: includeKnownIDEs,
				customPath: customPath || undefined
			});
		}

		function handleImport()
		{
			const customPath = document.getElementById('importPath').value;
			
			vscode.postMessage({ 
				command: 'import',
				customPath: customPath || undefined
			});
		}

		function handleBrowseExportPath()
		{
			vscode.postMessage({ command: 'browseExportPath' });
		}

		function handleBrowseImportPath()
		{
			vscode.postMessage({ command: 'browseImportPath' });
		}
	`;

	return (<script dangerouslySetInnerHTML={{ __html: js }} />)
}
