/**
 * 檢測當前是否為瀏覽器環境
 * Detect whether the current environment is a browser
 *
 * 透過檢查 window 物件是否存在來判斷，
 * 用於區分 SSR（無 window）與瀏覽器執行環境。
 * Checks window object existence to distinguish
 * SSR (no window) from browser execution environment.
 */
export function isWebviewBrowser()
{
	return typeof window !== 'undefined';
}

/**
 * 根據 DOM 就緒狀態決定立即執行或延遲至 DOMContentLoaded
 * Decide whether to execute immediately or defer to DOMContentLoaded based on DOM ready state
 *
 * 若 DOM 尚未載入完成（readyState === 'loading'），
 * 則監聽 DOMContentLoaded 事件；否則立即執行初始化函數。
 * 確保在 SSR 環境或瀏覽器環境中都能安全初始化。
 *
 * If DOM is still loading (readyState === 'loading'),
 * listen for DOMContentLoaded event; otherwise execute init function immediately.
 * Ensures safe initialization in both SSR and browser environments.
 */
export function onWebviewReadyMaybe(initializeFn: (ev?: Event) => any)
{
	if (typeof document !== 'undefined' && document.readyState === 'loading')
	{
		document.addEventListener('DOMContentLoaded', initializeFn);
	}
	else
	{
		initializeFn();
	}
}
