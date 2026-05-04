import { ExtensionContext } from 'vscode';
import { EnumGlobalStateName, ICustomIDEWithUuid, ILanguageConfig } from '../../types';
import { ITSPickExtra } from 'ts-type';

/**
 * 全域狀態：已選取的設定項目
 * Global state: Selected settings items
 */
export interface IGlobalStateSelectedSettings
{
	/** 全域狀態鍵值 / Global state key */
	key: EnumGlobalStateName.selectedSettings;
	/** 設定值內容：設定項目鍵值陣列 / Setting value: array of setting item keys */
	value: string[];
}

/**
 * 全域狀態：自訂 IDE 清單
 * Global state: Custom IDE list
 */
export interface IGlobalStateCustomIDEs
{
	/** 全域狀態鍵值 / Global state key */
	key: EnumGlobalStateName.customIDEs;
	/** 自訂 IDE 資訊（僅保留名稱與路徑）/ Custom IDE info (only name and path preserved) */
	value: ITSPickExtra<ICustomIDEWithUuid, 'name' | 'path'>[];
}

/**
 * 全域狀態：來源 IDE 的 UUID
 * Global state: Source IDE UUID
 */
export interface IGlobalStateSourceIDEUuid
{
	/** 全域狀態鍵值 / Global state key */
	key: EnumGlobalStateName.sourceIDEUuid;
	/** 來源 IDE 的唯一識別碼 / Source IDE unique identifier */
	value: string;
}

/**
 * 全域狀態：搜尋歷史紀錄
 * Global state: Search history record
 */
export interface IGlobalStateSearchHistory
{
	/** 全域狀態鍵值 / Global state key */
	key: EnumGlobalStateName.searchHistory;
	/** 搜尋歷史內容 / Search history content */
	value: string;
}

/**
 * 全域狀態：已選擇的 IDE 索引列表
 * Global state: Selected IDE indices list
 */
export interface IGlobalStateSelectedIDEs
{
	/** 全域狀態鍵值 / Global state key */
	key: EnumGlobalStateName.selectedIDEs;
	/** 設定值內容：IDE 索引陣列 / Setting value: array of IDE indices */
	value: number[];
}

/**
 * 全域狀態：語言配置
 * Global state: Language configuration
 */
export interface IGlobalStateLanguageConfig
{
	/** 全域狀態鍵值 / Global state key */
	key: EnumGlobalStateName.languageConfig;
	/** 語言配置內容 / Language configuration content */
	value: ILanguageConfig;
}

/**
 * 所有全域狀態類型的聯合
 * Union of all global state types
 */
export type IGlobalStateAll = IGlobalStateSelectedSettings | IGlobalStateCustomIDEs | IGlobalStateSourceIDEUuid | IGlobalStateSearchHistory | IGlobalStateSelectedIDEs | IGlobalStateLanguageConfig;

/**
 * VS Code 擴充全域狀態封裝類別
 * VS Code extension global state wrapper class
 *
 * 封裝 ExtensionContext.globalState 以提供型別安全的讀寫操作
 * Wraps ExtensionContext.globalState to provide type-safe read/write operations
 */
export class VscodeExtensionContextGlobalState
{
	/**
	 * 建構子：初始化全域狀態參考
	 * Constructor: Initialize global state reference
	 *
	 * @param globalState - VS Code 擴充上下文的全域狀態物件 / VS Code extension context global state object
	 */
	constructor(protected globalState: ExtensionContext["globalState"])
	{

	}

	/**
	 * 獲取全域狀態值（含預設值，必定返回值）
	 * Get global state value (with default value, always returns value)
	 *
	 * @param key - 全域狀態鍵值 / Global state key
	 * @param defaultValue - 預設值，當鍵值不存在時使用 / Default value used when key doesn't exist
	 * @returns 全域狀態值 / Global state value
	 */
	get<K extends EnumGlobalStateName, T extends Extract<IGlobalStateAll, {
		key: K
	}>>(key: K, defaultValue: T["value"]): T["value"]

	/**
	 * 獲取全域狀態值（預設值可選，可能返回 undefined）
	 * Get global state value (default value optional, may return undefined)
	 *
	 * @param key - 全域狀態鍵值 / Global state key
	 * @param defaultValue - 可選預設值 / Optional default value
	 * @returns 全域狀態值或 undefined / Global state value or undefined
	 */
	get<K extends EnumGlobalStateName, T extends Extract<IGlobalStateAll, {
		key: K
	}>>(key: K, defaultValue?: T["value"]): T["value"] | undefined

	/**
	 * 獲取全域狀態值（透過數值類型推斷）
	 * Get global state value (infer by value type)
	 *
	 * @param key - 對應的狀態鍵值 / Corresponding state key
	 * @param defaultValue - 預設值 / Default value
	 * @returns 狀態值 / State value
	 */
	get<V extends IGlobalStateAll["value"], T extends Extract<IGlobalStateAll, {
		value: V
	}>>(key: T["key"], defaultValue: V): V

	/**
	 * 獲取全域狀態值（透過數值類型推斷，可選預設值）
	 * Get global state value (infer by value type, optional default)
	 *
	 * @param key - 對應的狀態鍵值 / Corresponding state key
	 * @param defaultValue - 可選預設值 / Optional default value
	 * @returns 狀態值或 undefined / State value or undefined
	 */
	get<V extends IGlobalStateAll["value"], T extends Extract<IGlobalStateAll, {
		value: V
	}>>(key: T["key"], defaultValue?: V): V | undefined

	/**
	 * 獲取全域狀態值（同時指定鍵類型與數值類型）
	 * Get global state value (specify both key type and value type)
	 *
	 * @param key - 全域狀態鍵值 / Global state key
	 * @param defaultValue - 預設值 / Default value
	 * @returns 全域狀態值 / Global state value
	 */
	get<K extends EnumGlobalStateName, V extends IGlobalStateAll["value"], T extends Extract<IGlobalStateAll, {
		key: K;
		value: V
	}>>(key: K, defaultValue: V): T["value"]

	/**
	 * 獲取全域狀態值（同時指定鍵類型與數值類型，可選預設值）
	 * Get global state value (specify both key and value types, optional default)
	 *
	 * @param key - 全域狀態鍵值 / Global state key
	 * @param defaultValue - 可選預設值 / Optional default value
	 * @returns 全域狀態值或 undefined / Global state value or undefined
	 */
	get<K extends EnumGlobalStateName, V extends IGlobalStateAll["value"], T extends Extract<IGlobalStateAll, {
		key: K;
		value: V
	}>>(key: K, defaultValue?: V): T["value"] | undefined

	/**
	 * 獲取全域狀態值（透過泛型類型推斷）
	 * Get global state value (infer by generic type)
	 *
	 * @param key - 狀態鍵值 / State key
	 * @param defaultValue - 預設值 / Default value
	 * @returns 推斷後的狀態值 / Inferred state value
	 */
	get<T extends IGlobalStateAll, K extends T["key"]>(key: K, defaultValue: Extract<T, {
		key: K
	}>["value"]): Extract<T, {
		key: K
	}>["value"]

	/**
	 * 獲取全域狀態值（透過泛型類型推斷，可選預設值）
	 * Get global state value (infer by generic type, optional default)
	 *
	 * @param key - 狀態鍵值 / State key
	 * @param defaultValue - 可選預設值 / Optional default value
	 * @returns 推斷後的狀態值或 undefined / Inferred state value or undefined
	 */
	get<T extends IGlobalStateAll, K extends T["key"]>(key: K, defaultValue?: Extract<T, {
		key: K
	}>["value"]): Extract<T, {
		key: K
	}>["value"] | undefined

	/**
	 * 通用方法：獲取任意類型的全域狀態值
	 * Generic method: Get global state value of any type
	 *
	 * 直接使用 VS Code 的 globalState.get 方法，支援序列化與反序列化
	 * Directly uses VS Code's globalState.get method, supports serialization/deserialization
	 *
	 * @param key - 儲存鍵值 / Storage key
	 * @param defaultValue - 可選預設值 / Optional default value
	 * @returns 儲存的值或 undefined / Stored value or undefined
	 */
	get<T>(key: string, defaultValue?: T): T | undefined
	{
		return this.globalState.get(key, defaultValue);
	}

		/**
	 * 更新全域狀態值（透過鍵類型推斷）
	 * Update global state value (infer by key type)
	 *
	 * 使用強類型推斷確保鍵值類型匹配，避免類型錯誤
	 * Uses strong type inference to ensure key-value type matching, preventing type errors
	 *
	 * @param key - 全域狀態鍵值 / Global state key
	 * @param value - 要設定的狀態值 / State value to set
	 * @returns Thenable<void> / Thenable<void>
	 */
	update<K extends EnumGlobalStateName, T extends Extract<IGlobalStateAll, {
		key: NoInfer<K>
	}>>(key: K, value: T["value"]): Thenable<void>

	/**
	 * 更新全域狀態值（透過值類型推斷）
	 * Update global state value (infer by value type)
	 *
	 * 根據值類型推斷對應的鍵值，確保類型安全
	 * Infers key type from value type to ensure type safety
	 *
	 * @param key - 對應該值類型的鍵值 / Key corresponding to the value type
	 * @param value - 要設定的狀態值 / State value to set
	 * @returns Thenable<void> / Thenable<void>
	 */
	update<V extends IGlobalStateAll["value"], T extends Extract<IGlobalStateAll, {
		value: V
	}>>(key: T["key"], value: V): Thenable<void>

	/**
	 * 更新全域狀態值（泛型類型）
	 * Update global state value (generic type)
	 *
	 * 直接使用泛型類型 T 確保鍵值類型一致
	 * Directly uses generic type T to ensure key-value type consistency
	 *
	 * @param key - 全域狀態鍵值 / Global state key
	 * @param value - 要設定的狀態值 / State value to set
	 * @returns Thenable<void> / Thenable<void>
	 */
	update<T extends IGlobalStateAll>(key: T["key"], value: T["value"]): Thenable<void>

	/**
	 * 通用更新全域狀態值（任意類型）
	 * Generic update global state value (any type)
	 *
	 * 直接使用 VS Code 的 globalState.update 方法，支援序列化
	 * Directly uses VS Code's globalState.update method, supports serialization
	 *
	 * @param key - 儲存鍵值 / Storage key
	 * @param value - 要儲存的值 / Value to store
	 * @returns Thenable<void> / Thenable<void>
	 */
	update<T>(key: string, value: T): Thenable<void>
	{
		return this.globalState.update(key, value);
	}
}

/**
 * 手動初始化 VscodeExtensionContextGlobalState 的抽象基類
 * Abstract base class for manual initialization of VscodeExtensionContextGlobalState
 */
export abstract class AbstractClassWithGlobalState
{
	/** 全域狀態實例 / Global state instance */
	protected globalState!: VscodeExtensionContextGlobalState;
}

/**
 * 自動由 ExtensionContext 初始化 VscodeExtensionContextGlobalState 的抽象基類
 * Abstract base class that auto-initializes VscodeExtensionContextGlobalState from ExtensionContext
 *
 * 懶人加載模式：僅在首次存取時才建立實例
 * Lazy loading pattern: instance is created only on first access
 */
export abstract class AbstractClassWithContextGlobalState
{
	/** VS Code 擴充上下文 / VS Code extension context */
	protected context!: ExtensionContext;
	/** 私有全域狀態實例（懶人初始化）/ Private global state instance (lazy initialization) */
	#globalState!: VscodeExtensionContextGlobalState;

	/**
	 * 取得全域狀態實例（懶人初始化）
	 * Get global state instance (lazy initialization)
	 *
	 * 若尚未初始化，則透過 ExtensionContext 建立新實例
	 * If not yet initialized, creates a new instance via ExtensionContext
	 */
	protected get globalState(): VscodeExtensionContextGlobalState
	{
		if (!this.#globalState)
		{
			this.#globalState = new VscodeExtensionContextGlobalState(this.context.globalState);
		}

		return this.#globalState;
	}
}

/**
 * 透過 ExtensionContext 建立全域狀態實例
 * Create global state instance from ExtensionContext
 *
 * 從 context.globalState 取得原始狀態物件並封裝
 * Gets raw state object from context.globalState and wraps it
 *
 * @param context - VS Code 擴充上下文 / VS Code extension context
 * @returns 封裝後的全域狀態實例 / Wrapped global state instance
 */
export function newVscodeExtensionContextGlobalStateByContext(context: ExtensionContext)
{
	return new VscodeExtensionContextGlobalState(context.globalState);
}

/**
 * 直接透過全域狀態物件建立實例
 * Directly create instance from global state object
 *
 * 適用於已持有 globalState 參考的情況，避免重複封裝
 * Use when already holding a globalState reference to avoid re-wrapping
 *
 * @param globalState - VS Code 全域狀態物件 / VS Code global state object
 * @returns 封裝後的全域狀態實例 / Wrapped global state instance
 */
export function newVscodeExtensionContextGlobalState(globalState: ExtensionContext["globalState"])
{
	return new VscodeExtensionContextGlobalState(globalState);
}
