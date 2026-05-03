/**
 * 匯入區塊組件（SSR 組件）
 * Import section component (SSR component)
 */

import { PathInput } from './PathInput';
import { ActionButton } from './ActionButton';

interface IImportSectionProps
{
	actionOnClick: string;
	actionTitle: string;
	actionText: string;
	isProcessing?: boolean;
}

export function ImportSection({
	actionOnClick,
	actionTitle,
	actionText,
	isProcessing = false,
}: IImportSectionProps)
{
	return (
		<div class="import-section">
			<h3>📥 Import Settings</h3>
			<div class="path-selection">
				<h4>Import File</h4>
				<PathInput
					id="importPath"
					placeholder="Enter file path or leave empty to use file dialog"
					onBrowse="handleBrowseImportPath && handleBrowseImportPath()"
				/>
			</div>
			<div class="actions">
				<ActionButton onClick={actionOnClick} title={actionTitle} processing={isProcessing}>
					{actionText}
				</ActionButton>
			</div>
		</div>
	);
}
