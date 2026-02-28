/**
 * @jsx h
 * @jsxFrag Fragment
 *
 * JSX 轉換指示註釋
 * - @jsx h: 指定使用 Preact 的 h 函數作為 JSX 元素創建函數
 * - @jsxFrag Fragment: 指定使用 Preact 的 Fragment 作為 JSX Fragment
 */

import {
	/** Preact 核心函數和類型 */
	h, Fragment,
	/** DOM 屬性和類型定義 */
	DOMAttributes, ClassAttributes, Attributes,
	/** 組件相關類型 */
	ComponentChildren, ComponentType, ComponentProps,
	/** HTML/SVG 屬性類型 */
	HTMLAttributes, SVGAttributes,
	/** VNode 虛擬節點類型 */
	VNode,
} from 'preact';
import { JSX as JSXInternal } from 'preact/jsx-runtime';
import { render } from 'preact-render-to-string';

/**
 * 將 Preact JSX 渲染為 HTML 字串
 *
 * 函數重載 1: 處理 Preact 組件類型
 * @template T - 組件類型
 * @param type - Preact 組件
 * @param props - 組件屬性
 * @param children - 子元素
 * @returns HTML 字串
 */
export function renderJsxToString<T extends ComponentType<any>>(
	type: T,
	props: (ComponentProps<T>) | null,
	...children: ComponentChildren[]
): string;
/**
 * 函數重載 2: 處理 input 元素的特定類型
 * 提供 HTMLInputElement 的精確屬性類型支援
 * @param type - 元素類型 'input'
 * @param props - input 元素屬性（包含 DOM 屬性和類屬性）
 * @param children - 子元素
 * @returns HTML 字串
 */
export function renderJsxToString(
	type: 'input',
	props:
		| (DOMAttributes<HTMLInputElement> &
				ClassAttributes<HTMLInputElement>)
		| null,
	...children: ComponentChildren[]
): string;
/**
 * 函數重載 3: 處理通用 HTML 內建元素
 * 支援所有 JSX 內建元素類型，提供泛型屬性類型推導
 * @template P - HTML 屬性類型
 * @template T - HTML 元素類型
 * @param type - HTML 元素標籤名
 * @param props - 元素屬性
 * @param children - 子元素
 * @returns HTML 字串
 */
export function renderJsxToString<
	P extends HTMLAttributes<T>,
	T extends HTMLElement
>(
	type: keyof JSXInternal.IntrinsicElements,
	props: (ClassAttributes<T> & P) | null,
	...children: ComponentChildren[]
): string;
/**
 * 函數重載 4: 處理 SVG 內建元素
 * 支援所有 SVG 元素類型，提供 SVG 專屬屬性類型
 * @template P - SVG 屬性類型
 * @template T - HTML 元素類型
 * @param type - SVG 元素標籤名
 * @param props - SVG 元素屬性
 * @param children - 子元素
 * @returns HTML 字串
 */
export function renderJsxToString<
	P extends SVGAttributes<T>,
	T extends HTMLElement
>(
	type: keyof JSXInternal.IntrinsicSVGElements,
	props: (ClassAttributes<T> & P) | null,
	...children: ComponentChildren[]
): string;
/**
 * 函數重載 5: 處理通用字串標籤名（HTML/SVG 混合屬性）
 * 當元素類型無法確定時，提供完整的屬性類型聯集
 * @template T - HTML 元素類型
 * @param type - 元素標籤名字串
 * @param props - 混合屬性（類屬性 + HTML 屬性 + SVG 屬性）
 * @param children - 子元素
 * @returns HTML 字串
 */
export function renderJsxToString<T extends HTMLElement>(
	type: string,
	props:
		| (ClassAttributes<T> &
				HTMLAttributes &
				SVGAttributes)
		| null,
	...children: ComponentChildren[]
): string;

/**
 * 函數重載 6: 最通用的重載簽名
 * 處理組件或字串標籤名的最通用情況
 * @template P - 屬性類型
 * @param type - 組件類型或標籤名字串
 * @param props - 通用屬性
 * @param children - 子元素
 * @returns HTML 字串
 */
export function renderJsxToString<P>(
	type: ComponentType<P> | string,
	props: (Attributes & P) | null,
	...children: ComponentChildren[]
): string;

/**
 * renderJsxToString 實作
 * 使用 Preact 的 h 函數創建虛擬節點，再通過 preact-render-to-string 渲染為 HTML
 *
 * 工作流程：
 * 1. 使用 h(...args) 創建 Preact VNode
 * 2. 使用 render() 將 VNode 序列化為 HTML 字串
 *
 * @param args - 傳遞給 h 函數的參數（類型、屬性、子元素）
 * @returns 渲染後的 HTML 字串
 */
export function renderJsxToString(...args: Parameters<typeof h>): string
{
	return render(h(...args))
}
