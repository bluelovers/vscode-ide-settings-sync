/**
 * Webview 前端共用響應式狀態 store
 * Webview frontend shared reactive state store
 *
 * 使用 `@preact/signals` 的 signal 作為模組層的共享狀態，
 * 不需要 Preact hydration，純 JS 模組即可使用。
 * Uses `@preact/signals` signals as module-level shared state,
 * no Preact hydration required — works as plain JS modules.
 *
 * 此檔案不得 import 任何 VS Code 或 Node.js 相依模組。
 * This file must NOT import any VS Code or Node.js dependent modules.
 */

import { signal, computed } from '@preact/signals';
import { IWebviewInitialState, IIDEInfoWebview } from './types';

/** ─── 來源 IDE 狀態 / Source IDE state ─── */

/**
 * 當前選取的來源 IDE UUID
 * UUID of the currently selected source IDE
 *
 * 由 `handleSourceIDEChange` 在使用者切換 radio 時更新，
 * effect() 訂閱此 signal 以驅動所有相關 UI 更新。
 * Updated by `handleSourceIDEChange` when the user switches the radio button;
 * effect() subscribes to this signal to drive all related UI updates.
 */
export const sourceIDEUuid = signal<string>('');

/**
 * 當前選取的來源 IDE 顯示名稱（computed）
 * Display name of the currently selected source IDE (computed)
 *
 * 由 sourceIDEUuid 自動推導：從 __INITIAL_STATE__.ideList 中查找對應的 IDE 名稱。
 * 不需要手動維護，uuid 改變時自動重新計算。
 *
 * Automatically derived from sourceIDEUuid: looks up the matching IDE name
 * in __INITIAL_STATE__.ideList. No manual maintenance needed — recomputes
 * automatically whenever sourceIDEUuid changes.
 */
export const sourceIDEName = computed<string>(() =>
{
	const uuid = sourceIDEUuid.value;
	if (!uuid) return 'Not selected';
	const ideList: IIDEInfoWebview[] = (window as any).__INITIAL_STATE__?.ideList ?? [];
	return ideList.find(ide => ide.uuid === uuid)?.name ?? 'Not selected';
});

/** ─── Store 初始化 / Store initialization ─── */

/**
 * 從 DOM 初始化 sourceIDEUuid signal
 * Initialize sourceIDEUuid signal from DOM
 *
 * sourceIDEName 是 computed，不需要初始化，uuid 設定後自動計算。
 * 必須在 DOM 就緒後呼叫，確保 radio 已可查詢。
 *
 * sourceIDEName is computed — no initialization needed, it derives automatically
 * once sourceIDEUuid is set. Must be called after DOM is ready.
 */
export function initStore(): void
{
	const state: Partial<IWebviewInitialState> = (window as any).__INITIAL_STATE__ ?? {};

	/**
	 * 優先從 __INITIAL_STATE__ 讀取，
	 * 若未提供則從 DOM 中已選取的 radio 讀取
	 * Prefer reading from __INITIAL_STATE__;
	 * fall back to the currently checked radio in the DOM
	 */
	const initialSourceUuid =
		(state as any).sourceIDEUuid ??
		document.querySelector<HTMLInputElement>('.ide-source-radio:checked')?.value ??
		'';

	sourceIDEUuid.value = initialSourceUuid;
}
