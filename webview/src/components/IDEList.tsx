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

/**
 * 可用 IDE 列表項目組件
 * Available IDE list item component
 *
 * 渲染單一可用 IDE 項目，包含來源選擇單選鈕、設定勾選框、
 * 開啟資料夾按鈕、開啟設定檔按鈕以及自訂 IDE 的刪除按鈕。
 *
 * Renders a single available IDE item, including source selection radio, settings checkbox,
 * open folder button, open settings button, and remove button for custom IDEs.
 *
 * @param props.ide - IDE 資訊物件 / IDE information object
 * @param props.index - IDE 在列表中的索引 / IDE index in the list
 * @param props.isCurrent - 是否為當前執行此擴充的 IDE / Whether this is the IDE currently running the extension
 * @param props.isSource - 是否為選取的同步來源 IDE / Whether this is the selected sync source IDE
 */
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
				{props.ide.type === 'backup' ? <span className="badge badge-backup" title="Built-in backup IDE (used to back up settings via sync)">Backup</span> : null}
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
 *
 * 將移除所需的參數序列化為 JSON 字串，透過 onclick 傳遞給 window 掛載的函數。
 * 使用 `JSON.stringify` 確保參數能正確嵌入 onclick 字串中。
 *
 * Serializes removal parameters to JSON string, passed to window-mounted function via onclick.
 * Uses `JSON.stringify` to ensure parameters are correctly embedded in onclick string.
 *
 * @param props.ide - IDE 資訊物件 / IDE information object
 * @param props.index - IDE 在列表中的索引 / IDE index in the list
 */
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

/**
 * 開啟 IDE 資料夾按鈕組件
 * Open IDE folder button component
 *
 * 透過 onclick 字串呼叫 window 掛載的函數，開啟 IDE 設定資料夾。
 * 使用 `JSON.stringify` 確保路徑字串能正確嵌入 onclick 字串。
 *
 * Calls window-mounted function via onclick string to open the IDE settings folder.
 * Uses `JSON.stringify` to ensure path string is correctly embedded in onclick string.
 *
 * @param props.path - IDE 設定資料夾路徑 / IDE settings folder path
 */
function BtnOpenIDEFolder(props: { path: string })
{
	// @ts-ignore
	return (<button className="btn btn-small" onclick={`openIDEFolder && openIDEFolder(${JSON.stringify(props.path)})`} title="Open IDE folder">📂</button>);
}

/**
 * 開啟設定 JSON 檔案按鈕元件
 * Open settings.json file button component
 *
 * 透過 onclick 字串呼叫 window 掛載的函數，在編輯器中開啟該 IDE 的設定檔。
 * 使用 `JSON.stringify` 確保路徑與名稱能正確嵌入 onclick 字串。
 *
 * Calls window-mounted function via onclick string to open the IDE's settings file in editor.
 * Uses `JSON.stringify` to ensure path and name are correctly embedded in onclick string.
 *
 * @param props.idePath - IDE 設定資料夾路徑 / IDE settings folder path
 * @param props.ideName - IDE 顯示名稱 / IDE display name
 */
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
		<div key={props.index} className="ide-item unavailable" title={`Not detected: ${props.ide.expectedPath || 'Path not set'}`}>
			<input type="radio" className={EnumCssClassSelector.ideSourceRadio} disabled title="Cannot select unavailable IDE as source" />
			<input type="checkbox" id={id} className={EnumCssClassSelector.ideCheckbox} disabled />
			<label htmlFor={id}><strong>{props.ide.name}</strong></label>
			<span className="ide-path">❌ Not detected: {props.ide.expectedPath || 'Path not set'}</span>
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

/**
 * 內建備份 IDE 路徑設定區塊
 * Built-in backup IDE path configuration block
 *
 * 顯示可編輯的備份路徑輸入框，按下 Apply 後透過 window 掛載的
 * setBackupIDEPath 函數將新路徑發送至 Extension host，並更新備份 IDE 的路徑。
 *
 * Renders an editable backup path input; clicking Apply sends the new path
 * to the Extension host via the window-mounted setBackupIDEPath function,
 * updating the backup IDE's path.
 */
function BackupIDEConfig(props: { backupIDEPath?: string })
{
	return (<>
		<div className="backup-ide-config">
			<label htmlFor="backup-ide-path" className="backup-ide-label">
				Backup IDE Path
			</label>
			<span className="backup-ide-hint">Use the sync feature to back up settings to this folder (must contain settings.json)</span>
			<div className="backup-ide-row">
				{/* @ts-ignore */}
				<input
					id="backup-ide-path"
					type="text"
					className="backup-ide-input"
					value={props.backupIDEPath ?? ''}
					placeholder="e.g. D:\IDE-Settings-Backup\User"
				/>
				<button
					className="btn btn-small"
					// @ts-ignore
					onclick="setBackupIDEPath && setBackupIDEPath(document.getElementById('backup-ide-path').value)"
					title="Apply backup IDE path"
				>
					Apply
				</button>
			</div>
		</div>
	</>);
}

export function IDEListSection({
	availableIDEs,
	unavailableIDEs,
	currentIDEName,
	sourceIDEUuid,
	backupIDEPath,
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
			<BackupIDEConfig backupIDEPath={backupIDEPath} />
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
