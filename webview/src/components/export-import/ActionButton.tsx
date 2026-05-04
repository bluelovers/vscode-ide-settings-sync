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
	/** 按鈕是否停用（預設為 false）/ Whether the button is disabled (defaults to false) */
	disabled?: boolean;
	/** 按鈕內部子元素（文字或圖標）/ Child elements inside the button (text or icons) */
	children: any;
	/** 按鈕的懸浮提示文字 / Tooltip text for the button */
	title?: string;
	/** 是否顯示處理中狀態（預設為 false）/ Whether to show processing state (defaults to false) */
	processing?: boolean;
}

export function ActionButton({ onClick, disabled = false, children, title, processing = false }: IActionBtnProps)
{
	/**
	 * 使用 Fragment（<>）包裹子元素，避免額外的 DOM 節點渲染
	 * Use Fragment (<>) to wrap child elements, avoiding extra DOM node rendering
	 */
	return (
		<>
			{/**
			 * 忽略 SSR 環境下按鈕組件的 TypeScript 檢查
			 * Ignore TypeScript check for button component in SSR environment
			 *
			 * 因為 SSR 環境下組件屬性為字串，需跳過型別檢查
			 * Since component attributes are strings in SSR, skip type check
			 */}
			{/* @ts-ignore */}
			<button
				class={`btn action-btn ${processing ? 'processing' : ''}`}
				/**
				 * 忽略 onclick 的型別檢查，因為 SSR 環境下 onclick 接收字串而非函式
				 * Ignore onclick type check since it expects string in SSR environment
				 */
				// @ts-ignore
				onclick={onClick}
				disabled={disabled || processing}
				title={title}
			>
				{/**
				 * 處理中狀態顯示載入提示，否則顯示按鈕內容
				 * Show loading prompt when processing, otherwise show button content
				 */}
				{processing ? '⏳ Processing...' : children}
			</button>
		</>
	);
}
