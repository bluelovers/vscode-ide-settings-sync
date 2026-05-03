
import { EnumCssClassSelector, EnumTabName, EnumWebviewElemId } from '../types/elem-const';

/**
 * 將 EnumWebviewElemId 轉換為 CSS ID 選擇器字串（帶 # 前綴）
 * Convert EnumWebviewElemId to CSS ID selector string (with # prefix)
 * @param id - 元素 ID 列舉值 / Element ID enum value
 * @param suffix - 選擇器後綴 / Selector suffix
 * @returns CSS ID 選擇器字串 / CSS ID selector string
 */
export function getElemIdSelector(id: EnumWebviewElemId, suffix?: string): string
{
	return `#${id}${suffix ?? ''}`;
}

/**
 * 將 EnumCssClassSelector 轉換為 CSS 類別選擇器字串（帶 . 前綴）
 * Convert EnumCssClassSelector to CSS class selector string (with . prefix)
 * @param className - CSS 類別列舉值 / CSS class enum value
 * @param suffix - 選擇器後綴 / Selector suffix
 * @returns CSS 類別選擇器字串 / CSS class selector string
 */
export function getClassSelector(className: EnumCssClassSelector, suffix?: string): string
{
	return `.${className}${suffix ?? ''}`;
}

/**
 * 透過 EnumWebviewElemId 查詢單一元素
 * Query single element by EnumWebviewElemId
 * @param id - 元素 ID 列舉值 / Element ID enum value
 * @returns 查詢到的元素或 null / Queried element or null
 */
export function querySelectorById<T extends HTMLElement>(id: EnumWebviewElemId | EnumTabName): T | null
{
	return document.getElementById(id) as T | null;
}

/**
 * 透過 EnumCssClassSelector 查詢單一元素
 * Query single element by EnumCssClassSelector
 * @param classSelector - CSS 類別列舉值 / CSS class enum value
 * @param suffix - 選擇器後綴 / Selector suffix
 * @returns 查詢到的元素或 null / Queried element or null
 */
export function querySelectorByClass<T extends HTMLElement>(classSelector: EnumCssClassSelector, suffix?: string): T | null
{
	return document.querySelector<T>(getClassSelector(classSelector, suffix));
}

/**
 * 透過 EnumCssClassSelector 查詢所有匹配元素
 * Query all elements by EnumCssClassSelector
 * @param classSelector - CSS 類別列舉值 / CSS class enum value
 * @param suffix - 選擇器後綴 / Selector suffix
 * @returns 查詢到的元素列表 / Queried elements NodeList
 */
export function querySelectorAllByClass<T extends HTMLElement>(classSelector: EnumCssClassSelector, suffix?: string): NodeListOf<T>
{
	return document.querySelectorAll<T>(getClassSelector(classSelector, suffix));
}

