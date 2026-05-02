/**
 * 來源 IDE 指示器組件
 * Source IDE indicator component
 *
 * 顯示當前選取的同步來源 IDE 名稱與 UUID。
 *
 * ─── SSR vs Client-side ───
 *
 * 此組件同時用於 SSR（app.tsx）與 client-side hydration（index.tsx）。
 *
 * SSR 模式（app.tsx）：Preact SSR 在 Node.js 環境執行，
 * 此時 window 不存在，signals 無法使用，因此接收靜態 props 產生初始 HTML。
 *
 * Client-side 模式（hydration 後）：Preact 接管 DOM，
 * 組件直接讀取 sourceIDEUuid / sourceIDEName signals，
 * signal 改變時 Preact 自動重新渲染，props 不再使用。
 *
 * This component is used for both SSR (app.tsx) and client-side hydration (index.tsx).
 *
 * SSR mode (app.tsx): Preact SSR runs in Node.js where window doesn't exist and signals
 * can't be used, so it receives static props to generate the initial HTML.
 *
 * Client-side mode (after hydration): Preact takes over the DOM; the component reads
 * sourceIDEUuid / sourceIDEName signals directly. Preact re-renders automatically when
 * signals change — props are no longer used.
 */

import { sourceIDEName, sourceIDEUuid } from '../../store';

/**
 * 來源 IDE 指示器組件 Props
 * Source IDE indicator component props
 *
 * SSR 時由 app.tsx 傳入靜態初始值，用於產生首次 HTML。
 * hydration 後 Preact 接管，props 被忽略，改由 signals 驅動。
 *
 * Static initial values passed from app.tsx during SSR to generate the first HTML.
 * After hydration Preact takes over and props are ignored — signals drive the UI.
 */
export interface ISourceIdeIndicatorProps
{
	/** 來源 IDE 顯示名稱（SSR 初始值）/ Source IDE display name (SSR initial value) */
	sourceIDEName?: string;
	/** 來源 IDE UUID（SSR 初始值）/ Source IDE UUID (SSR initial value) */
	sourceIDEUuid?: string;
}

/**
 * 來源 IDE 指示器組件
 * Source IDE indicator component
 *
 * SSR 時讀 props（window 不存在，signals 不可用）。
 * hydration 後讀 signals（Preact 自動追蹤依賴，signal 改變時自動重新渲染）。
 *
 * During SSR reads props (window doesn't exist, signals unavailable).
 * After hydration reads signals (Preact auto-tracks dependencies, re-renders on signal change).
 */
export function SourceIdeIndicator(props: ISourceIdeIndicatorProps)
{
	/**
	 * 判斷目前是否在瀏覽器環境（hydration 後）
	 * 若是，從 signals 讀取；若否（SSR），從 props 讀取。
	 *
	 * Determine if currently in browser environment (after hydration).
	 * If yes, read from signals; if no (SSR), read from props.
	 */
	const isBrowser = typeof window !== 'undefined';
	const name = isBrowser ? sourceIDEName.value : (props.sourceIDEName ?? 'Not selected');
	const uuid = isBrowser ? sourceIDEUuid.value : (props.sourceIDEUuid ?? '');

	return (
		<div className="section source-ide-indicator">
			<span className="source-label">Source IDE:</span>
			<span className="source-name">
				<span className="source-name-text">{name || 'Not selected'}</span>
				&nbsp;(<span className="source-uuid">{uuid}</span>)
			</span>
		</div>
	);
}
