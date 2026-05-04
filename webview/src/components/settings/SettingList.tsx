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
import type { IWebviewWindow } from '../../global/window-this';

/** ─── 輔助函數 / Helper functions ─── */

/**
 * 取得設定 key 的多語言描述 HTML 字串
 * Get the multilingual description HTML string for a setting key
 *
 * 從 window.__INITIAL_STATE__.settingDescriptions 讀取預先注入的描述資料，
 * 支援主要描述與次要描述（以 <small> 標籤顯示）。
 *
 * Read pre-injected description data from window.__INITIAL_STATE__.settingDescriptions,
 * supports primary description and optional secondary description (shown in <small> tags).
 */
function getDescriptionHtml(key: string): string
{
	/** 從全域狀態讀取設定描述對應表，若無則使用空物件 / Read setting descriptions map from global state, use empty object if not available */
	const descriptions: Record<string, { primary: string; secondary?: string }> =
		(window as any as IWebviewWindow).__INITIAL_STATE__?.settingDescriptions ?? {};

	/** 查找當前 key 對應的描述 / Look up description for the current key */
	const desc = descriptions[key];

	/** 若找不到描述則回傳預設提示 / Return default message if description not found */
	if (!desc) return 'No description available';

	/**
	 * 若有次要描述，則以 <small> 標籤附加在主要描述後方，
	 * 使用灰色斜體樣式便於區分。
	 *
	 * If secondary description exists, append it after primary description in <small> tags,
	 * using gray italic style for visual distinction.
	 */
	if (desc.secondary)
	{
		return `${desc.primary}<br/><small style="color: #999; font-style: italic;">(${desc.secondary})</small>`;
	}

	/** 僅回傳主要描述，或預設提示 / Return primary description only, or default message */
	return desc.primary || 'No description available';
}

/**
 * 將 IDE 列表與設定 key 轉換為 ISettingValueEntry 陣列（所有設定視圖，以名稱為 key）
 * Convert IDE list and setting key to ISettingValueEntry array (all-settings view, name-keyed)
 *
 * 使用 IDE 名稱作為 ideKey（如 "Visual Studio Code"、"Cursor"），
 * 適用於所有設定列表，因為名稱比 UUID 更易讀。
 *
 * Uses IDE name as ideKey (e.g., "Visual Studio Code", "Cursor"),
 * suitable for all-settings list where names are more readable than UUIDs.
 */
function buildValueEntriesForAllSettings(
	key: string,
	ides: IIDEInfoWebview[],
	currentIDEName: string,
): ISettingValueEntry[]
{
	/**
	 * 遍歷所有 IDE，為每個 IDE 建立一個設定值條目：
	 * - 使用 ide.name 作為 ideKey（顯示用）
	 * - 檢查該 IDE 的 settings 物件中是否存在指定的 key
	 * - 若存在則讀取設定值，否則設為 undefined（表示未設定）
	 * - 標記是否為當前執行此擴充的 IDE
	 *
	 * Map through all IDEs, creating a setting value entry for each:
	 * - Use ide.name as ideKey (for display)
	 * - Check if the specified key exists in the IDE's settings object
	 * - Read the setting value if exists, otherwise set to undefined (not set)
	 * - Mark whether this is the IDE currently running this extension
	 */
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
 *
 * 使用 IDE UUID 作為 ideKey，因為搜尋結果可能需要處理來自不同 IDE 的同名情況，
 * UUID 能確保唯一性，避免混淆。
 *
 * Uses IDE UUID as ideKey because search results may need to handle
 * same-name situations from different IDEs; UUID ensures uniqueness and avoids confusion.
 */
function buildValueEntriesForSearch(
	key: string,
	ides: IIDEInfoWebview[],
	currentIDEName: string,
): ISettingValueEntry[]
{
	/**
	 * 遍歷所有 IDE，為每個 IDE 建立一個設定值條目：
	 * - 使用 ide.uuid 作為 ideKey（確保唯一性）
	 * - 其餘邏輯與 buildValueEntriesForAllSettings 相同
	 *
	 * Map through all IDEs, creating a setting value entry for each:
	 * - Use ide.uuid as ideKey (ensures uniqueness)
	 * - Remaining logic is the same as buildValueEntriesForAllSettings
	 */
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
	/**
	 * 將搜尋字串轉為小寫，確保不區分大小寫的搜尋
	 * Convert search query to lowercase for case-insensitive search
	 */
	const query = searchQuery.value.toLowerCase();

	/** 從全域 signal 讀取 IDE 列表 / Read IDE list from global signal */
	const ides = ideList.value;

	/** 從全域狀態讀取當前 IDE 名稱，用於標記 / Read current IDE name from global state, used for marking */
	const currentIDEName: string = (window as any as IWebviewWindow).__INITIAL_STATE__?.currentIDEName ?? '';

	/**
	 * 若搜尋字串為空，則不顯示任何結果（返回空 div）
	 * If search query is empty, show no results (return empty div)
	 */
	if (query.length === 0)
	{
		return <div />;
	}

	/**
	 * 收集所有 key 包含搜尋字串的唯一設定 key
	 * Collect all unique setting keys whose key contains the search string
	 *
	 * 遍歷所有 IDE 的 settings 物件，檢查每個 key 是否包含搜尋字串，
	 * 使用 Set 確保每個 key 只出現一次（因為多個 IDE 可能有相同的設定 key）。
	 *
	 * Iterate through all IDEs' settings objects, check if each key contains the search string,
	 * use Set to ensure each key appears only once (since multiple IDEs may have the same setting key).
	 */
	const matchedKeys = new Set<string>();
	ides.forEach(ide =>
	{
		Object.keys(ide.settings || {}).forEach(key =>
		{
			if (key.toLowerCase().includes(query)) matchedKeys.add(key);
		});
	});

	/**
	 * 將匹配的 key 轉為陣列並按字母順序排序，提供一致的顯示順序
	 * Convert matched keys to array and sort alphabetically for consistent display order
	 */
	const sortedKeys = Array.from(matchedKeys).sort();

	/**
	 * 渲染搜尋結果列表：
	 * - 為每個匹配的 key 建立 SettingItem 組件
	 * - 使用 buildValueEntriesForSearch 建立以 UUID 為 key 的設定值條目
	 * - 提供多語言描述 HTML
	 *
	 * Render search results list:
	 * - Create SettingItem component for each matched key
	 * - Use buildValueEntriesForSearch to build UUID-keyed setting value entries
	 * - Provide multilingual description HTML
	 */
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
	/** 從全域 signal 讀取 IDE 列表 / Read IDE list from global signal */
	const ides = ideList.value;

	/** 從全域狀態讀取當前 IDE 名稱，用於標記 / Read current IDE name from global state, used for marking */
	const currentIDEName: string = (window as any as IWebviewWindow).__INITIAL_STATE__?.currentIDEName ?? '';

	/**
	 * 收集所有 IDE 中出現過的唯一設定 key
	 * Collect all unique setting keys across all IDEs
	 *
	 * 遍歷所有 IDE 的 settings 物件，將其所有 key 加入 Set，
	 * 自動去重複，因為不同 IDE 可能有相同的設定 key。
	 *
	 * Iterate through all IDEs' settings objects, add all keys to Set,
	 * automatically deduplicating since different IDEs may have the same setting key.
	 */
	const allKeys = new Set<string>();
	ides.forEach(ide =>
	{
		Object.keys(ide.settings || {}).forEach(key => allKeys.add(key));
	});

	/**
	 * 將所有 key 轉為陣列並按字母順序排序，
	 * 提供一致的顯示順序，便於使用者查找。
	 *
	 * Convert all keys to array and sort alphabetically,
	 * providing consistent display order for user browsing.
	 */
	const sortedKeys = Array.from(allKeys).sort();

	/**
	 * 渲染所有設定列表：
	 * - 為每個設定 key 建立 SettingItem 組件
	 * - 使用 buildValueEntriesForAllSettings 建立以名稱為 key 的設定值條目
	 * - 提供多語言描述 HTML
	 *
	 * Render all settings list:
	 * - Create SettingItem component for each setting key
	 * - Use buildValueEntriesForAllSettings to build name-keyed setting value entries
	 * - Provide multilingual description HTML
	 */
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
	/**
	 * 從全域 signal 讀取已勾選的設定 key 集合
	 * Read the set of checked setting keys from global signal
	 */
	const checked = checkedSettingKeys.value;

	/** 從全域 signal 讀取 IDE 列表 / Read IDE list from global signal */
	const ides = ideList.value;

	/** 從全域狀態讀取當前 IDE 名稱，用於標記 / Read current IDE name from global state, used for marking */
	const currentIDEName: string = (window as any as IWebviewWindow).__INITIAL_STATE__?.currentIDEName ?? '';

	/**
	 * 若沒有勾選任何設定，則顯示提示訊息
	 * If no settings are checked, show a prompt message
	 */
	if (checked.size === 0)
	{
		return (
			<div style={{ color: 'var(--vscode-descriptionForeground)', padding: '20px', textAlign: 'center' }}>
				No settings selected yet
			</div>
		);
	}

	/**
	 * 將已勾選的 key 轉為陣列並按字母順序排序
	 * Convert checked keys to array and sort alphabetically
	 */
	const sortedKeys = Array.from(checked).sort();

	/**
	 * 渲染已選設定列表：
	 * - 為每個勾選的 key 建立 SettingItem 組件
	 * - 使用 buildValueEntriesForAllSettings 建立以名稱為 key 的設定值條目
	 * - 提供多語言描述 HTML
	 * - 顯示移除按鈕（showRemoveButton=true）
	 *
	 * Render selected settings list:
	 * - Create SettingItem component for each checked key
	 * - Use buildValueEntriesForAllSettings to build name-keyed setting value entries
	 * - Provide multilingual description HTML
	 * - Show remove button (showRemoveButton=true)
	 */
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
