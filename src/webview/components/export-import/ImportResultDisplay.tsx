import { h, Fragment } from 'preact';
import { IImportResult } from '../../../types';

interface IImportResultDisplayProps {
	importResult?: IImportResult;
}

export function ImportResultDisplay({ importResult }: IImportResultDisplayProps) {
	if (!importResult) {
		return null;
	}

	return (
		<div class="import-result">
			<h4>Import Result</h4>
			<div class={`result-message ${importResult.success ? 'success' : 'error'}`}>
				{importResult.success ? '✅ Import successful!' : `❌ Import failed: ${importResult.errors?.join(', ') || 'Unknown error'}`}
			</div>
			
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
