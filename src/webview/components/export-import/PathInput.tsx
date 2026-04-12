import { h, Fragment } from 'preact';

interface IPathInputProps
{
	id: string;
	placeholder: string;
	onBrowse?: string;
}

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
