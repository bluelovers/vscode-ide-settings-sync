import { existsSync, readFileSync, writeFileSync } from "fs";
import { JsonHandler } from "../utils/json";
import { JSONPath as IJSONPath } from "jsonc-parser";

export class IdeSettingProvider
{
	// @ts-ignore
	protected jsonHandler: JsonHandler;
	protected _loaded?: boolean;

	constructor(protected settingsPath: string, protected settingsJsonPath: string)
	{

	}

	checkExists()
	{
		return existsSync(this.settingsJsonPath);
	}

	readSettingsRaw()
	{
		return readFileSync(this.settingsJsonPath, 'utf-8');
	}

	protected _loadCore(originalText: string)
	{
		let jsonHandler = new JsonHandler(originalText);

		return jsonHandler
	}

	loaded()
	{
		return this._loaded
	}

	load(reload?: boolean)
	{
		if (reload || !this._loaded)
		{
			if (!this.checkExists())
			{
				throw new Error(`✗ 沒有找到 ${this.settingsJsonPath} 的設定檔案`);
			}

			this._loaded = false;
			// @ts-ignore
			this.jsonHandler = null;

			const jsonHandler = this._loadCore(this.readSettingsRaw());

			const errors = jsonHandler.getErrors();

			if (errors.length)
			{
				throw new AggregateError(errors, `✗ 無法讀取或解析 ${this.settingsJsonPath} 的設定檔案`);
			}

			this.jsonHandler = jsonHandler;
			this._loaded = true;
		}
		return this.jsonHandler;
	}

	save()
	{
		if (this._loaded)
		{
			const staging = this.jsonHandler.getStagedChanges();

			const out = this.load(true).overwriteStaged(staging).stringify();

			writeFileSync(this.settingsJsonPath, out);

			this.jsonHandler = this._loadCore(out);
		}

		return this;
	}

	valueOf()
	{
		return this.jsonHandler?.getData();
	}

	get sourceText()
	{
		return this.jsonHandler?.getSourceText();
	}

	changed()
	{
		return this.jsonHandler?.isStagedChanged()
	}

	get<T = any>(path: IJSONPath): T
	{
		return this.jsonHandler.get(path);
	}

	set<T = any>(path: IJSONPath, value: T)
	{
		this.jsonHandler.set(path, value);
	}

}
