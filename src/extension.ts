import * as vscode from 'vscode';
import { IDEProvider } from './providers/ideProvider';
import { SettingsSyncPanel } from './webview/settingsSyncPanel';
import { ILanguageConfig, ILanguageSourceInfo, ILanguageCode } from './types';
import { isValidLanguageCode, getDefaultFallbackList } from './utils/settingsDescriptions';

let ideProvider: IDEProvider;
let syncPanel: SettingsSyncPanel | undefined;
let languageConfig: ILanguageConfig;

export async function activate(context: vscode.ExtensionContext) {
  console.log('VSCode IDE Settings Sync extension is now active');

  // Initialize IDE Provider
  ideProvider = new IDEProvider(context);
  await ideProvider.refreshIDEList();

  // Initialize language configuration
  languageConfig = loadLanguageConfig(context);
  console.log('[Language Config] 載入配置:', languageConfig);

  // Register commands
  let disposable = vscode.commands.registerCommand(
    'vscode-ide-settings-sync.openSync',
    async () => {
      if (syncPanel) {
        syncPanel.reveal();
      } else {
        syncPanel = new SettingsSyncPanel(context, ideProvider, languageConfig);
        syncPanel.onDispose(() => {
          syncPanel = undefined;
        });
      }
    }
  );
  context.subscriptions.push(disposable);

  // Refresh IDEs command
  disposable = vscode.commands.registerCommand(
    'vscode-ide-settings-sync.refreshIDEs',
    async () => {
      await ideProvider.refreshIDEList();
      if (syncPanel) {
        syncPanel.refreshData();
      }
    }
  );
  context.subscriptions.push(disposable);

  // Sync settings command
  disposable = vscode.commands.registerCommand(
    'vscode-ide-settings-sync.syncSettings',
    async () => {
      if (syncPanel) {
        await syncPanel.syncSelectedSettings();
      }
    }
  );
  context.subscriptions.push(disposable);

  // 語言配置管理命令
  disposable = vscode.commands.registerCommand(
    'vscode-ide-settings-sync.configLanguage',
    async () => {
      await configureLanguage(context);
    }
  );
  context.subscriptions.push(disposable);

  // Auto-show panel on first activation
  vscode.commands.executeCommand('vscode-ide-settings-sync.openSync');
}

/**
 * 載入語言配置
 */
function loadLanguageConfig(context: vscode.ExtensionContext): ILanguageConfig {
  const saved = context.globalState.get<ILanguageConfig>('languageConfig');

  if (saved && isValidLanguageCode(saved.primary)) {
    return saved;
  }

  // 預設配置
  const defaultConfig: ILanguageConfig = {
    primary: 'en' as ILanguageCode,
    fallbackList: ['zh-tw', 'en'],
    secondary: undefined,
    showSecondary: false,
  };

  return defaultConfig;
}

/**
 * 保存語言配置
 */
function saveLanguageConfig(context: vscode.ExtensionContext, config: ILanguageConfig): void {
  context.globalState.update('languageConfig', config);
  languageConfig = config;
  console.log('[Language Config] 已保存:', config);
}

/**
 * 配置語言設置
 */
async function configureLanguage(context: vscode.ExtensionContext): Promise<void> {
  const { getSupportedLanguages } = await import('./utils/settingsDescriptions');
  const supportedLangs = getSupportedLanguages();

  // 選擇主語言
  const primaryChoice = await vscode.window.showQuickPick(
    supportedLangs.map(l => ({ label: l.name, id: l.code })),
    { placeHolder: '選擇主顯示語言' }
  );

  if (!primaryChoice || !isValidLanguageCode(primaryChoice.id)) {
    return;
  }

  languageConfig.primary = primaryChoice.id as ILanguageCode;

  // 選擇 Fallback 語言清單
  const fallbackChoices = await vscode.window.showQuickPick(
    supportedLangs
      .filter(l => l.code !== primaryChoice.id)
      .map(l => ({ label: l.name, id: l.code, picked: languageConfig.fallbackList.includes(l.code as ILanguageCode) })),
    {
      placeHolder: '選擇 Fallback 語言（可多選）',
      canPickMany: true
    }
  );

  if (fallbackChoices) {
    languageConfig.fallbackList = fallbackChoices.map(c => c.id as ILanguageCode);
  }

  // 選擇是否顯示副語言
  const showSecondaryChoice = await vscode.window.showQuickPick(
    [{ label: '是', id: 'true' }, { label: '否', id: 'false' }],
    { placeHolder: '是否同時顯示副語言描述？' }
  );

  languageConfig.showSecondary = showSecondaryChoice?.id === 'true';

  // 如果啟用副語言，選擇副語言
  if (languageConfig.showSecondary) {
    const secondaryChoice = await vscode.window.showQuickPick(
      supportedLangs
        .filter(l => l.code !== primaryChoice.id)
        .map(l => ({ label: l.name, id: l.code })),
      { placeHolder: '選擇副顯示語言' }
    );

    if (secondaryChoice && isValidLanguageCode(secondaryChoice.id)) {
      languageConfig.secondary = secondaryChoice.id as ILanguageCode;
    }
  }

  // 保存配置
  saveLanguageConfig(context, languageConfig);

  vscode.window.showInformationMessage(
    `✓ 語言配置已更新\n主語言: ${languageConfig.primary}\nFallback: ${languageConfig.fallbackList.join(', ')}`
  );

  // 重新整理 Panel
  if (syncPanel) {
    syncPanel.refreshData();
  }
}

export function deactivate() {
  syncPanel?.dispose();
}
