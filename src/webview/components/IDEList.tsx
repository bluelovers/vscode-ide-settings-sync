import { h, Fragment } from 'preact';
import { formatPath } from '../../utils/formatPath';
import { IIDEListProps, IRemoveCustomIDEParams } from './types';
import { IIDEInfo } from '../../types';
import { ITSRequireAtLeastOne } from 'ts-type';

/**
 * 轉義單引號，用於 JavaScript 字串
 * @param str - 原始字串
 * @returns 轉義後的字串
 */
function escapeSingleQuote(str: string): string
{
	return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * 轉義 HTML 特殊字符
 * @param str - 原始字串
 * @returns 轉義後的字串
 */
function escapeHtml(str: string): string
{
	return str.replace(/</g, '<').replace(/>/g, '>');
}

/**
 * 生成可用 IDE 項目的 HTML 字串
 * 使用原生 HTML 字串而非 JSX，以便正確處理 onclick 屬性
 *
 * @param ide - IDE 資訊
 * @param index - IDE 索引
 * @param isCurrent - 是否為當前 IDE
 * @param isSource - 是否為來源 IDE
 * @returns HTML 字串
 */
function AvailableIDEItem(props: {
	ide: { uuid: string; name: string; type: string; nativePath: string },
	index: number,
	isCurrent: boolean,
	isSource: boolean
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
	</>)

	// return `
	// 	<div class="${className}">
	// 		<input type="checkbox" id="ide-${index}" class="ide-checkbox" data-index="${index}" data-name="${ide.name}">
	// 		<label for="ide-${index}"><strong>${escapeHtml(ide.name)}</strong></label>
	// 		<span class="ide-path" title="${escapeHtml(ide.nativePath)}">${formatPath(ide.nativePath)}</span>
	// 		<button class="btn btn-small" onclick="openIDEFolder('${escapedPath}')" title="Open IDE folder">📂</button>
	// 		${removeButton}
	// 	</div>
	// `;
}

/**
 * 移除自訂 IDE 按鈕組件
 * Remove custom IDE button component
 *
 * @param props.index - IDE 索引
 * @param props.ide - IDE 資訊（包含 uuid, name, nativePath）
 */
function BtnRemoveCustomIDE(props: {
	ide: { uuid: string; name: string; nativePath: string };
	index: number;
})
{
	// 建立統一的參數物件
	// Create unified params object
	const params: IRemoveCustomIDEParams = {
		index: props.index,
		uuid: props.ide.uuid,
		name: props.ide.name,
		nativePath: props.ide.nativePath,
	};

	return (<button className="btn btn-small btn-remove"
		// @ts-ignore
									onclick={`removeCustomIDE(${JSON.stringify(params)})`}
									title="Remove this custom IDE">Remove</button>)
}

function BtnOpenIDEFolder(props: {
	path: string,
})
{
	// @ts-ignore
	return (<button className="btn btn-small" onclick={`openIDEFolder(${JSON.stringify(props.path)})`}
									title="Open IDE folder">📂</button>)
}

function BtnOpenSettingsJson(props: {
	idePath: string,
	ideName: string,
})
{
	// @ts-ignore
	return (<button className="btn btn-small"
									// @ts-ignore
									onclick={`openSettingsJson(${JSON.stringify(props.idePath)}, ${JSON.stringify(props.ideName)})`}
									title="Open settings.json in editor">📄</button>)
}

export function UnavailableIDEItemReason(props: ITSRequireAtLeastOne<{
	reason: string,
	ide: {
		reason?: string;
	},
}>)
{
	if (!props.reason || !props.ide?.reason)
	{
		return null;
	}

	return (<div className="ide-item unavailable-reason">{props.reason ?? props.ide.reason}</div>)
}

/**
 * 生成不可用 IDE 項目的 HTML 字串
 *
 * @param ide - IDE 資訊
 * @returns HTML 字串
 */
function UnavailableIDEItem(props: {
	ide: {
		name: string;
		expectedPath: string;
		reason?: string;
	},
	index: number,
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
	</>)
}

/**
 * @deprecated JS 邏輯已遷移至 `webview/src/scripts/ide.ts`，由 esbuild bundle 提供。
 * 組件本身已移至 `webview/src/components/IDEList.tsx`。
 * @deprecated JS logic has been migrated to `webview/src/scripts/ide.ts`, provided by the esbuild bundle.
 * The component itself has been moved to `webview/src/components/IDEList.tsx`.
 */
export function IDEListScript()
{
	return null;
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
		<div
			class="ide-list"
		>
			{availableIDEs.map((ide, index) => <AvailableIDEItem key={index} ide={ide} index={index}
																													 isCurrent={ide.name === currentIDEName}
																													 isSource={ide.uuid === defaultSourceUuid} />)}
			{unavailableIDEs.map((ide, index) => <UnavailableIDEItem key={index} ide={ide} index={index} />)}
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
	const defaultSourceUuid = sourceIDEUuid ?? (availableIDEs.length > 0 ? availableIDEs[0].uuid : undefined);
	const sourceIDE = availableIDEs.find(ide => ide.uuid === defaultSourceUuid);
	const sourceIDEName = sourceIDE?.name;

	return (<>
		<div className="section">
			<h2>Select IDEs</h2>
			<IDEList availableIDEs={availableIDEs} unavailableIDEs={unavailableIDEs} currentIDEName={currentIDEName}
							 sourceIDEUuid={sourceIDEUuid} />
			{/* @ts-ignore */}
			<button className="btn" onclick={"addCustomIDE()"} style="margin-top: 10px;"
							title="Manually specify an IDE/settings folder">+ Add Custom IDE Path
			</button>
			{/* @ts-ignore */}
			<button className="btn secondary" onclick={"refreshIDEs()"} title="Refresh IDE list">🔄 Refresh</button>
		</div>
	</>);
}
