/**
 * 設定列表容器組件（Client-side Preact 組件）
 * Settings list container component (Client-side Preact component)
 *
 * 提供三種模式對應三個分頁：
 * - search：搜尋結果列表（#searchResults）
 * - all：所有設定列表（#allSettings）
 * - selected：已選設定列表（#selectedSettingsList）
 *
 * Provides three modes corresponding to three tabs:
 * - search: Search results list (#searchResults)
 * - all: All settings list (#allSettings)
 * - selected: Selected settings list (#selectedSettingsList)
 *
 * 所有狀態來自 store.ts 的 signals，組件本身不持有任何狀態。
 * All state comes from signals in store.ts; the component holds no state itself.
 */

import { ideList, searchQuery, checkedSettingKeys, sourceIDEUuid } from '../../store';
import { SettingItem, ISettingValueEntry } from './SettingItem';
import { IIDEInfoWebview } from '../../types';

/** ─── 輔助函數 / Helper functions ─── */

/**
 * 取得設定 key 的多語言描述 HTML 字串
 * Get the multilingual description HTML string for a setting key
 */
function getDescriptionHtml(key: string): string
{
	const descriptions: Record<string, { primary: string; secondary?: string }> =
		(window as any).__INITIAL_STATE__?.settingDescriptions ?? {};
	const desc = descriptions[key];
	if (!desc) return 'No description available';
	if (desc.secondary)
	{
		return `${desc.primary}<br/><small style="color: #999; font-style: italic;">(${desc.secondary})</small>`;
	}
	return desc.primary || 'No description available';
}

/**
 * 將 IDE 列表與設定 key 轉換為 ISettingValueEntry 陣列（所有設定視圖，以名稱為 key）
 * Convert IDE list and setting key to ISettingValueEntry array (all-settings view, name-keyed)
 */
function buildValueEntriesForAllSettings(
	key: string,
	ides: IIDEInfoWebview[],
	currentIDEName: string,
): ISettingValueEntry[]
{
	return ides.map(ide => ({
		ideKey: ide.name,
		ideName: ide.name,
		ideUuid: ide.uuid,
		value: ide.settings && Object.prototype.hasOwnProperty.call(ide.settings, key)
			? ide.settings[key]
			: undefined,
		isCurrent: ide.name === currentIDEName,
	}));
}

/**
 * 將 IDE 列表與設定 key 轉換為 ISettingValueEntry 陣列（搜尋視圖，以 UUID 為 key）
 * Convert IDE list and setting key to ISettingValueEntry array (search view, UUID-keyed)
 */
function buildValueEntriesForSearch(
	key: string,
	ides: IIDEInfoWebview[],
	currentIDEName: string,
): ISettingValueEntry[]
{
	return ides.map(ide => ({
		ideKey: ide.uuid,
		ideName: ide.name,
		ideUuid: ide.uuid,
		value: ide.settings && Object.prototype.hasOwnProperty.call(ide.settings, key)
			? ide.settings[key]
			: undefined,
		isCurrent: ide.name === currentIDEName,
	}));
}

/** ─── 分頁列表組件 / Tab list components ─── */

/**
 * 搜尋結果設定列表
 * Search results settings list
 *
 * 響應 searchQuery signal：查詢字串改變時自動過濾並重新渲染。
 * 響應 sourceIDEUuid signal：來源 IDE 改變時 IdeValueItem 自動更新標記。
 * 響應 checkedSettingKeys signal：checkbox 狀態在重新渲染後保留。
 *
 * Responds to searchQuery signal: automatically filters and re-renders when query changes.
 * Responds to sourceIDEUuid signal: IdeValueItem automatically updates marking when source IDE changes.
 * Responds to checkedSettingKeys signal: checkbox state is preserved after re-render.
 */
export function SearchResultsList()
{
	const query = searchQuery.value.toLowerCase();
	const ides = ideList.value;
	const currentIDEName: string = (window as any).__INITIAL_STATE__?.currentIDEName ?? '';

	if (query.length === 0)
	{
		return <div />;
	}

	/**
	 * 收集所有 key 包含搜尋字串的唯一設定 key
	 * Collect all unique setting keys whose key contains the search string
	 */
	const matchedKeys = new Set<string>();
	ides.forEach(ide =>
	{
		Object.keys(ide.settings || {}).forEach(key =>
		{
			if (key.toLowerCase().includes(query)) matchedKeys.add(key);
		});
	});

	const sortedKeys = Array.from(matchedKeys).sort();

	return (
		<>
			{sortedKeys.map(key => (
				<SettingItem
					key={key}
					settingKey={key}
					description={getDescriptionHtml(key)}
					values={buildValueEntriesForSearch(key, ides, currentIDEName)}
				/>
			))}
		</>
	);
}

/**
 * 所有設定列表
 * All settings list
 *
 * 響應 ideList signal：IDE 資料更新時自動重新渲染。
 * 響應 sourceIDEUuid signal：來源 IDE 改變時 IdeValueItem 自動更新標記。
 * 響應 checkedSettingKeys signal：checkbox 狀態在重新渲染後保留。
 *
 * Responds to ideList signal: automatically re-renders when IDE data updates.
 * Responds to sourceIDEUuid signal: IdeValueItem automatically updates marking when source IDE changes.
 * Responds to checkedSettingKeys signal: checkbox state is preserved after re-render.
 */
export function AllSettingsList()
{
	const ides = ideList.value;
	const currentIDEName: string = (window as any).__INITIAL_STATE__?.currentIDEName ?? '';

	/**
	 * 收集所有 IDE 中出現過的唯一設定 key
	 * Collect all unique setting keys across all IDEs
	 */
	const allKeys = new Set<string>();
	ides.forEach(ide =>
	{
		Object.keys(ide.settings || {}).forEach(key => allKeys.add(key));
	});

	const sortedKeys = Array.from(allKeys).sort();

	return (
		<>
			{sortedKeys.map(key => (
				<SettingItem
					key={key}
					settingKey={key}
					description={getDescriptionHtml(key)}
					values={buildValueEntriesForAllSettings(key, ides, currentIDEName)}
				/>
			))}
		</>
	);
}

/**
 * 已選設定列表
 * Selected settings list
 *
 * 響應 checkedSettingKeys signal：勾選狀態改變時自動更新列表。
 * 響應 ideList signal：IDE 資料更新時自動重新渲染。
 *
 * Responds to checkedSettingKeys signal: automatically updates list when checked state changes.
 * Responds to ideList signal: automatically re-renders when IDE data updates.
 */
export function SelectedSettingsList()
{
	const checked = checkedSettingKeys.value;
	const ides = ideList.value;
	const currentIDEName: string = (window as any).__INITIAL_STATE__?.currentIDEName ?? '';

	if (checked.size === 0)
	{
		return (
			<div style={{ color: 'var(--vscode-descriptionForeground)', padding: '20px', textAlign: 'center' }}>
				No settings selected yet
			</div>
		);
	}

	const sortedKeys = Array.from(checked).sort();

	return (
		<>
			{sortedKeys.map(key => (
				<SettingItem
					key={key}
					settingKey={key}
					description={getDescriptionHtml(key)}
					values={buildValueEntriesForAllSettings(key, ides, currentIDEName)}
					showRemoveButton
				/>
			))}
		</>
	);
}
