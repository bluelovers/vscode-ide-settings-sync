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

export function IDEListScript()
{
	const js = `
	/**
	 * 移除自訂 IDE
	 * Remove custom IDE
	 *
	 * @param params - 移除參數物件，包含 index, uuid, name, nativePath
	 */
	function removeCustomIDE(params)
	{
		vscode.postMessage({ command: 'removeCustomIDE', ...params });
	}

	function openIDEFolder(folderPath)
	{
		vscode.postMessage({ command: 'openIDEFolder', path: folderPath });
	}

	function openSettingsJson(idePath, ideName)
	{
		vscode.postMessage({ command: 'openSettingsJson', idePath, ideName });
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

	/**
	 * 處理來源 IDE 選擇變更
	 * 當使用者點擊 radio 按鈕選擇來源 IDE 時觸發
	 * 使用 UUID 而非 index，以確保持久化
	 */
	function handleSourceIDEChange(event)
	{
		const sourceUuid = event.target.value;
		const sourceName = event.target.dataset.name || event.target.closest('.ide-item')?.querySelector('.ide-checkbox')?.dataset.name;

		// 更新來源 IDE 指示器顯示
		const indicators = document.querySelectorAll('.source-ide-indicator .source-name');
		indicators.forEach((indicator) =>
		{
			if (indicator)
			{
				indicator.textContent = sourceName || 'Not selected';
			}
		});

		// 更新所有 IDE 項目的 source-ide 類別
		const allItems = document.querySelectorAll('.ide-item');
		allItems.forEach((item) =>
		{
			const checkbox = item.querySelector('.ide-checkbox');
			if (checkbox && checkbox.dataset.uuid === sourceUuid)
			{
				item.classList.add('source-ide');
			}
			else
			{
				item.classList.remove('source-ide');
			}
		});

		// 發送訊息到 VS Code 擴充套件（使用 UUID 而非 index）
		vscode.postMessage({ command: 'selectSourceIDE', uuid: sourceUuid, name: sourceName });
	}

	// 初始化來源 IDE radio 的事件監聽
	document.addEventListener('DOMContentLoaded', function()
	{
		const sourceRadios = document.querySelectorAll('.ide-source-radio');
		sourceRadios.forEach(radio =>
		{
			radio.addEventListener('change', handleSourceIDEChange);
		});
	});
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
	sourceIDEUuid,
}: IIDEListProps)
{
	// 計算預設來源 IDE UUID（如果未指定，則選擇第一個可用 IDE）
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
	// 計算預設來源 IDE UUID（如果未指定，則選擇第一個可用 IDE）
	const defaultSourceUuid = sourceIDEUuid ?? (availableIDEs.length > 0 ? availableIDEs[0].uuid : undefined);
	const sourceIDE = availableIDEs.find(ide => ide.uuid === defaultSourceUuid);
	const sourceIDEName = sourceIDE?.name;

	return (<>
		<IDEListScript />
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
