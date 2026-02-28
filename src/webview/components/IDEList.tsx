import { h, Fragment } from 'preact';
import { formatPath } from '../../utils/formatPath';
import { IIDEListProps } from './types';
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
 * @returns HTML 字串
 */
function AvailableIDEItem(props: {
	ide: { name: string; type: string; nativePath: string },
	index: number,
	isCurrent: boolean
})
{
	const className = `ide-item available${props.isCurrent ? ' current' : ''}`;
	// const escapedPath = escapeSingleQuote(ide.nativePath);
	// const removeButton =
	// 	ide.type === 'custom'
	// 		? `<button class="btn btn-small btn-remove" onclick="removeCustomIDE(${index})" title="Remove this custom IDE">Remove</button>`
	// 		: '';

	const id = `ide-${props.index}`;

	return (<>
		<div key={props.index} className={className}>
			<input type="checkbox" id={id} className="ide-checkbox" data-index={props.index} data-name={props.ide.name} />
			<label htmlFor={id}><strong>{props.ide.name}</strong></label>
			<span className="ide-path" title={props.ide.nativePath}>{formatPath(props.ide.nativePath)}</span>
			<BtnOpenIDEFolder path={props.ide.nativePath} />
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

function BtnRemoveCustomIDE(props: {
	index: number,
	ide: Pick<IIDEInfo, 'name'>,
})
{

	return (<button class="btn btn-small btn-remove"
		// @ts-ignore
		              onclick={`removeCustomIDE(${props.index}, ${JSON.stringify(props.ide.name)})`}
		              title="Remove this custom IDE">Remove</button>)
}

function BtnOpenIDEFolder(props: {
	path: string,
})
{
	// @ts-ignore
	return (<button class="btn btn-small" onclick={`openIDEFolder(${JSON.stringify(props.path)})`}
	                title="Open IDE folder">📂</button>)
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
			<input type="checkbox" id={id} className="ide-checkbox" disabled />
			<label htmlFor={id}><strong>{props.ide.name}</strong></label>
			<span className="ide-path">❌ Not detected: {props.ide.expectedPath}</span>
			<BtnOpenIDEFolder path={props.ide.expectedPath} />
		</div>
		<UnavailableIDEItemReason reason={props.ide.reason} ide={props.ide} />
	</>)
}

export function IDEListScript()
{
	const js = `
	function removeCustomIDE(index, name)
	{
		if (confirm('Remove this custom IDE?'))
		{
			vscode.postMessage({ command: 'removeCustomIDE', index, name });
		}
	}

	function openIDEFolder(folderPath)
	{
		vscode.postMessage({ command: 'openIDEFolder', path: folderPath });
	}

	function addCustomIDE()
	{
		// 使用 VS Code 的輸入框來取得路徑和名稱
		// Use VS Code's input box to get path and name
		vscode.postMessage({ command: 'requestAddCustomIDE' });
	}

	/**
	 * Ask the extension to re-scan the system for IDE installations.
	 * This will update the IDE list itself and then rebuild the webview.
	 * 請求擴充套件重新掃描 IDE 安裝，更新 IDE 列表並重建視窗。
	 *
	 * @jsdoc
	 */
	function refreshIDEs()
	{
		vscode.postMessage({ command: 'refreshIDEs' });
	}
	`;

	return (<script dangerouslySetInnerHTML={{ __html: js }} />)
}

/**
 * IDE 列表組件
 * 渲染可用和不可用的 IDE 列表
 *
 * 設計說明：
 * 由於需要使用原生 HTML onclick 屬性來呼叫全局 JavaScript 函數，
 * 內部使用 HTML 字串拼接而非 JSX，以確保正確的屬性輸出。
 *
 * @param props - IDE 列表屬性
 * @returns 渲染的 IDE 列表容器
 */
export function IDEList({
	availableIDEs,
	unavailableIDEs,
	currentIDEName,
}: IIDEListProps)
{
	return (<>
		<div
			class="ide-list"
		>
			{availableIDEs.map((ide, index) => <AvailableIDEItem key={index} ide={ide} index={index}
			                                                     isCurrent={ide.name === currentIDEName} />)}
			{unavailableIDEs.map((ide, index) => <UnavailableIDEItem key={index} ide={ide} index={index} />)}
		</div>
	</>);
}

export function IDEListSection({
	availableIDEs,
	unavailableIDEs,
	currentIDEName,
}: IIDEListProps)
{
	return (<>
		<IDEListScript />
		<div className="section">
			<h2>Select IDEs</h2>
			<IDEList availableIDEs={availableIDEs} unavailableIDEs={unavailableIDEs} currentIDEName={currentIDEName} />
			{/* @ts-ignore */}
			<button className="btn" onclick={"addCustomIDE()"} style="margin-top: 10px;"
			        title="Manually specify an IDE/settings folder">+ Add Custom IDE Path
			</button>
			{/* @ts-ignore */}
			<button className="btn secondary" onclick={"refreshIDEs()"} title="Refresh IDE list">🔄 Refresh</button>
		</div>
	</>);
}
