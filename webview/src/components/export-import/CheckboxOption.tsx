/**
 * 勾選框選項組件
 * Checkbox option component
 *
 * 用於匯出/匯入面板中的選項勾選框，帶有標籤文字。
 * Used for option checkboxes in the export/import panel, with label text.
 */

/** 勾選框選項的 Props 介面 / Props interface for the checkbox option */
interface ICheckboxOptionProps
{
	/** 勾選框的 HTML id / HTML id of the checkbox */
	id: string;
	/** 勾選框旁的標籤文字 / Label text next to the checkbox */
	label: string;
	/** 是否預設勾選 / Whether checked by default */
	checked?: boolean;
}

/**
 * 勾選框選項組件
 * Checkbox option component
 *
 * @param id - 勾選框 id / Checkbox id
 * @param label - 標籤文字 / Label text
 * @param checked - 是否勾選 / Whether checked
 */
export function CheckboxOption({ id, label, checked = false }: ICheckboxOptionProps)
{
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
