/**
 * 來源 IDE 指示器組件
 * Source IDE indicator component
 *
 * 顯示當前選取的同步來源 IDE 名稱與 UUID。
 *
 * ─── SSR vs Client-side ───
 *
 * SSR（app.tsx）：`SourceIdeIndicator` 渲染完整結構（含外層 div）。
 * Client-side（index.tsx hydration）：`SourceIdeIndicatorContent` 只渲染內層內容，
 * hydrate 至 `.source-ide-indicator` 容器，不重複外層 div。
 *
 * SSR (app.tsx): `SourceIdeIndicator` renders the full structure (including outer div).
 * Client-side (index.tsx hydration): `SourceIdeIndicatorContent` renders only inner content,
 * hydrated into `.source-ide-indicator` container without duplicating the outer div.
 */

import { EnumCssClassSelector } from 'src/scripts/elem-get';
import { sourceIDEName, sourceIDEUuid } from '../../store';
import { isWebviewBrowser } from '../../utils/webview-browser';

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
 * 來源 IDE 指示器內層內容（Client-side hydration 用）
 * Source IDE indicator inner content (for client-side hydration)
 *
 * 只渲染 `.source-ide-indicator` 容器的子內容，不含外層 div。
 * Renders only the children of `.source-ide-indicator`, without the outer div.
 * hydrate 至 `.source-ide-indicator` 後 Preact 接管，signal 改變時自動重新渲染。
 * After hydrating into `.source-ide-indicator`, Preact takes over and re-renders on signal change.
 */
export function SourceIdeIndicatorContent(props: ISourceIdeIndicatorProps)
{
	/**
	 * 判斷目前是否在瀏覽器環境（hydration 後）
	 * 若是，從 signals 讀取；若否（SSR），從 props 讀取。
	 *
	 * Determine if currently in browser environment (after hydration).
	 * If yes, read from signals; if no (SSR), read from props.
	 */
	const isBrowser = isWebviewBrowser();
	const name = isBrowser ? sourceIDEName.value : (props.sourceIDEName ?? 'Not selected');
	const uuid = isBrowser ? sourceIDEUuid.value : (props.sourceIDEUuid ?? '');

	return (
		<>
			<span className="source-label">Source IDE:</span>
			<span className="source-name">
				<span className="source-name-text">{name || 'Not selected'}</span>
				&nbsp;(<span className="source-uuid">{uuid}</span>)
			</span>
		</>
	);
}

/**
 * 來源 IDE 指示器完整組件（SSR 用）
 * Source IDE indicator full component (for SSR)
 *
 * 渲染完整結構（含外層 div），用於 app.tsx SSR 渲染。
 * Renders the full structure (including outer div), used for SSR in app.tsx.
 */
export function SourceIdeIndicator(props: ISourceIdeIndicatorProps)
{


	return (
		<div className={`section ${EnumCssClassSelector.sourceIdeIndicator}`}>
			<SourceIdeIndicatorContent {...props} />
		</div>
	);
}
