/**
 * 匯入區塊組件（SSR 組件）
 * Import section component (SSR component)
 */

import { PathInput } from './PathInput';
import { ActionButton } from './ActionButton';

interface IImportSectionProps
{
	/** 操作按鈕的 onclick 字串（SSR 用）/ onclick string for the action button (for SSR) */
	actionOnClick: string;
	/** 按鈕的懸浮提示文字 / Tooltip text for the button */
	actionTitle: string;
	/** 按鈕內部顯示的文字 / Text displayed inside the button */
	actionText: string;
	/** 是否顯示處理中狀態（預設為 false）/ Whether to show processing state (defaults to false) */
	isProcessing?: boolean;
}

/**
 * 匯入區塊組件
 * Import section component
 *
 * 提供匯入設定檔案的路徑選擇與操作按鈕。
 * Provides path selection for importing settings file and action button.
 *
 * @param actionOnClick - 操作按鈕的 onclick 字串（SSR 用）/ onclick string for action button (for SSR)
 * @param actionTitle - 按鈕的懸浮提示文字 / Tooltip text for the button
 * @param actionText - 按鈕內部顯示的文字 / Text displayed inside the button
 * @param isProcessing - 是否顯示處理中狀態（預設為 false）/ Whether to show processing state (defaults to false)
 */
export function ImportSection({
	actionOnClick,
	actionTitle,
	actionText,
	isProcessing = false,
}: IImportSectionProps)
{
	/**
	 * 組件結構：標題 + 路徑選擇區 + 操作按鈕
	 * Component structure: title + path selection + action button
	 */
	return (
		<div class="import-section">
			{/** 區塊標題 / Section title */}
			<h3>📥 Import Settings</h3>

			{/**
			 * 路徑選擇區域：選擇匯入檔案
			 * Path selection area: select import file
			 */}
			<div class="path-selection">
				<h4>Import File</h4>
				<PathInput
					id="importPath"
					placeholder="Enter file path or leave empty to use file dialog"
					onBrowse="handleBrowseImportPath && handleBrowseImportPath()"
				/>
			</div>

			{/**
			 * 操作按鈕區域：觸發匯入動作
			 * Action button area: trigger import action
			 */}
			<div class="actions">
				<ActionButton onClick={actionOnClick} title={actionTitle} processing={isProcessing}>
					{actionText}
				</ActionButton>
			</div>
		</div>
	);
}
