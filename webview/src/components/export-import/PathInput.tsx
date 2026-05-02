/**
 * 路徑輸入框組件
 * Path input component
 *
 * 包含文字輸入框與瀏覽按鈕的組合，用於選取檔案或資料夾路徑。
 * Combines a text input and a browse button for selecting file or folder paths.
 */

/** 路徑輸入框的 Props 介面 / Props interface for the path input */
interface IPathInputProps
{
	/** 輸入框的 HTML id / HTML id of the input */
	id: string;
	/** 輸入框的 placeholder 文字 / Placeholder text for the input */
	placeholder: string;
	/** 瀏覽按鈕的 onclick 字串屬性，預設為 handleBrowsePath() / onclick string attribute for the browse button, defaults to handleBrowsePath() */
	onBrowse?: string;
}

/**
 * 路徑輸入框組件
 * Path input component
 *
 * @param id - 輸入框 id / Input id
 * @param placeholder - placeholder 文字 / Placeholder text
 * @param onBrowse - 瀏覽按鈕的 onclick 字串 / Browse button onclick string
 */
export function PathInput({ id, placeholder, onBrowse }: IPathInputProps)
{
	return (
		<div class="path-input-group">
			<input
				type="text"
				id={id}
				class="path-input"
				placeholder={placeholder}
			/>
			{/**
			 * onclick 使用小寫字串屬性以相容 SSR 輸出
			 * onclick uses lowercase string attribute for SSR output compatibility
			 */}
			{/* @ts-ignore */}
			<button
				class="btn btn-small browse-btn"
				// @ts-ignore
				onclick={onBrowse || "handleBrowsePath()"}
				title="Browse file system"
			>
				📁 Browse
			</button>
		</div>
	);
}
