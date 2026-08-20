import * as vscode from 'vscode';
import { IDEProvider } from './providers/ideProvider';
import { SettingsSyncPanel } from './webview/settingsSyncPanel';
import { SettingsSyncSidebarProvider } from './webview/settingsSyncSidebarProvider';
import { ExportImportCommands } from './commands/exportImportCommands';
import { ILanguageConfig, ILanguageSourceInfo, EnumLanguageCode, EnumGlobalStateName } from './types';
import { isValidLanguageCode, getDefaultFallbackList } from './utils/settingsDescriptions';
import {
	loadLanguageConfig as loadLanguageConfigUtil,
	saveLanguageConfig as saveLanguageConfigUtil,
	getDefaultLanguageConfig,
	transformLanguagesToQuickPick,
	createYesNoQuickPickOptions,
} from './utils/languageConfig';
import { EnumVscodeCommands } from './types/vscode/vscode-commands';

let ideProvider: IDEProvider;
let syncPanel: SettingsSyncPanel | undefined;
let languageConfig: ILanguageConfig;

export async function activate(context: vscode.ExtensionContext)
{
	console.log('VSCode IDE Settings Sync extension is now active');

	// Initialize IDE Provider
	ideProvider = new IDEProvider(context);
	await ideProvider.refreshIDEList();

	// Initialize language configuration
	languageConfig = loadLanguageConfig(context);
	console.log('[Language Config] 載入配置:', languageConfig);

	// Initialize export/import commands
	const exportImportCommands = new ExportImportCommands(context);

	// Register commands
	let disposable = vscode.commands.registerCommand(
		EnumVscodeCommands.openSync,
		async () =>
		{
			if (syncPanel)
			{
				syncPanel.reveal();
			}
			else
			{
				syncPanel = new SettingsSyncPanel(context, ideProvider, languageConfig);
				syncPanel.onDispose(() =>
				{
					syncPanel = undefined;
				});
			}
		},
	);
	context.subscriptions.push(disposable);

	// Sidebar (Activity Bar) view: clicking the icon opens the panel
	disposable = vscode.window.registerWebviewViewProvider(
		SettingsSyncSidebarProvider.viewType,
		new SettingsSyncSidebarProvider(context),
	);
	context.subscriptions.push(disposable);

	// Refresh IDEs command
	disposable = vscode.commands.registerCommand(
		EnumVscodeCommands.refreshIDEs,
		async () =>
		{
			await ideProvider.refreshIDEList();
			if (syncPanel)
			{
				syncPanel.refreshData();
			}
		},
	);
	context.subscriptions.push(disposable);

	// Sync settings command
	disposable = vscode.commands.registerCommand(
		EnumVscodeCommands.syncSettings,
		async () =>
		{
			if (syncPanel)
			{
				await syncPanel.syncSelectedSettings();
			}
		},
	);
	context.subscriptions.push(disposable);

	// 語言配置管理命令
	disposable = vscode.commands.registerCommand(
		EnumVscodeCommands.configLanguage,
		async () =>
		{
			await configureLanguage(context);
		},
	);
	context.subscriptions.push(disposable);

	// Auto-show panel on first activation
	vscode.commands.executeCommand(EnumVscodeCommands.openSync);
}

/**
 * 載入語言配置
 * Load language configuration
 *
 * 從全域狀態載入語言配置，若無效則返回預設值。
 * 使用語言配置工具函式避免重複邏輯。
 * Load from globalState, return default if invalid.
 * Uses utility functions to avoid duplicate logic.
 *
 * @param {vscode.ExtensionContext} context - VS Code 擴充功能上下文
 * @returns {ILanguageConfig} 語言配置物件
 *
 * @see loadLanguageConfigUtil 請參考 src/utils/languageConfig 中的實現
 * @see src/utils/languageConfig
 */
function loadLanguageConfig(context: vscode.ExtensionContext): ILanguageConfig
{
	return loadLanguageConfigUtil(context);
}

/**
 * 保存語言配置
 * Save language configuration
 *
 * 將語言配置儲存至全域狀態。
 * 使用語言配置工具函式避免重複邏輯。
 * Save to globalState.
 * Uses utility functions to avoid duplicate logic.
 *
 * @param {vscode.ExtensionContext} context - VS Code 擴充功能上下文
 * @param {ILanguageConfig} config - 要保存的語言配置
 *
 * @see saveLanguageConfigUtil 請參考 src/utils/languageConfig 中的實現
 * @see src/utils/languageConfig
 */
function saveLanguageConfig(context: vscode.ExtensionContext, config: ILanguageConfig): void
{
	saveLanguageConfigUtil(context, config, (savedConfig) =>
	{
		languageConfig = savedConfig;
	});
}

/**
 * 配置語言設置
 */
async function configureLanguage(context: vscode.ExtensionContext): Promise<void>
{
	const { getSupportedLanguages } = await import('./utils/settingsDescriptions');
	const supportedLangs = getSupportedLanguages();

	// 選擇主語言
	// Transform languages to QuickPick format for selection
	const quickPickLanguages = transformLanguagesToQuickPick(supportedLangs);
	const primaryChoice = await vscode.window.showQuickPick(
		quickPickLanguages,
		{ placeHolder: '選擇主顯示語言' },
	);

	if (!primaryChoice || !isValidLanguageCode(primaryChoice.id))
	{
		return;
	}

	languageConfig.primary = primaryChoice.id as EnumLanguageCode;

	// 👇 New: Sort Fallback Languages by letting user select them in order
	await configureFallbackLanguages(supportedLangs, primaryChoice.id as EnumLanguageCode);

	// 選擇是否��示副語言
	// Use utility function to create Yes/No options
	const yesNoOptions = createYesNoQuickPickOptions();
	const showSecondaryChoice = await vscode.window.showQuickPick(
		yesNoOptions,
		{ placeHolder: '是否同時顯示副語言描述？' },
	);

	languageConfig.showSecondary = showSecondaryChoice?.id === 'true';

	// 如果啟用副語言，選擇副語言
	// Transform languages to QuickPick format, excluding primary language
	if (languageConfig.showSecondary)
	{
		const secondaryQuickPickOptions = transformLanguagesToQuickPick(
			supportedLangs,
			primaryChoice.id as EnumLanguageCode,
		);
		const secondaryChoice = await vscode.window.showQuickPick(
			secondaryQuickPickOptions,
			{ placeHolder: '選擇副顯示語言' },
		);

		if (secondaryChoice && isValidLanguageCode(secondaryChoice.id))
		{
			languageConfig.secondary = secondaryChoice.id as EnumLanguageCode;
		}
	}

	// 保存配置
	saveLanguageConfig(context, languageConfig);

	vscode.window.showInformationMessage(
		`✓ 語言配置已更新\n主語言: ${languageConfig.primary}\nFallback: ${languageConfig.fallbackList.join(', ')}`,
	);

	// 重新整理 Panel
	if (syncPanel)
	{
		syncPanel.refreshData();
	}
}

/**
 * 👇 Configure fallback languages with custom ordering
 * 配置 Fallback 語言清單 - 允許用戶自訂排序
 * @param supportedLangs 支援的語言清單
 * @param primaryLanguage 主語言代碼
 */
async function configureFallbackLanguages(
	supportedLangs: Array<{ code: EnumLanguageCode; name: string }>,
	primaryLanguage: EnumLanguageCode,
): Promise<void>
{
	// 過濾可用的語言（排除主要語言）
	// Filter available languages (exclude primary)
	const availableLangsForPick = supportedLangs
		.filter(l => l.code !== primaryLanguage)
		.map(l => ({ label: l.name, id: l.code }));
	const selectedLangs: EnumLanguageCode[] = [];

	// Show current fallback list
	const currentList = languageConfig.fallbackList
		.filter(l => l !== primaryLanguage)
		.map(code => supportedLangs.find(l => l.code === code)?.name || code)
		.join(', ');

	vscode.window.showInformationMessage(
		`Current Fallback Languages: ${currentList || '(none)'}. Select languages to reorder them.`,
	);

	// Learn the selected languages first
	// Add picked property to track selections
	const fallbackChoices = await vscode.window.showQuickPick(
		availableLangsForPick.map(l => ({
			...l,
			picked: languageConfig.fallbackList.includes(l.id as EnumLanguageCode),
		})),
		{
			placeHolder: 'Select Fallback Languages (you can reorder them next)',
			canPickMany: true,
		},
	);

	if (!fallbackChoices || fallbackChoices.length === 0)
	{
		languageConfig.fallbackList = [];
		return;
	}

	// 👇 Allow user to reorder selected languages
	const reorderedFallbacks: EnumLanguageCode[] = [];
	let remainingLangs = fallbackChoices.map(c => ({
		label: c.label,
		id: c.id as EnumLanguageCode,
	}));

	while (remainingLangs.length > 0)
	{
		const orderPrompt =
			reorderedFallbacks.length === 0
				? `Select the 1st Fallback Language (${remainingLangs.length} remaining)`
				: `Select the ${reorderedFallbacks.length + 1}th Fallback Language (${remainingLangs.length} remaining)`;

		const selected = await vscode.window.showQuickPick(remainingLangs, {
			placeHolder: orderPrompt,
		});

		if (!selected)
		{
			break;
		}

		reorderedFallbacks.push(selected.id);
		remainingLangs = remainingLangs.filter(l => l.id !== selected.id);
	}

	languageConfig.fallbackList = reorderedFallbacks;
}

export function deactivate()
{
	syncPanel?.dispose();
}
