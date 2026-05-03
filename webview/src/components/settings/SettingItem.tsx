/**
 * 設定項目組件（Client-side Preact 組件）
 * Setting item component (Client-side Preact component)
 *
 * 此組件在 client-side 由 Preact hydration 接管，
 * 透過 @preact/signals 響應式更新 checkbox 狀態與來源 IDE 標記，
 * 不需要手動 DOM 操作。
 *
 * This component is taken over by Preact hydration on the client side,
 * using @preact/signals for reactive updates of checkbox state and source IDE marking,
 * without manual DOM manipulation.
 */

import { checkedSettingKeys, sourceIDEUuid } from '../../store';
import type { IWebviewWindow } from '../../global/window-this';

/** ─── 型別定義 / Type definitions ─── */

/**
 * 單一 IDE 的設定值顯示資料
 * Display data for a single IDE's setting value
 */
export interface ISettingValueEntry
{
	/** IDE UUID（搜尋視圖）或 IDE 名稱（所有設定視圖）/ IDE UUID (search view) or IDE name (all settings view) */
	ideKey: string;
	/** IDE 顯示名稱 / IDE display name */
	ideName: string;
	/** IDE UUID（用於比對來源 IDE）/ IDE UUID (for matching source IDE) */
	ideUuid: string;
	/** 設定值（undefined 表示未設定）/ Setting value (undefined means not set) */
	value: any;
	/** 是否為當前執行此擴充功能的 IDE / Whether this is the IDE currently running this extension */
	isCurrent: boolean;
}

/**
 * SettingItem 組件的 Props
 * Props for the SettingItem component
 */
export interface ISettingItemProps
{
	/** 點分隔的 VS Code 設定 key / Dot-separated VS Code setting key */
	settingKey: string;
	/** 多語言描述 HTML 字串 / Multilingual description HTML string */
	description: string;
	/** 各 IDE 的設定值列表 / List of setting values for each IDE */
	values: ISettingValueEntry[];
	/** 是否顯示移除按鈕（Selected 分頁使用）/ Whether to show remove button (used in Selected tab) */
	showRemoveButton?: boolean;
}

/** ─── 子組件 / Sub-components ─── */

/**
 * 單一 IDE 設定值顯示組件
 * Single IDE setting value display component
 *
 * 根據 sourceIDEUuid signal 自動更新 source-ide 標記，
 * 不需要重新渲染整個設定列表。
 *
 * Automatically updates source-ide marking based on sourceIDEUuid signal,
 * without re-rendering the entire settings list.
 */
function IdeValueItem({ entry }: { entry: ISettingValueEntry })
{
	/**
	 * 直接在 JSX 中讀取 signal.value，Preact 會自動追蹤依賴，
	 * sourceIDEUuid 改變時只有這個組件重新渲染，不影響其他項目。
	 *
	 * Reading signal.value directly in JSX; Preact automatically tracks the dependency.
	 * Only this component re-renders when sourceIDEUuid changes, not the entire list.
	 */
	const isSource = entry.ideUuid === sourceIDEUuid.value;

	let displayValue: string;
	if (entry.value === undefined)
	{
		displayValue = 'Not set';
	}
	else if (typeof entry.value === 'object')
	{
		displayValue = JSON.stringify(entry.value, null, 2);
	}
	else
	{
		displayValue = String(entry.value);
	}

	const classes = [
		'ide-value',
		entry.value === undefined ? 'ide-value-missing' : '',
		entry.isCurrent && entry.value !== undefined ? 'current' : '',
		isSource ? 'source-ide' : '',
	].filter(Boolean).join(' ');

	return (
		<div className={classes}>
			<div className="ide-value-label">
				{entry.ideName}{isSource ? ' (Selected)' : ''}
			</div>
			<div className="ide-value-content">
				{entry.value === undefined
					? <em style={{ color: '#999' }}>Not set</em>
					: displayValue
				}
			</div>
		</div>
	);
}

/** ─── 主組件 / Main component ─── */

/**
 * 設定項目組件
 * Setting item component
 *
 * 管理自身的 checkbox 勾選狀態，並寫入 checkedSettingKeys signal，
 * 讓其他組件（如 Selected 分頁）可以響應式讀取已勾選的設定。
 *
 * Manages its own checkbox checked state and writes to the checkedSettingKeys signal,
 * allowing other components (e.g., Selected tab) to reactively read checked settings.
 */
export function SettingItem({
	settingKey,
	description,
	values,
	showRemoveButton = false,
}: ISettingItemProps)
{
	const settingId = 'setting-' + settingKey.replace(/\./g, '_');

	/**
	 * 直接從 checkedSettingKeys signal 讀取勾選狀態，不使用本地 signal。
	 *
	 * Preact 自動追蹤對 checkedSettingKeys.value 的讀取，
	 * checkedSettingKeys 改變時此組件自動重新渲染，isChecked 永遠反映最新狀態。
	 *
	 * 不使用 useSignal 的原因：
	 * useSignal 建立的本地 signal 初始值只在組件掛載時計算一次，
	 * 之後與 checkedSettingKeys 脫鉤——若父組件因 ideList 更新而重新渲染，
	 * 組件被 remount 時 useSignal 重新初始化，但若 Preact reconcile 複用了組件實例，
	 * 本地 signal 就不會更新，造成狀態不一致。
	 * 直接讀全域 signal 可避免這個問題。
	 *
	 * Read checked state directly from checkedSettingKeys signal — no local signal needed.
	 *
	 * Preact automatically tracks reads of checkedSettingKeys.value;
	 * this component re-renders automatically when checkedSettingKeys changes,
	 * so isChecked always reflects the latest state.
	 *
	 * Why not useSignal:
	 * A local signal created by useSignal is only initialized once at mount time,
	 * then decoupled from checkedSettingKeys. If the parent re-renders due to ideList updates
	 * and Preact reuses the component instance via reconciliation, the local signal won't
	 * update, causing state inconsistency. Reading the global signal directly avoids this.
	 */
	const isChecked = checkedSettingKeys.value.has(settingKey);

	function handleCheckboxChange(e: Event)
	{
		const checked = (e.target as HTMLInputElement).checked;

		/**
		 * 更新全域 checkedSettingKeys signal（建立新 Set 觸發響應式更新）
		 * Update global checkedSettingKeys signal (create new Set to trigger reactive update)
		 */
		const next = new Set(checkedSettingKeys.value);
		if (checked)
		{
			next.add(settingKey);
		}
		else
		{
			next.delete(settingKey);
		}
		checkedSettingKeys.value = next;
	}

	function handleRemove()
	{
		(window as any as IWebviewWindow).removeFromSelectedSettings?.(settingKey);
	}

	return (
		<div className="setting-item">
			<div className="setting-key">
				<input
					type="checkbox"
					className="setting-checkbox"
					id={settingId}
					data-key={settingKey}
					checked={isChecked}
					onChange={handleCheckboxChange}
				/>
				<label htmlFor={settingId}>{settingKey}</label>
				{showRemoveButton && (
					<button
						className="btn btn-small"
						onClick={handleRemove}
						style={{ marginLeft: 'auto' }}
					>
						✕ Remove
					</button>
				)}
			</div>
			<div
				className="setting-description"
				dangerouslySetInnerHTML={{ __html: description }}
			/>
			<div className="setting-values">
				{values.map(entry => (
					<IdeValueItem key={entry.ideKey} entry={entry} />
				))}
			</div>
		</div>
	);
}
