import { h, Fragment } from 'preact';

interface IActionBtnProps {
	onClick: string;
	disabled?: boolean;
	children: any;
	title?: string;
	processing?: boolean;
}

export function ActionBtn({ onClick, disabled = false, children, title, processing = false }: IActionBtnProps) {
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
