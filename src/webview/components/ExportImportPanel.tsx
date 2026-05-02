import { h, Fragment } from 'preact';
import { IImportResult } from '../../types';
import { ExportSection } from './export-import/ExportSection';
import { ImportSection } from './export-import/ImportSection';
import { ImportResultDisplay } from './export-import/ImportResultDisplay';

interface IExportImportPanelProps
{
	importResult?: IImportResult;
	isProcessing?: boolean;
}

/**
 * 匯出/匯入面板組件（SSR 版本，保留供 src/ 內部使用）
 * Export/Import panel component (SSR version, kept for internal use within src/)
 *
 * @deprecated 請改用 webview/src/components/ExportImportPanel.tsx
 * @deprecated Use webview/src/components/ExportImportPanel.tsx instead
 */
export function ExportImportPanel({
	importResult,
	isProcessing = false,
}: IExportImportPanelProps)
{
	return (<>
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
