/**
 * 匯出/匯入面板組件
 * Export/Import panel component
 *
 * 組合所有匯出與匯入區塊，渲染完整的匯出/匯入設定面板。
 * Composes all export and import sections to render the complete export/import settings panel.
 */

import { IImportResult } from '../types';
import { ExportSection } from './export-import/ExportSection';
import { ImportSection } from './export-import/ImportSection';
import { ImportResultDisplay } from './export-import/ImportResultDisplay';

/** 匯出/匯入面板的 Props 介面 / Props interface for the export/import panel */
interface IExportImportPanelProps
{
	/** 匯入結果物件，有值時顯示匯入結果區塊 / Import result object; shows import result section when provided */
	importResult?: IImportResult;
	/** 是否處於處理中狀態，處理中時禁用所有操作按鈕 / Whether in processing state; disables all action buttons when true */
	isProcessing?: boolean;
}

/**
 * 匯出/匯入面板組件
 * Export/Import panel component
 *
 * @param importResult - 匯入結果 / Import result
 * @param isProcessing - 是否處理中 / Whether processing
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
