/**
 * Webview 組件共用型別定義
 * Webview component shared type definitions
 *
 * 此檔案不得 import 任何 VS Code 或 Node.js 相依模組。
 * This file must NOT import any VS Code or Node.js dependent modules.
 */

import { IIDEInfoWebview, IUnavailableIDEInfoWebview } from '../types';

/**
 * IDE 列表組件的 Props 介面
 * Props interface for the IDE list component
 *
 * 定義 IDE 列表組件所需的屬性結構，確保型別安全與跨組件的一致性。
 * Defines the property structure required by the IDE list component, ensuring type safety and cross-component consistency.
 */
export interface IIDEListProps
{
	/** 可用的 IDE 列表 / List of available IDEs */
	availableIDEs: IIDEInfoWebview[];
	/** 不可用的 IDE 列表（已知但未偵測到）/ List of unavailable IDEs (known but not detected) */
	unavailableIDEs: IUnavailableIDEInfoWebview[];
	/** 當前執行此擴充功能的 IDE 名稱 / Name of the IDE currently running this extension */
	currentIDEName: string;
	/** 使用者選擇的來源 IDE UUID（用於同步來源選擇，具持久化）/ UUID of the user-selected source IDE (for sync source selection, with persistence) */
	sourceIDEUuid?: string;
}

/**
 * 移除自訂 IDE 的參數物件介面
 * Params object interface for removing a custom IDE
 *
 * 用於統一傳遞刪除 IDE 所需的資訊給 onclick 字串屬性。
 * Used to uniformly pass the information needed to delete an IDE to onclick string attributes.
 */
export interface IRemoveCustomIDEParams
{
	/** IDE 在列表中的索引 / IDE index in the list */
	index: number;
	/** IDE 唯一識別符 / IDE unique identifier */
	uuid: string;
	/** IDE 顯示名稱 / IDE display name */
	name: string;
	/** IDE 設定資料夾的實際路徑 / Actual path to the IDE settings folder */
	nativePath: string;
}
