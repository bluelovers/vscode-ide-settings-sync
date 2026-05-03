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

/**
 * 合法的分頁名稱列舉（單一事實來源）
 * Enum of valid tab names (Single Source of Truth)
 *
 * 所有需要列舉 tab 的地方（switchTab、effect、TABS 陣列）都從此衍生，
 * 避免各處硬編碼字串造成的 Shotgun Surgery 問題。
 *
 * All places that need to enumerate tabs (switchTab, effect, TABS array) derive from this,
 * avoiding Shotgun Surgery caused by hardcoded strings in multiple places.
 */
export const enum EnumTabName
{
	/** 同步設定分頁 / Sync settings tab */
	sync = 'sync',
	/** 檢視所有設定分頁 / View all settings tab */
	values = 'values',
	/** 已選設定分頁 / Selected settings tab */
	selected = 'selected',
	/** 匯出/匯入分頁 / Export/Import tab */
	exportImport = 'export-import',
}

/**
 * 所有分頁的有序陣列（從 EnumTabName 衍生，單一事實來源）
 * Ordered array of all tabs (derived from EnumTabName, Single Source of Truth)
 *
 * 新增分頁時只需在 EnumTabName 加一筆，此陣列同步更新。
 * To add a tab, only update EnumTabName; this array updates automatically.
 */
export const ALL_TAB_NAMES: EnumTabName[] = [
	EnumTabName.sync,
	EnumTabName.values,
	EnumTabName.selected,
	EnumTabName.exportImport,
];

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
