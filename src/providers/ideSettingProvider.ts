import { existsSync, readFileSync, writeFileSync } from "fs";
import { JsonHandler } from "../utils/json";
import { JSONPath as IJSONPath } from "jsonc-parser";

export class IdeSettingProvider
{
	// @ts-ignore
	protected jsonHandler: JsonHandler;
	protected _loaded: boolean = false;

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
		return this;
	}

	save()
	{
		if (this._loaded && this.jsonHandler.isStagedChanged())
		{
			const staging = this.jsonHandler.getStagedChanges();

			// Re-load to get fresh handler, then apply staging
			const freshHandler = this._loadCore(this.readSettingsRaw());
			freshHandler.overwriteStaged(staging);

			const out = freshHandler.stringify();
			writeFileSync(this.settingsJsonPath, out, 'utf-8');

			this.jsonHandler = this._loadCore(out);
		}

		return this;
	}

	valueOf()
	{
		return this.jsonHandler?.getData();
	}

	getSourceText()
	{
		return this.jsonHandler?.getSourceText();
	}

	isStagedChanged()
	{
		return this.jsonHandler?.getStagedChanges().size > 0;
	}

	get<T = any>(path: IJSONPath): T
	{
		return this.jsonHandler.get(path);
	}

	set<T = any>(path: IJSONPath, value: T)
	{
		this.jsonHandler.set(path, value);
		return this;
	}

	delete(path: IJSONPath): boolean
	{
		return this.jsonHandler.delete(path);
	}

	getData()
	{
		return this.jsonHandler?.getData();
	}
}
