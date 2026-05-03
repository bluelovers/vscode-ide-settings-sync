/**
 * Webview 前端共用列舉定義
 * Webview frontend shared enum definitions
 *
 * 集中管理所有 enum 與衍生常數，不得放置於 store.ts。
 * Centralizes all enums and derived constants; must not be placed in store.ts or types.ts.
 *
 * 此檔案不得 import 任何 VS Code 或 Node.js 相依模組。
 * This file must NOT import any VS Code or Node.js dependent modules.
 */

/** ─── Tab 相關列舉 / Tab-related enums ─── */

import { EnumTabName } from './types/elem-const';

/**
 * 分頁設定項目介面
 * Tab configuration item interface
 */
export interface ITabConfig
{
	/** 分頁名稱（enum 值）/ Tab name (enum value) */
	name: EnumTabName;
	/** 分頁顯示標籤 / Tab display label */
	label: string;
}
