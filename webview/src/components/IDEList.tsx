/**
 * IDE 列表組件模組（SSR 組件）
 * IDE list component module (SSR component)
 *
 * 渲染可用與不可用的 IDE 列表，包含來源 IDE 選擇、自訂 IDE 管理等互動元素。
 * Renders available and unavailable IDE lists, including source IDE selection and custom IDE management interactions.
 *
 * 事件處理由 window 掛載的函數負責（onclick 字串）。
 * Event handling is done by window-mounted functions (onclick strings).
 */

import { formatPath } from '../../../src/utils/formatPath';
import { IIDEListProps, IRemoveCustomIDEParams } from './types';
import { ITSRequireAtLeastOne } from 'ts-type';
import { EnumCssClassSelector } from '../types/elem-const';

function AvailableIDEItem(props: {
	ide: { uuid: string; name: string; type: string; nativePath: string };
	index: number;
	isCurrent: boolean;
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
				className={EnumCssClassSelector.ideSourceRadio}
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
				className={EnumCssClassSelector.ideCheckbox}
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

function BtnRemoveCustomIDE(props: {
	ide: { uuid: string; name: string; nativePath: string };
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
			// @ts-ignore
			onclick={`removeCustomIDE && removeCustomIDE(${JSON.stringify(params)})`}
			title="Remove this custom IDE"
		>
			Remove
		</button>
	);
}

function BtnOpenIDEFolder(props: { path: string })
{
	// @ts-ignore
	return (<button className="btn btn-small" onclick={`openIDEFolder && openIDEFolder(${JSON.stringify(props.path)})`} title="Open IDE folder">📂</button>);
}

function BtnOpenSettingsJson(props: { idePath: string; ideName: string })
{
	// @ts-ignore
	return (<button className="btn btn-small" onclick={`openSettingsJson && openSettingsJson(${JSON.stringify(props.idePath)}, ${JSON.stringify(props.ideName)})`} title="Open settings.json in editor">📄</button>);
}

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

function UnavailableIDEItem(props: {
	ide: { name: string; expectedPath: string; reason?: string };
	index: number;
})
{
	const id = `ide-unavail-${props.ide.name.replace(/\W/g, '')}${props.index}`;

	return (<>
		<div key={props.index} className="ide-item unavailable" title={`Not detected: ${props.ide.expectedPath}`}>
			<input type="radio" className={EnumCssClassSelector.ideSourceRadio} disabled title="Cannot select unavailable IDE as source" />
			<input type="checkbox" id={id} className={EnumCssClassSelector.ideCheckbox} disabled />
			<label htmlFor={id}><strong>{props.ide.name}</strong></label>
			<span className="ide-path">❌ Not detected: {props.ide.expectedPath}</span>
			<BtnOpenIDEFolder path={props.ide.expectedPath} />
		</div>
		<UnavailableIDEItemReason reason={props.ide.reason} ide={props.ide} />
	</>);
}

export function IDEList({
	availableIDEs,
	unavailableIDEs,
	currentIDEName,
	sourceIDEUuid,
}: IIDEListProps)
{
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
			<button className="btn" onclick="addCustomIDE && addCustomIDE()" style="margin-top: 10px;" title="Manually specify an IDE/settings folder">
				+ Add Custom IDE Path
			</button>
			{/* @ts-ignore */}
			<button className="btn secondary" onclick="refreshIDEs && refreshIDEs()" title="Refresh IDE list">
				🔄 Refresh
			</button>
		</div>
	</>);
}
