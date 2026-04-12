import { ITSRequireAtLeastOne } from 'ts-type';
import { WebviewPanel } from 'vscode';
import { SettingsSyncPanel } from '../settingsSyncPanel';

/**
 * Content Security Policy 元件屬性類型
 * 使用 ITSRequireAtLeastOne 確保至少提供 panel 或 cspSource 其中之一
 *
 * 設計考量：
 * - panel: 用於從 WebviewPanel 實例動態取得 cspSource
 * - cspSource: 直接用於傳入已知的 CSP 來源字串
 * 這種設計提供靈活性，支援測試情境和生產環境的不同使用方式
 */
export type IContentSecurityPolicyProps = ITSRequireAtLeastOne<{
	/** WebviewPanel 實例，可從中取得 webview.cspSource */
	panel: WebviewPanel;
	/** CSP 來源字串，直接使用於策略配置 */
	cspSource: string;
}>;

/**
 * Settings Sync 面板頁面屬性介面
 * 定義渲染 Webview 頁面所需的完整屬性集合
 */
export interface ISettingsSyncPanelPageProps
{
	/** SettingsSyncPanel 實例，提供面板操作和狀態存取能力 */
	settingsSyncPanel: SettingsSyncPanel;
	/** 編譯後的 CSS 內容字串，將直接注入頁面 style 標籤 */
	cssContent: string;
}

/**
 * Settings Sync 面板頁面執行時屬性類型
 * 使用 Partial 使所有屬性成為可選，支援漸進式初始化
 * 主要用於組件渲染時的屬性傳遞，允許部分屬性在初始階段未定義
 */
export type ISettingsSyncPanelPagePropsRuntime = Partial<ISettingsSyncPanelPageProps>;

/**
 * IDE 資訊（用於 Webview 渲染）
 * 精簡版的 IDE 資訊，用於傳遞給前端組件
 */
export interface IIDEInfoWebview
{
	/** IDE 唯一識別符 */
	uuid: string;
	/** IDE 顯示名稱 */
	name: string;
	/** IDE 類型（已知或自訂） */
	type: string;
	/** IDE 的實際資料夾路徑 */
	nativePath: string;
	/** IDE 設定值 */
	settings?: Record<string, any>;
}

/**
 * 不可用的 IDE 資訊（用於 Webview 渲染）
 */
export interface IUnavailableIDEInfoWebview
{
	/** IDE 顯示名稱 */
	name: string;
	/** IDE 類型 */
	type: string;
	/** 預期路徑 */
	expectedPath: string;
	/** 不可用原因 */
	reason?: string;
}

/**
 * IDE 列表組件屬性
 */
export interface IIDEListProps
{
	/** 可用的 IDE 列表 */
	availableIDEs: IIDEInfoWebview[];
	/** 不可用的 IDE 列表 */
	unavailableIDEs: IUnavailableIDEInfoWebview[];
	/** 當前 IDE 名稱 */
	currentIDEName: string;
}

/**
 * 移除自訂 IDE 的參數物件
 * 用於統一傳遞刪除 IDE 所需的資訊
 */
export interface IRemoveCustomIDEParams
{
	/** IDE 索引 */
	index: number;
	/** IDE 唯一識別符 */
	uuid: string;
	/** IDE 顯示名稱 */
	name: string;
	/** IDE 實際資料夾路徑 */
	nativePath: string;
}
