import { h, Fragment } from 'preact';
import { PathInput } from './PathInput';
import { CheckboxOption } from './CheckboxOption';
import { ActionBtn } from './ActionBtn';

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
					onBrowse="handleBrowseExportPath()"
				/>
			</div>

			{checkboxId && checkboxLabel && (
				<div class="options">
					<CheckboxOption
						id={checkboxId}
						label={checkboxLabel}
					/>
				</div>
			)}

			<div class="actions">
				<ActionBtn
					onClick={actionOnClick}
					title={actionTitle}
					processing={isProcessing}
				>
					{actionText}
				</ActionBtn>
			</div>
		</div>
	);
}
