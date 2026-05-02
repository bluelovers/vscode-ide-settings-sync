/**
 * 匯出區塊組件
 * Export section component
 *
 * 渲染單一匯出操作的完整區塊，包含標題、路徑輸入、可選的勾選框與操作按鈕。
 * Renders a complete section for a single export operation, including title, path input, optional checkbox, and action button.
 */

import { PathInput } from './PathInput';
import { CheckboxOption } from './CheckboxOption';
import { ActionBtn } from './ActionBtn';

/** 匯出區塊的 Props 介面 / Props interface for the export section */
interface IExportSectionProps
{
	/** 區塊標題 / Section title */
	title: string;
	/** 路徑輸入框的 HTML id / HTML id of the path input */
	pathId: string;
	/** 路徑輸入框的 placeholder 文字 / Placeholder text for the path input */
	pathPlaceholder: string;
	/** 勾選框的 HTML id（可選）/ HTML id of the checkbox (optional) */
	checkboxId?: string;
	/** 勾選框的標籤文字（可選）/ Label text of the checkbox (optional) */
	checkboxLabel?: string;
	/** 操作按鈕的 onclick 字串屬性 / onclick string attribute for the action button */
	actionOnClick: string;
	/** 操作按鈕的 title 提示文字 / title tooltip text for the action button */
	actionTitle: string;
	/** 操作按鈕的顯示文字 / Display text for the action button */
	actionText: string;
	/** 是否處於處理中狀態 / Whether in processing state */
	isProcessing?: boolean;
}

/**
 * 匯出區塊組件
 * Export section component
 */
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

			{/**
			 * 僅在提供 checkboxId 與 checkboxLabel 時才渲染勾選框
			 * Only render checkbox when both checkboxId and checkboxLabel are provided
			 */}
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
