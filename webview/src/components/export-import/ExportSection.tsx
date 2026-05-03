/**
 * 匯出區塊組件（SSR 組件）
 * Export section component (SSR component)
 */

import { PathInput } from './PathInput';
import { CheckboxOption } from './CheckboxOption';
import { ActionButton } from './ActionButton';

interface IExportSectionProps
{
	title: string;
	pathId: string;
	pathPlaceholder: string;
	checkboxId?: string;
	checkboxLabel?: string;
	actionOnClick: string;
	actionTitle: string;
	actionText: string;
	isProcessing?: boolean;
}

export function ExportSection({
	title,
	pathId,
	pathPlaceholder,
	checkboxId,
	checkboxLabel,
	actionOnClick,
	actionTitle,
	actionText,
	isProcessing = false,
}: IExportSectionProps)
{
	return (
		<div class="export-section">
			<h3>{title}</h3>
			<div class="path-selection">
				<h4>Export Path</h4>
				<PathInput
					id={pathId}
					placeholder={pathPlaceholder}
					onBrowse="handleBrowseExportPath && handleBrowseExportPath()"
				/>
			</div>
			{checkboxId && checkboxLabel && (
				<div class="options">
					<CheckboxOption id={checkboxId} label={checkboxLabel} />
				</div>
			)}
			<div class="actions">
				<ActionButton onClick={actionOnClick} title={actionTitle} processing={isProcessing}>
					{actionText}
				</ActionButton>
			</div>
		</div>
	);
}
