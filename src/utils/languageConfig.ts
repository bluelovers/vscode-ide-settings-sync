/**
 * 語言配置管理工具函數
 * Language Configuration Management Utility Functions
 *
 * 提供語言配置的載入（loadLanguageConfig）、保存（saveLanguageConfig）、
 * 預設值取得（getDefaultLanguageConfig）等功能，
 * 避免在多個模組中重複相同的預設配置邏輯。
 *
 * 可重構的相似邏輯：
 * - 原本在 extension.ts 和 settingsSyncPanel.ts 中各有預設語言配置的複製
 * - QuickPick 的 label/id 格式轉換邏輯
 *
 * @module
 */
import * as vscode from 'vscode';
/** 导入语言配置接口（ILanguageConfig）、语言代码枚举（EnumLanguageCode）和全局状态名称枚举（EnumGlobalStateName） / Import language configuration interface, language code enum, and global state name enum */
import { ILanguageConfig, EnumLanguageCode, EnumGlobalStateName } from '../types';
import { isValidLanguageCode } from './settingsDescriptions';
import { newVscodeExtensionContextGlobalStateByContext } from '../providers/vscode/globalState';

/**
 * 預設語言配置
 * Default language configuration
 */
export const DEFAULT_LANGUAGE_CONFIG: ILanguageConfig = {
	primary: EnumLanguageCode.en,
	fallbackList: [EnumLanguageCode.zhTw, EnumLanguageCode.en],
	secondary: undefined,
	showSecondary: false,
};

/**
 * 取得預設語言配置的副本
 * Get a copy of default language configuration
 *
 * 返回預設配置的淺拷貝，避免直接修改常數。
 * Returns a shallow copy of the default config to prevent mutation.
 *
 * @returns {ILanguageConfig} 預設語言配置物件的副本
 */
export function getDefaultLanguageConfig(): ILanguageConfig
{
	return {
		...DEFAULT_LANGUAGE_CONFIG,
	};
}

/**
 * 從全域狀態載入語言配置
 * Load language configuration from globalState
 *
 * 從 VS Code globalState 中載入已保存的語言配置。
 * 若不存在或主要語言代碼無效，則返回預設配置。
 *
 * 相似邏輯原本位於 extension.ts 的 loadLanguageConfig 函式。
 * Original similar logic was in extension.ts loadLanguageConfig function.
 *
 * @param {vscode.ExtensionContext} context - VS Code 擴充功能上下文
 * @returns {ILanguageConfig} 語言配置物件
 */
export function loadLanguageConfig(context: vscode.ExtensionContext): ILanguageConfig
{
	const globalState = newVscodeExtensionContextGlobalStateByContext(context);
	const saved = globalState.get(EnumGlobalStateName.languageConfig);

	if (saved && isValidLanguageCode(saved.primary))
	{
		return saved;
	}

	return getDefaultLanguageConfig();
}

/**
 * 儲存語言配置至全域狀態
 * Save language configuration to globalState
 *
 * 將語言配置保存至 VS Code globalState，
 * 並可選地觸發回調通知以更新呼叫端的狀態。
 *
 * 相似邏輯原本位於 extension.ts 的 saveLanguageConfig 函式。
 * Original similar logic was in extension.ts saveLanguageConfig function.
 *
 * @param {vscode.ExtensionContext} context - VS Code 擴充功能上下文
 * @param {ILanguageConfig} config - 要保存的語言配置
 * @param {(config: ILanguageConfig) => void} [onSaved] - 保存後的可選回調函數
 */
export function saveLanguageConfig(
	context: vscode.ExtensionContext,
	config: ILanguageConfig,
	onSaved?: (config: ILanguageConfig) => void,
): void
{
	context.globalState.update(EnumGlobalStateName.languageConfig, config);
	console.log('[Language Config] 已保存:', config);

	if (onSaved)
	{
		onSaved(config);
	}
}

/**
 * 將語言選項轉換為 QuickPick 格式
 * Transform language options to QuickPick format
 *
 * 將語言選項陣列轉換為 VS Code QuickPick 所需的 label/id 格式。
 * 這個模式在多個地方重複出現，現在統一由工具函式處理。
 * This pattern was duplicated in multiple places, now unified in utility.
 *
 * @param languages - 語言選項陣列
 * @param [exclude] - 要排除的語言代碼（可選）
 * @returns QuickPick 格式選項
 */
export function transformLanguagesToQuickPick(
	languages: Array<{ code: EnumLanguageCode; name: string }>,
	exclude?: EnumLanguageCode,
): Array<{ label: string; id: EnumLanguageCode }>
{
	const filtered = exclude
		? languages.filter(l => l.code !== exclude)
		: languages;

	return filtered.map(l => ({
		label: l.name,
		id: l.code,
	}));
}

/**
 * 建立是/否 QuickPick 選項
 * Create Yes/No QuickPick options
 *
 * 用於建立二元選擇的 QuickPick 選項，
 * 例如「是否顯示副語言描述」。
 * Used for binary choice selections in QuickPick.
 *
 * @returns {Array<{ label: string; id: string }>} 是/否選項陣列
 */
export function createYesNoQuickPickOptions(): Array<{ label: string; id: string }>
{
	return [
		{ label: '是', id: 'true' },
		{ label: '否', id: 'false' },
	];
}