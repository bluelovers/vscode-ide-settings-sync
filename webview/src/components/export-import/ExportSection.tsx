/**
 * 匯出區塊組件（SSR 組件）
 * Export section component (SSR component)
 */

import { PathInput } from './PathInput';
import { CheckboxOption } from './CheckboxOption';
import { ActionButton } from './ActionButton';

interface IExportSectionProps
{
	/** 區塊標題 / Section title */
	title: string;
	/** 路徑輸入框的唯一識別碼 / Unique identifier for the path input */
	pathId: string;
	/** 路徑輸入框的提示文字 / Placeholder text for the path input */
	pathPlaceholder: string;
	/** 勾選框的唯一識別碼（可選，未提供時不渲染勾選框）/ Unique identifier for checkbox (optional; hides checkbox when not provided) */
	checkboxId?: string;
	/** 勾選框的標籤文字（可選）/ Label text for checkbox (optional) */
	checkboxLabel?: string;
	/** 操作按鈕的 onclick 字串（SSR 用）/ onclick string for the action button (for SSR) */
	actionOnClick: string;
	/** 操作按鈕的懸浮提示文字 / Tooltip text for the action button */
	actionTitle: string;
	/** 操作按鈕內部顯示的文字 / Text displayed inside the action button */
	actionText: string;
	/** 是否顯示處理中狀態（預設為 false）/ Whether to show processing state (defaults to false) */
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
