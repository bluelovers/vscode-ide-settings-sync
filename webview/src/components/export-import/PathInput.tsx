/**
 * 路徑輸入框組件（SSR 組件）
 * Path input component (SSR component)
 */

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
				onclick={onBrowse || 'handleBrowsePath && handleBrowsePath()'}
				title="Browse file system"
			>
				📁 Browse
			</button>
		</div>
	);
}
