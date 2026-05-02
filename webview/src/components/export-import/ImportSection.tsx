/**
 * 匯入區塊組件
 * Import section component
 *
 * 渲染匯入操作的完整區塊，包含標題、路徑輸入與操作按鈕。
 * Renders a complete section for the import operation, including title, path input, and action button.
 */

import { PathInput } from './PathInput';
import { ActionButton } from './ActionButton';

/** 匯入區塊的 Props 介面 / Props interface for the import section */
interface IImportSectionProps
{
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
 * 匯入區塊組件
 * Import section component
 */
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
					onBrowse="handleBrowseImportPath()"
				/>
			</div>

			<div class="actions">
				<ActionButton
					onClick={actionOnClick}
					title={actionTitle}
					processing={isProcessing}
				>
					{actionText}
				</ActionButton>
			</div>
		</div>
	);
}
