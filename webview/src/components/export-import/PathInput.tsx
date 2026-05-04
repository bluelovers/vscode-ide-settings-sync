/**
 * 路徑輸入框組件（SSR 組件）
 * Path input component (SSR component)
 */

interface IPathInputProps
{
	/** 輸入框的唯一識別碼 / Unique identifier for the input field */
	id: string;
	/** 輸入框的提示文字 / Placeholder text for the input field */
	placeholder: string;
	/** 瀏覽按鈕的 onclick 字串（SSR 用）/ onclick string for browse button (for SSR) */
	onBrowse?: string;
}

/**
 * 路徑輸入框組件
 * Path input component
 *
 * 提供文字輸入框與瀏覽按鈕，用於選擇檔案或目錄路徑。
 * Provides a text input with a browse button for selecting file or directory paths.
 *
 * @param id - 輸入框的唯一識別碼 / Unique identifier for the input field
 * @param placeholder - 輸入框的提示文字 / Placeholder text for the input field
 * @param onBrowse - 瀏覽按鈕的 onclick 字串（SSR 用）/ onclick string for browse button (for SSR)
 */
export function PathInput({ id, placeholder, onBrowse }: IPathInputProps)
{
	/**
	 * 組件結構：輸入框 + 瀏覽按鈕
	 * Component structure: input field + browse button
	 *
	 * 使用 flex 排版讓按鈕緊貼輸入框右側
	 * Uses flex layout to attach button snugly to the right of input field
	 */
	return (
		<div class="path-input-group">
			<input
				type="text"
				id={id}
				class="path-input"
				placeholder={placeholder}
			/>
			{/**
			 * 瀏覽按鈕：開啟檔案選擇對話框
			 * Browse button: opens file selection dialog
			 *
			 * 使用 // @ts-ignore 忽略 SSR 環境下 onclick 型別檢查
			 * Uses // @ts-ignore to skip onclick type check in SSR environment
			 */}
			{/* @ts-ignore */}
			<button
				class="btn btn-small browse-btn"
				// @ts-ignore
				onclick={onBrowse || 'handleBrowsePath && handleBrowsePath()'}
				title="Browse file system"
			>
				📁 Browse
			</button>
		</div>
	);
}
