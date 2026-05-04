/**
 * 勾選框選項組件（SSR 組件）
 * Checkbox option component (SSR component)
 */

interface ICheckboxOptionProps
{
	/** 勾選框的唯一識別碼 / Unique identifier for the checkbox */
	id: string;
	/** 勾選框旁顯示的標籤文字 / Label text displayed next to the checkbox */
	label: string;
	/** 勾選狀態（預設為 false）/ Checked state (defaults to false) */
	checked?: boolean;
}

/**
 * 勾選框選項組件
 * Checkbox option component
 *
 * 渲染一個包含勾選框與標籤的組件，點擊標籤區域可切換勾選狀態。
 * Renders a checkbox with label; clicking the label area toggles the checkbox state.
 *
 * @param id - 勾選框的唯一識別碼 / Unique identifier for the checkbox
 * @param label - 勾選框旁顯示的標籤文字 / Label text displayed next to the checkbox
 * @param checked - 勾選狀態（預設為 false）/ Checked state (defaults to false)
 */
export function CheckboxOption({ id, label, checked = false }: ICheckboxOptionProps)
{
	/**
	 * 使用 label 包裹 checkbox 與 span，以提供更好的使用者體驗
	 * Wrap checkbox and span inside label for better UX
	 *
	 * 點擊 label 區域時會自動切換 checkbox 狀態，無需精確點擊小方框
	 * Clicking the label area automatically toggles checkbox state without needing precise checkbox click
	 */
	return (
		<label class="checkbox-group">
			<input
				type="checkbox"
				id={id}
				class="checkbox-input"
				checked={checked}
			/>
			<span class="checkbox-label">{label}</span>
		</label>
	);
}
