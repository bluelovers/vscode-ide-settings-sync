/**
 * 操作按鈕組件（SSR 組件）
 * Action button component (SSR component)
 *
 * 用於匯出/匯入面板中的主要操作按鈕，支援處理中（processing）狀態。
 * Used for primary action buttons in the export/import panel, supports processing state.
 */

interface IActionBtnProps
{
	/** onclick 字串屬性（SSR 用）/ onclick string attribute (for SSR) */
	onClick: string;
	disabled?: boolean;
	children: any;
	title?: string;
	processing?: boolean;
}

export function ActionButton({ onClick, disabled = false, children, title, processing = false }: IActionBtnProps)
{
	return (
		<>
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
