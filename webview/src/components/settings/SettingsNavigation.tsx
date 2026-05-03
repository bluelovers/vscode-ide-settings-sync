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

import { Fragment } from 'preact';
import { activeTab, TabName } from '../../store';

const TABS: Array<{ name: TabName; label: string }> = [
	{ name: 'sync', label: 'Sync Settings' },
	{ name: 'values', label: 'View All Settings' },
	{ name: 'selected', label: 'Selected Settings' },
	{ name: 'export-import', label: 'Export/Import' },
];

/**
 * 設定導覽列組件（渲染 .tabs 的子內容）
 * Settings navigation bar component (renders children of .tabs)
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
