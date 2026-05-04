/**
 * 匯入結果顯示組件
 * Import result display component
 *
 * 在匯入操作完成後顯示結果摘要，包含成功/失敗狀態、統計數字、錯誤與警告訊息。
 * Displays result summary after import operation completes, including success/failure status, statistics, errors and warnings.
 */

import { IImportResult } from '../../types';

/**
 * 匯入結果顯示的 Props 介面
 * Props interface for the import result display
 *
 * 定義匯入結果組件所需的屬性結構，確保型別安全與可選性處理。
 * Defines the property structure required by the import result display component, ensuring type safety and optional handling.
 */
interface IImportResultDisplayProps
{
	/** 匯入結果物件，未提供時不渲染任何內容 / Import result object; renders nothing when not provided */
	importResult?: IImportResult;
}

/**
 * 匯入結果顯示組件
 * Import result display component
 *
 * @param importResult - 匯入結果物件 / Import result object
 */
export function ImportResultDisplay({ importResult }: IImportResultDisplayProps)
{
	/**
	 * 無匯入結果時不渲染任何內容
	 * Render nothing when no import result is available
	 *
	 * 原因：避免顯示空白或錯誤狀態，符合條件渲染的最佳實踐。
	 * Reason: Avoid displaying blank or error states; follows conditional rendering best practice.
	 */
	if (!importResult)
	{
		return null;
	}

	return (
		<div class="import-result">
			<h4>Import Result</h4>
			<div class={`result-message ${importResult.success ? 'success' : 'error'}`}>
				{importResult.success
					? '✅ Import successful!'
					: `❌ Import failed: ${importResult.errors?.join(', ') || 'Unknown error'}`}
			</div>

			{/**
			 * 有匯入數量時顯示摘要統計
			 * Show summary statistics when there are imported items
			 *
			 * 原因：讓使用者快速了解匯入操作的成果，提升使用體驗。
			 * Reason: Allows users to quickly understand import operation results, improving UX.
			 */}
			{(importResult.importedCustomIDEs > 0 || importResult.importedSelectedSettings > 0) && (
				<div class="result-summary">
					<div class="summary-title">Import Summary:</div>
					<ul class="summary-list">
						{importResult.importedCustomIDEs > 0 && (
							<li>Imported {importResult.importedCustomIDEs} custom IDEs</li>
						)}
						{importResult.importedSelectedSettings > 0 && (
							<li>Imported {importResult.importedSelectedSettings} selected settings</li>
						)}
						{importResult.skippedCustomIDEs > 0 && (
							<li style="color: var(--vscode-warningForeground);">Skipped {importResult.skippedCustomIDEs} custom IDEs</li>
						)}
						{importResult.skippedSelectedSettings > 0 && (
							<li style="color: var(--vscode-warningForeground);">Skipped {importResult.skippedSelectedSettings} selected settings</li>
						)}
					</ul>
				</div>
			)}

			{/**
			 * 有錯誤時顯示錯誤列表
			 * Show error list when there are errors
			 *
			 * 原因：讓使用者清楚知道匯入失敗的具體原因，便於排錯。
			 * Reason: Allows users to clearly understand specific import  failure reasons for troubleshooting.
			 */}
			{importResult.errors && importResult.errors.length > 0 && (
				<div class="result-details">
					<div class="details-title" style="color: var(--vscode-errorForeground);">Errors:</div>
					<ul class="details-list" style="color: var(--vscode-errorForeground);">
						{importResult.errors.map((error: string, index: number) => (
							<li key={index}>{error}</li>
						))}
					</ul>
				</div>
			)}

			{/**
			 * 有警告時顯示警告列表
			 * Show warning list when there are warnings
			 */}
			{importResult.warnings && importResult.warnings.length > 0 && (
				<div class="result-details">
					<div class="details-title" style="color: var(--vscode-warningForeground);">Warnings:</div>
					<ul class="details-list" style="color: var(--vscode-warningForeground);">
						{importResult.warnings.map((warning: string, index: number) => (
							<li key={index}>{warning}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
