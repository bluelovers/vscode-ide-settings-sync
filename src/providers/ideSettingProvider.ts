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
	/** JSON 處理器實例，用於讀取/修改/寫入設定檔 / JSON handler instance for reading/modifying/writing settings file */
	// @ts-ignore
	protected jsonHandler: JsonHandler;
	/** 標記設定是否已載入完成 / Flag indicating whether settings have been loaded */
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
		/**
		 * 需要重新載入或尚未載入時才執行載入邏輯
		 * Only execute loading logic when reload is needed or not yet loaded
		 * 這樣可以避免重複載入已經載入過的設定，提升效能
		 * This avoids reloading already-loaded settings, improving performance
		 */
		if (reload || !this._loaded)
		{
			/**
			 * 檢查設定檔案是否存在，不存在則無法繼續載入
			 * Check if settings file exists; cannot proceed without it
			 * 設定檔案是必要的前置條件，不存在時應該明確拋出錯誤
			 * Settings file is a required prerequisite; throw clear error if missing
			 */
			if (!this.checkExists())
			{
				throw new Error(`✗ 沒有找到 ${this.settingsJsonPath} 的設定檔案`);
			}

			/**
			 * 重置載入狀態，確保接下來的載入過程是從乾淨狀態開始
			 * Reset loaded state to ensure the loading process starts from a clean state
			 * 避免在載入失敗後仍保留舊的載入狀態標記
			 * Prevents retaining old loaded state flags after a failed load
			 */
			this._loaded = false;
			// @ts-ignore
			this.jsonHandler = null;

			/**
			 * 使用設定檔案的原始文字內容建立新的 JSON 處理器
			 * Create a new JSON handler using raw text content from settings file
			 * 每次載入都建立新的實例，確保狀態隔離
			 * Each load creates a new instance to ensure state isolation
			 */
			const jsonHandler = this._loadCore(this.readSettingsRaw());

			/**
			 * 檢查 JSON 解析過程是否有錯誤
			 * Check for errors during JSON parsing
			 * 有錯誤時應該拋出聚合錯誤，讓呼叫者知道具體問題
			 * Throw aggregate error on parsing failure so caller knows the specific issues
			 */
			const errors = jsonHandler.getErrors();

			if (errors.length)
			{
				throw new AggregateError(errors, `✗ 無法讀取或解析 ${this.settingsJsonPath} 的設定檔案`);
			}

			/**
			 * 更新內部狀態：儲存處理器實例並標記為已載入
			 * Update internal state: store handler instance and mark as loaded
			 * 這樣後續的操作（如 get/set）才能正常運作
			 * Subsequent operations (get/set) depend on this state being set correctly
			 */
			this.jsonHandler = jsonHandler;
			this._loaded = true;
		}
		/**
		 * 回傳 this 以支援鏈式呼叫（Fluent API 模式）
		 * Return this to support method chaining (Fluent API pattern)
		 * 讓使用者可以連續呼叫多個方法，例如：provider.load().set(...).save()
		 * Allows users to chain multiple method calls, e.g., provider.load().set(...).save()
		 */
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
		/**
		 * 檢查是否有暫存的變更需要寫入檔案
		 * Check if there are staged changes that need to be written to file
		 * 只有在有變更時才執行寫入操作，避免不必要的檔案 I/O
		 * Only perform write operations when there are changes, avoiding unnecessary file I/O
		 */
		if (this.jsonHandler?.isStagedChanged())
		{
			/**
			 * 取得暫存的變更內容
			 * Get staged changes content
			 * 這些變更是透過 set() 方法累積但尚未寫入檔案的修改
			 * These changes are modifications accumulated via set() but not yet written to file
			 */
			const staging = this.jsonHandler.getStagedChanges();

			/**
			 * 重新讀取原始檔案並套用暫存的變更
			 * Re-read raw file and apply staged changes
			 * 這樣可以確保我們基於最新的檔案狀態進行修改，避免覆蓋其他進程的變更
			 * Ensures we modify based on the latest file state, avoiding overwriting changes from other processes
			 */
			const freshHandler = this._loadCore(this.readSettingsRaw(), staging);
			// freshHandler.overwriteStaged(staging);

			/**
			 * 將更新後的內容序列化為 JSON 字串並寫入檔案
			 * Serialize updated content to JSON string and write to file
			 * stringify() 會將記憶體中的 JSON 結構轉換為可寫入的格式
			 * stringify() converts in-memory JSON structure to writable format
			 */
			const out = freshHandler.stringify();
			writeFileSync(this.settingsJsonPath, out, 'utf-8');

			/**
			 * 重新載入以更新內部狀態
			 * Reload to update internal state
			 * 此時 this.jsonHandler 會被更新為新的物件，且變更狀態會被清除
			 * At this point this.jsonHandler will be updated to a new object and change status will be cleared
			 * 這樣可以確保後續的讀取操作能拿到最新的資料
			 * Ensures subsequent read operations get the latest data
			 */
			this.jsonHandler = this._loadCore(out);
			this._loaded = true;
		}

		/**
		 * 回傳 this 以支援鏈式呼叫（Fluent API 模式）
		 * Return this to support method chaining (Fluent API pattern)
		 * 讓使用者可以連續呼叫多個方法，例如：provider.load().set(...).save()
		 * Allows users to chain multiple method calls, e.g., provider.load().set(...).save()
		 */
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
