
export function isWebviewBrowser()
{
	return typeof window !== 'undefined';
}

/**
 * 根據 DOM 就緒狀態決定立即執行或延遲至 DOMContentLoaded
 * Decide whether to execute immediately or defer to DOMContentLoaded based on DOM ready state
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
