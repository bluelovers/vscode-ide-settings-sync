import { ExtensionContext } from 'vscode';
import { EnumGlobalStateName, ICustomIDEWithUuid, ILanguageConfig } from '../../types';
import { ITSPickExtra } from 'ts-type';

export interface IGlobalStateSelectedSettings
{
	key: EnumGlobalStateName.selectedSettings;
	value: string[];
}

export interface IGlobalStateCustomIDEs
{
	key: EnumGlobalStateName.customIDEs;
	value: ITSPickExtra<ICustomIDEWithUuid, 'name' | 'path'>[];
}

export interface IGlobalStateSourceIDEUuid
{
	key: EnumGlobalStateName.sourceIDEUuid;
	value: string;
}

export interface IGlobalStateSearchHistory
{
	key: EnumGlobalStateName.searchHistory;
	value: string;
}

export interface IGlobalStateSelectedIDEs
{
	key: EnumGlobalStateName.selectedIDEs;
	value: number[];
}

export interface IGlobalStateLanguageConfig
{
	key: EnumGlobalStateName.languageConfig;
	value: ILanguageConfig;
}

export type IGlobalStateAll = IGlobalStateSelectedSettings | IGlobalStateCustomIDEs | IGlobalStateSourceIDEUuid | IGlobalStateSearchHistory | IGlobalStateSelectedIDEs | IGlobalStateLanguageConfig;

export class VscodeExtensionContextGlobalState
{
	constructor(protected globalState: ExtensionContext["globalState"])
	{

	}

	get<K extends EnumGlobalStateName, T extends Extract<IGlobalStateAll, {
		key: K
	}>>(key: K, defaultValue: T["value"]): T["value"]
	get<K extends EnumGlobalStateName, T extends Extract<IGlobalStateAll, {
		key: K
	}>>(key: K, defaultValue?: T["value"]): T["value"] | undefined

	get<V extends IGlobalStateAll["value"], T extends Extract<IGlobalStateAll, {
		value: V
	}>>(key: T["key"], defaultValue: V): V
	get<V extends IGlobalStateAll["value"], T extends Extract<IGlobalStateAll, {
		value: V
	}>>(key: T["key"], defaultValue?: V): V | undefined

	get<K extends EnumGlobalStateName, V extends IGlobalStateAll["value"], T extends Extract<IGlobalStateAll, {
		key: K;
		value: V
	}>>(key: K, defaultValue: V): T["value"]
	get<K extends EnumGlobalStateName, V extends IGlobalStateAll["value"], T extends Extract<IGlobalStateAll, {
		key: K;
		value: V
	}>>(key: K, defaultValue?: V): T["value"] | undefined

	get<T extends IGlobalStateAll, K extends T["key"]>(key: K, defaultValue: Extract<T, {
		key: K
	}>["value"]): Extract<T, {
		key: K
	}>["value"]
	get<T extends IGlobalStateAll, K extends T["key"]>(key: K, defaultValue?: Extract<T, {
		key: K
	}>["value"]): Extract<T, {
		key: T["key"]
	}>["value"] | undefined

	get<T>(key: string, defaultValue?: T): T | undefined
	{
		return this.globalState.get(key, defaultValue);
	}

	update<K extends EnumGlobalStateName, T extends Extract<IGlobalStateAll, {
		key: NoInfer<K>
	}>>(key: K, value: T["value"]): Thenable<void>
	update<V extends IGlobalStateAll["value"], T extends Extract<IGlobalStateAll, {
		value: V
	}>>(key: T["key"], value: V): Thenable<void>

	update<T extends IGlobalStateAll>(key: T["key"], value: T["value"]): Thenable<void>

	update<T>(key: string, value: T): Thenable<void>
	{
		return this.globalState.update(key, value);
	}
}

/**
 * 手動初始化 VscodeExtensionContextGlobalState
 */
export abstract class AbstractClassWithGlobalState
{
	protected globalState!: VscodeExtensionContextGlobalState;
}

/**
 * 自動由 ExtensionContext 初始化 VscodeExtensionContextGlobalState
 */
export abstract class AbstractClassWithContextGlobalState
{
	protected context!: ExtensionContext;
	#globalState!: VscodeExtensionContextGlobalState;

	protected get globalState(): VscodeExtensionContextGlobalState
	{
		if (!this.#globalState)
		{
			this.#globalState = new VscodeExtensionContextGlobalState(this.context.globalState);
		}

		return this.#globalState;
	}
}

export function newVscodeExtensionContextGlobalStateByContext(context: ExtensionContext)
{
	return new VscodeExtensionContextGlobalState(context.globalState);
}

export function newVscodeExtensionContextGlobalState(globalState: ExtensionContext["globalState"])
{
	return new VscodeExtensionContextGlobalState(globalState);
}
