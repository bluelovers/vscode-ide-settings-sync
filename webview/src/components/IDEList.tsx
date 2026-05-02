/**
 * IDE 列表組件模組
 * IDE list component module
 *
 * 渲染可用與不可用的 IDE 列表，包含來源 IDE 選擇、自訂 IDE 管理等互動元素。
 * Renders available and unavailable IDE lists, including source IDE selection and custom IDE management interactions.
 */

import { formatPath } from '../../../src/utils/formatPath';
import { IIDEListProps, IRemoveCustomIDEParams } from './types';
import { ITSRequireAtLeastOne } from 'ts-type';

/** ─── 內部子組件 / Internal sub-components ─── */

/**
 * 可用 IDE 項目組件
 * Available IDE item component
 *
 * 渲染單一可用 IDE 的列表項目，包含來源 radio、勾選框、路徑顯示與操作按鈕。
 * Renders a single available IDE list item, including source radio, checkbox, path display, and action buttons.
 */
function AvailableIDEItem(props: {
	/** IDE 資訊 / IDE information */
	ide: { uuid: string; name: string; type: string; nativePath: string };
	/** IDE 在列表中的索引 / IDE index in the list */
	index: number;
	/** 是否為當前執行此擴充功能的 IDE / Whether this is the IDE currently running this extension */
	isCurrent: boolean;
	/** 是否為選取的來源 IDE / Whether this is the selected source IDE */
	isSource: boolean;
})
{
	const className = `ide-item available${props.isCurrent ? ' current' : ''}${props.isSource ? ' source-ide' : ''}`;
	const id = `ide-${props.index}`;
	const sourceId = `source-${props.ide.uuid}`;

	return (<>
		<div key={props.index} className={className}>
			<input
				type="radio"
				id={sourceId}
				name="sourceIDE"
				className="ide-source-radio"
				value={props.ide.uuid}
				checked={props.isSource}
				title="Select as source IDE"
				data-index={props.index}
				data-name={props.ide.name}
				data-uuid={props.ide.uuid}
			/>
			<input
				type="checkbox"
				id={id}
				className="ide-checkbox"
				data-index={props.index}
				data-name={props.ide.name}
				data-uuid={props.ide.uuid}
			/>
			<label htmlFor={id}>
				<strong>{props.ide.name}</strong>
				<span className="uuid-area">
					&nbsp;(<span className="uuid">{props.ide.uuid}</span>)
				</span>
			</label>
			<span className="ide-path" title={props.ide.nativePath}>{formatPath(props.ide.nativePath)}</span>
			<BtnOpenIDEFolder path={props.ide.nativePath} />
			<BtnOpenSettingsJson idePath={props.ide.nativePath} ideName={props.ide.name} />
			{props.ide.type === 'custom' ? <BtnRemoveCustomIDE index={props.index} ide={props.ide} /> : null}
		</div>
	</>);
}

/**
 * 移除自訂 IDE 按鈕組件
 * Remove custom IDE button component
 */
function BtnRemoveCustomIDE(props: {
	/** IDE 資訊（包含 uuid, name, nativePath）/ IDE information (including uuid, name, nativePath) */
	ide: { uuid: string; name: string; nativePath: string };
	/** IDE 在列表中的索引 / IDE index in the list */
	index: number;
})
{
	const params: IRemoveCustomIDEParams = {
		index: props.index,
		uuid: props.ide.uuid,
		name: props.ide.name,
		nativePath: props.ide.nativePath,
	};

	return (
		<button
			className="btn btn-small btn-remove"
			/**
			 * onclick 使用小寫字串屬性以相容 SSR 輸出
			 * onclick uses lowercase string attribute for SSR output compatibility
			 */
			// @ts-ignore
			onclick={`removeCustomIDE(${JSON.stringify(params)})`}
			title="Remove this custom IDE"
		>
			Remove
		</button>
	);
}

/**
 * 開啟 IDE 資料夾按鈕組件
 * Open IDE folder button component
 */
function BtnOpenIDEFolder(props: { path: string })
{
	// @ts-ignore
	return (<button className="btn btn-small" onclick={`openIDEFolder(${JSON.stringify(props.path)})`} title="Open IDE folder">📂</button>);
}

/**
 * 開啟 settings.json 按鈕組件
 * Open settings.json button component
 */
function BtnOpenSettingsJson(props: { idePath: string; ideName: string })
{
	// @ts-ignore
	return (<button className="btn btn-small" onclick={`openSettingsJson(${JSON.stringify(props.idePath)}, ${JSON.stringify(props.ideName)})`} title="Open settings.json in editor">📄</button>);
}

/**
 * 不可用 IDE 項目的原因說明組件
 * Reason description component for unavailable IDE items
 */
export function UnavailableIDEItemReason(props: ITSRequireAtLeastOne<{
	reason: string;
	ide: { reason?: string };
}>)
{
	if (!props.reason || !props.ide?.reason)
	{
		return null;
	}

	return (<div className="ide-item unavailable-reason">{props.reason ?? props.ide.reason}</div>);
}

/**
 * 不可用 IDE 項目組件
 * Unavailable IDE item component
 *
 * 渲染系統中預期存在但未偵測到的 IDE 項目，以灰顯方式顯示。
 * Renders IDE items that are expected to exist in the system but were not detected, displayed in a grayed-out style.
 */
function UnavailableIDEItem(props: {
	/** 不可用 IDE 的資訊 / Unavailable IDE information */
	ide: { name: string; expectedPath: string; reason?: string };
	/** IDE 在列表中的索引 / IDE index in the list */
	index: number;
})
{
	const id = `ide-unavail-${props.ide.name.replace(/\W/g, '')}${props.index}`;

	return (<>
		<div key={props.index} className="ide-item unavailable" title={`Not detected: ${props.ide.expectedPath}`}>
			<input type="radio" className="ide-source-radio" disabled title="Cannot select unavailable IDE as source" />
			<input type="checkbox" id={id} className="ide-checkbox" disabled />
			<label htmlFor={id}><strong>{props.ide.name}</strong></label>
			<span className="ide-path">❌ Not detected: {props.ide.expectedPath}</span>
			<BtnOpenIDEFolder path={props.ide.expectedPath} />
		</div>
		<UnavailableIDEItemReason reason={props.ide.reason} ide={props.ide} />
	</>);
}

/** ─── 公開組件 / Public components ─── */

/**
 * IDE 列表組件
 * IDE list component
 *
 * 渲染可用與不可用的 IDE 列表，不含外層 section 包裝。
 * Renders available and unavailable IDE lists without outer section wrapper.
 *
 * @param props - IDE 列表屬性 / IDE list props
 */
export function IDEList({
	availableIDEs,
	unavailableIDEs,
	currentIDEName,
	sourceIDEUuid,
}: IIDEListProps)
{
	/**
	 * 若未指定來源 IDE，預設選取第一個可用 IDE
	 * If no source IDE is specified, default to the first available IDE
	 */
	const defaultSourceUuid = sourceIDEUuid ?? (availableIDEs.length > 0 ? availableIDEs[0].uuid : undefined);

	return (<>
		<div class="ide-list">
			{availableIDEs.map((ide, index) => (
				<AvailableIDEItem
					key={index}
					ide={ide}
					index={index}
					isCurrent={ide.name === currentIDEName}
					isSource={ide.uuid === defaultSourceUuid}
				/>
			))}
			{unavailableIDEs.map((ide, index) => (
				<UnavailableIDEItem key={index} ide={ide} index={index} />
			))}
		</div>
	</>);
}

/**
 * IDE 列表區塊組件（含 section 包裝與操作按鈕）
 * IDE list section component (with section wrapper and action buttons)
 *
 * 在 IDE 列表外加上 section 標題、新增自訂 IDE 按鈕與重新整理按鈕。
 * Adds section title, add custom IDE button, and refresh button around the IDE list.
 *
 * @param props - IDE 列表屬性 / IDE list props
 */
export function IDEListSection({
	availableIDEs,
	unavailableIDEs,
	currentIDEName,
	sourceIDEUuid,
}: IIDEListProps)
{
	return (<>
		<div className="section">
			<h2>Select IDEs</h2>
			<IDEList
				availableIDEs={availableIDEs}
				unavailableIDEs={unavailableIDEs}
				currentIDEName={currentIDEName}
				sourceIDEUuid={sourceIDEUuid}
			/>
			{/* @ts-ignore */}
			<button className="btn" onclick="addCustomIDE()" style="margin-top: 10px;" title="Manually specify an IDE/settings folder">
				+ Add Custom IDE Path
			</button>
			{/* @ts-ignore */}
			<button className="btn secondary" onclick="refreshIDEs()" title="Refresh IDE list">
				🔄 Refresh
			</button>
		</div>
	</>);
}
