/**
 * 操作按鈕組件
 * Action button component
 *
 * 用於匯出/匯入面板中的主要操作按鈕，支援處理中（processing）狀態。
 * Used for primary action buttons in the export/import panel, supports processing state.
 */

/** 操作按鈕的 Props 介面 / Props interface for the action button */
interface IActionBtnProps
{
	/** 點擊時執行的 onclick 字串屬性（SSR 用）/ onclick string attribute executed on click (for SSR) */
	onClick: string;
	/** 是否禁用按鈕 / Whether the button is disabled */
	disabled?: boolean;
	/** 按鈕內容 / Button content */
	children: any;
	/** 按鈕的 title 提示文字 / Button title tooltip text */
	title?: string;
	/** 是否處於處理中狀態，處理中時顯示 loading 文字並禁用按鈕 / Whether in processing state; shows loading text and disables button when true */
	processing?: boolean;
}

/**
 * 操作按鈕組件
 * Action button component
 *
 * @param onClick - onclick 字串屬性 / onclick string attribute
 * @param disabled - 是否禁用 / Whether disabled
 * @param children - 按鈕內容 / Button content
 * @param title - 提示文字 / Tooltip text
 * @param processing - 是否處理中 / Whether processing
 */
export function ActionBtn({ onClick, disabled = false, children, title, processing = false }: IActionBtnProps)
{
	return (
		<>
			{/**
			 * onclick 使用小寫字串屬性以相容 SSR 輸出
			 * onclick uses lowercase string attribute for SSR output compatibility
			 */}
			{/* @ts-ignore */}
			<button
				class={`btn action-btn ${processing ? 'processing' : ''}`}
				// @ts-ignore
				onclick={onClick}
				disabled={disabled || processing}
				title={title}
			>
				{processing ? '⏳ Processing...' : children}
			</button>
		</>
	);
}
