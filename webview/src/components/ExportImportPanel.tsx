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
	/** 匯入結果物件（可選，若有值則顯示結果）/ Import result object (optional, displays result if provided) */
	importResult?: IImportResult;
	/** 是否正在處理中（停用按鈕並顯示載入狀態）/ Whether processing is in progress (disables buttons and shows loading state) */
	isProcessing?: boolean;
}

/**
 * 渲染匯出/匯入面板組件
 * Render Export/Import panel component
 *
 * 包含三種匯出選項（自定義IDE、選取設定、全部設定）與一種匯入選項
 * Includes three export options (custom IDEs, selected settings, all settings) and one import option
 *
 * @param importResult - 匯入結果（可選）/ Import result (optional)
 * @param isProcessing - 是否正在處理中 / Whether processing is in progress
 */
export function ExportImportPanel({
	importResult,
	isProcessing = false,
}: IExportImportPanelProps)
{
	return (<>
		{/** 匯出匯入面板主容器 / Main container for export/import panel */}
		<div class="export-import-section">
			{/** 設定區塊：包含所有匯出與匯入操作 / Settings section: contains all export and import operations */}
			<div class="section">
				<h2>Export / Import Settings</h2>

				{/** 匯出自定義IDE配置 / Export custom IDE configurations */}
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

				{/** 匯出已選取的設定項目 / Export selected settings */}
				<ExportSection
					title="📤 Export Selected Settings"
					pathId="exportSelectedPath"
					pathPlaceholder="Enter custom path or leave empty to use file dialog"
					actionOnClick="handleExportSelectedSettings && handleExportSelectedSettings()"
					actionTitle="Export selected settings"
					actionText="📤 Export Selected Settings"
					isProcessing={isProcessing}
				/>

				{/** 匯出所有設定與IDE配置 / Export all settings and IDE configurations */}
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

				{/** 匯入設定檔案 / Import settings file */}
				<ImportSection
					actionOnClick="handleImport && handleImport()"
					actionTitle="Import settings from file"
					actionText="📥 Import Settings"
					isProcessing={isProcessing}
				/>

				{/** 顯示匯入結果（若有）/ Display import result (if any) */}
				<ImportResultDisplay importResult={importResult} />
			</div>
		</div>
	</>);
}
