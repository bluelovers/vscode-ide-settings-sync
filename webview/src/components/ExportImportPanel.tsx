/**
 * 匯出/匯入面板組件（SSR 組件）
 * Export/Import panel component (SSR component)
 *
 * 事件處理由 window 掛載的函數負責（onclick 字串）。
 * Event handling is done by window-mounted functions (onclick strings).
 * export-import.ts 函數從 DOM input 讀取路徑值（document.getElementById）。
 * export-import.ts functions read path values from DOM inputs (document.getElementById).
 */

import { IImportResult } from '../types';
import { ExportSection } from './export-import/ExportSection';
import { ImportSection } from './export-import/ImportSection';
import { ImportResultDisplay } from './export-import/ImportResultDisplay';

interface IExportImportPanelProps
{
	importResult?: IImportResult;
	isProcessing?: boolean;
}

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
					actionOnClick="handleExportCustomIDEs && handleExportCustomIDEs()"
					actionTitle="Export custom IDE configurations"
					actionText="📤 Export Custom IDEs"
					isProcessing={isProcessing}
				/>

				<ExportSection
					title="📤 Export Selected Settings"
					pathId="exportSelectedPath"
					pathPlaceholder="Enter custom path or leave empty to use file dialog"
					actionOnClick="handleExportSelectedSettings && handleExportSelectedSettings()"
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
					actionOnClick="handleExportAll && handleExportAll()"
					actionTitle="Export all settings and IDE configurations"
					actionText="📤 Export All"
					isProcessing={isProcessing}
				/>

				<ImportSection
					actionOnClick="handleImport && handleImport()"
					actionTitle="Import settings from file"
					actionText="📥 Import Settings"
					isProcessing={isProcessing}
				/>

				<ImportResultDisplay importResult={importResult} />
			</div>
		</div>
	</>);
}
