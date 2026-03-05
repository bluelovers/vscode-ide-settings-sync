import { existsSync, readFileSync, writeFileSync } from "fs";
import { IStagingInput, JsonHandler } from "../utils/json";
import { JSONPath as IJSONPath } from "jsonc-parser";

/**
 * IDE 設定提供者 / IDE Settings Provider
 *
 * 負責載入、儲存及管理 IDE 設定檔案的類別。
 * Manages loading, saving, and manipulating IDE configuration files.
 *
 * 支援鏈式呼叫 (Fluent API)，多数方法會回傳 this 以便連續操作。
 * Supports method chaining (Fluent API), most methods return `this` for consecutive operations.
 */
export class IdeSettingProvider
{
	// @ts-ignore
	protected jsonHandler: JsonHandler;
	protected _loaded: boolean = false;

	/**
	 * 建構子
	 * @param settingsJsonPath - settings.json 的完整路徑
	 * @param settingsPath - （選填）settings 資料夾的路徑，用於顯示/記錄
	 */
	constructor(protected settingsJsonPath: string, protected settingsPath?: string)
	{

	}

	/**
	 * 檢查設定檔是否存在 / Check if settings file exists
	 *
	 * @returns {boolean} 檔案存在返回 true / Returns true if file exists
	 */
	checkExists()
	{
		return existsSync(this.settingsJsonPath);
	}

	/**
	 * 讀取設定檔的原始內容 / Read raw content of settings file
	 *
	 * @returns {string} 檔案的原始文字內容 / Raw text content of the file
	 */
	readSettingsRaw()
	{
		return readFileSync(this.settingsJsonPath, 'utf-8');
	}

	/**
	 * 核心載入邏輯 / Core loading logic
	 *
	 * 根據原始文字內容建立新的 JsonHandler 實例。
	 * Creates a new JsonHandler instance from raw text content.
	 *
	 * @param {string} originalText - 原始 JSON 文字 / Raw JSON text
	 * @param {IStagingInput} [staging] - 可選的暂存輸入 / Optional staging input
	 * @returns {JsonHandler} 新建立的 JsonHandler 實例 / Newly created JsonHandler instance
	 */
	protected _loadCore(originalText: string, staging?: IStagingInput)
	{
		let jsonHandler = new JsonHandler(originalText, {
			staging,
		});

		return jsonHandler
	}

	/**
	 * 檢查設定是否已載入 / Check if settings have been loaded
	 *
	 * @returns {boolean} 已載入返回 true / Returns true if loaded
	 */
	loaded()
	{
		return this._loaded
	}

	/**
	 * 載入設定檔 / Load settings file
	 *
	 * 從指定的 JSON 檔案路徑讀取並解析設定內容。
	 * Reads and parses settings from the specified JSON file path.
	 *
	 * @param {boolean} [reload=false] - 是否強制重新載入 / Whether to force reload
	 * @returns {this} 回傳此實例本身，以支援鏈式呼叫 / Returns this instance for method chaining
	 */
	load(reload?: boolean)
	{
		// 需要重新載入或尚未載入時 / When reload is needed or not yet loaded
		if (reload || !this._loaded)
		{
			// 檢查檔案是否存在 / Check if file exists
			if (!this.checkExists())
			{
				throw new Error(`✗ 沒有找到 ${this.settingsJsonPath} 的設定檔案`);
			}

			// 重置載入狀態 / Reset loaded state
			this._loaded = false;
			// @ts-ignore
			this.jsonHandler = null;

			// 使用原始內容建立新的 Handler / Create new handler with raw content
			const jsonHandler = this._loadCore(this.readSettingsRaw());

			// 檢查是否有解析錯誤 / Check for parsing errors
			const errors = jsonHandler.getErrors();

			if (errors.length)
			{
				throw new AggregateError(errors, `✗ 無法讀取或解析 ${this.settingsJsonPath} 的設定檔案`);
			}

			// 更新狀態 / Update state
			this.jsonHandler = jsonHandler;
			this._loaded = true;
		}
		// 回傳 this 以支援鏈式呼叫 / Return this for method chaining
		return this;
	}

	/**
	 * 儲存設定檔 / Save settings file
	 *
	 * 將暂存的變更寫入檔案，並重新載入以更新內部狀態。
	 * Writes staged changes to file and reloads to update internal state.
	 *
	 * 注意：儲存後 this.jsonHandler 會被更新為新的物件，並清除變更狀態。
	 * Note: After save, this.jsonHandler will be updated to a new object and change status will be cleared.
	 *
	 * @returns {this} 回傳此實例本身，以支援鏈式呼叫 / Returns this instance for method chaining
	 */
	save()
	{
		// 檢查是否有暂存的變更 / Check if there are staged changes
		if (this.jsonHandler?.isStagedChanged())
		{
			// 取得暂存的變更 / Get staged changes
			const staging = this.jsonHandler.getStagedChanges();

			// 重新讀取原始檔案以確保最新狀態 / Re-read raw file to ensure latest state
			const freshHandler = this._loadCore(this.readSettingsRaw(), staging);
			// freshHandler.overwriteStaged(staging);

			// 將更新後的內容寫入檔案 / Write updated content to file
			const out = freshHandler.stringify();
			writeFileSync(this.settingsJsonPath, out, 'utf-8');

			// 重新載入以更新內部狀態 / Reload to update internal state
			// 此時 this.jsonHandler 會被更新為新的物件，且變更狀態會被清除
			// At this point this.jsonHandler will be updated to a new object and change status will be cleared
			this.jsonHandler = this._loadCore(out);
			this._loaded = true;
		}

		// 回傳 this 以支援鏈式呼叫 / Return this for method chaining
		return this;
	}

	/**
	 * 取得設定檔的 JavaScript 物件表示 / Get JavaScript object representation of settings
	 *
	 * @returns {any} 設定檔的物件值 / Object value of settings
	 */
	valueOf(): Record<string, any>
	{
		return this.jsonHandler?.valueOf();
	}

	/**
	 * 取得設定檔的原始文字 / Get raw text of settings file
	 *
	 * @returns {string} 原始文字內容 / Raw text content
	 */
	getSourceText()
	{
		return this.jsonHandler?.getSourceText();
	}

	/**
	 * 檢查是否有暂存的變更 / Check if there are staged changes
	 *
	 * @returns {boolean} 有變更返回 true / Returns true if there are changes
	 */
	isStagedChanged()
	{
		return this.jsonHandler?.getStagedChanges().size > 0;
	}

	/**
	 * 取得指定路徑的值 / Get value at specified path
	 *
	 * @param {IJSONPath} path - JSON 路徑 / JSON path
	 * @returns {T} 該路徑的值，若不存在則回傳 undefined / Value at path, or undefined if not exists
	 */
	get<T = any>(path: IJSONPath): T
	{
		return this.jsonHandler.get(path);
	}

	/**
	 * 設定指定路徑的值 / Set value at specified path
	 *
	 * 在設定檔中設定指定路徑的值，並將變更暂存起來。
	 * Sets the value at the specified path in the settings file and stages the change.
	 *
	 * @param {IJSONPath} path - JSON 路徑 / JSON path
	 * @param {T} value - 要設定的值 / Value to set
	 * @returns {this} 回傳此實例本身，以支援鏈式呼叫 / Returns this instance for method chaining
	 */
	set<T = any>(path: IJSONPath, value: T)
	{
		this.jsonHandler.set(path, value);
		return this;
	}

	/**
	 * 刪除指定路徑的值 / Delete value at specified path
	 *
	 * @param {IJSONPath} path - JSON 路徑 / JSON path
	 * @returns {boolean} 刪除成功返回 true / Returns true if deletion was successful
	 */
	delete(path: IJSONPath): boolean
	{
		return this.jsonHandler.delete(path);
	}

}
