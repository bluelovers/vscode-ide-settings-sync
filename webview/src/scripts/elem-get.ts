
export const enum EnumWebviewElemSelector
{
	'searchResults' = '#searchResults',
}

export function queryWebviewElem<T extends HTMLElement>(selector: EnumWebviewElemSelector)
{
	return document.querySelector<T>(selector);
}

export function queryWebviewElemAll<T extends HTMLElement>(selector: EnumWebviewElemSelector)
{
	return document.querySelectorAll<T>(selector);
}
