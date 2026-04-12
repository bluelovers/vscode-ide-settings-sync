import { h, Fragment } from 'preact';

interface ICheckboxOptionProps
{
	id: string;
	label: string;
	checked?: boolean;
}

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
