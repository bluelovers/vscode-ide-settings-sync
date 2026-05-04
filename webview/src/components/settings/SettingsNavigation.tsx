/**
 * 設定導覽列組件（Client-side Preact 組件）
 * Settings navigation bar component (Client-side Preact component)
 *
 * 渲染分頁切換按鈕，讓使用者在 Sync、View All、Selected、Export/Import 分頁間切換。
 * Renders tab switching buttons, allowing users to switch between tabs.
 *
 * 此組件渲染 `.tabs` 容器的**子內容**（不含外層 div），
 * 由 `index.tsx` hydrate 至 `.tabs` 容器。
 * This component renders the **children** of the `.tabs` container (without the outer div),
 * hydrated into the `.tabs` container by `index.tsx`.
 *
 * 使用 `activeTab` signal 驅動 active 狀態與 onClick 事件。
 * Uses `activeTab` signal to drive active state and onClick events.
 */

import { activeTab } from '../../store';
import { ITabConfig } from '../../enums';
import { ALL_TAB_NAMES, EnumTabName } from '../../types/elem-const';

/**
 * 分頁顯示標籤對照表（單一事實來源）
 * Tab display label map (Single Source of Truth)
 */
const TAB_LABELS: Record<EnumTabName, string> = {
	[EnumTabName.sync]: 'Sync Settings',
	[EnumTabName.values]: 'View All Settings',
	[EnumTabName.selected]: 'Selected Settings',
	[EnumTabName.exportImport]: 'Export/Import',
};

/**
 * 從全域分頁名稱列表生成分頁配置陣列
 * Generate tab configuration array from the global tab name list
 *
 * 使用 ALL_TAB_NAMES.map 可確保分頁順序與枚舉定義一致，維持單一事實來源原則。
 * Using ALL_TAB_NAMES.map ensures tab order matches enum definition, maintaining Single Source of Truth principle.
 */
const TABS: ITabConfig[] = ALL_TAB_NAMES.map(name => ({
	name,
	label: TAB_LABELS[name],
}));

/**
 * 設定導覽列組件（渲染 .tabs 的子內容）
 * Settings navigation bar component (renders children of .tabs)
 *
 * 原因：此組件只負責渲染分頁按鈕，不包含外層容器，
 * 以便由 index.tsx 進行 hydrate 時能正確掛載至既有的 .tabs DOM 元素。
 *
 * Reason: This component only renders tab buttons without the outer container,
 * so that index.tsx can correctly hydrate onto the existing .tabs DOM element.
 */
export function SettingsNavigation()
{
	return (
		<>
			{TABS.map(tab => (
				<button
					key={tab.name}
					className={`tab${activeTab.value === tab.name ? ' active' : ''}`}
					onClick={() => { activeTab.value = tab.name; }}
				>
					{tab.label}
				</button>
			))}
		</>
	);
}
