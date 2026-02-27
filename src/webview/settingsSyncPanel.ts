import * as vscode from 'vscode';
import { IDEProvider } from '../providers/ideProvider';
import { EnumIDEInfoType, ILanguageConfig, EnumGlobalStateName } from '../types';
import {
  getSupportedLanguages,
  ILanguageCode,
  getSettingDescriptionBilingual,
  getAllSettingKeys,
} from '../utils/settingsDescriptions';

export class SettingsSyncPanel {
  public readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private ideProvider: IDEProvider;
  private context: vscode.ExtensionContext;
  private onDisposeCallback?: () => void;
  private languageConfig: ILanguageConfig;
  private currentLanguage: ILanguageCode;

  constructor(context: vscode.ExtensionContext, ideProvider: IDEProvider, languageConfig?: ILanguageConfig) {
    this.context = context;
    this.ideProvider = ideProvider;
    this.languageConfig = languageConfig || {
      primary: 'en' as ILanguageCode,
      fallbackList: ['zh-tw', 'en'],
      secondary: undefined,
      showSecondary: false,
    };
    this.currentLanguage = this.languageConfig.primary;

    this.panel = vscode.window.createWebviewPanel(
      'settingsSyncPanel',
      'IDE Settings Sync',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'icon.svg');

    this.updateWebview();
    this.setupMessageHandler();

    this.panel.onDidDispose(() => {
      this.dispose();
      this.onDisposeCallback?.();
    }, null, this.disposables);
  }

  /**
   * Update the webview HTML. By default this will also refresh the IDE
   * list from disk, but callers can opt-out if they only need to reload
   * settings for the already-detected IDEs.
   *
   * / 更新 webview 的 HTML。預設會連同重新讀取 IDE 列表，但呼叫方
   * 可以選擇只重新載入現有 IDE 的設定值。
   *
   * @param refreshIDEList whether to refresh the IDE list (default true)
   */
  private async updateWebview(refreshIDEList: boolean = true): Promise<void> {
    if (refreshIDEList) {
      await this.ideProvider.refreshIDEList();
    }
    this.panel.webview.html = this.getWebviewContent();
  }

  private getWebviewContent(): string {
    const ideList = this.ideProvider.getIDEList();
    const unavailableIDEs = this.ideProvider.getUnavailableIDEs();
    const supportedLanguages = getSupportedLanguages();
    // determine which IDE corresponds to the running host (by name)
    const currentIDEName = vscode.env.appName; // e.g. "Visual Studio Code" or "Visual Studio Code - Insiders"

    // 👇 從 globalState 中獲取已保存的值
    const savedSearchHistory = this.context.globalState.get<string>(EnumGlobalStateName.searchHistory) || '';
    const savedSelectedSettings = this.context.globalState.get<string[]>(EnumGlobalStateName.selectedSettings) || [];
    const savedSelectedIDEs = this.context.globalState.get<number[]>(EnumGlobalStateName.selectedIDEs) || [];

    // Generate available IDEs HTML
    const availableIDEsHTML = ideList
      .map(
        (ide, index) =>
          `<div class="ide-item available${ide.name === currentIDEName ? ' current' : ''}">
        <input type="checkbox" id="ide-${index}" class="ide-checkbox" data-index="${index}" data-name="${ide.name}">
        <label for="ide-${index}"><strong>${ide.name}</strong></label>
        <span class="ide-path" title="${ide.nativePath}">${this.formatPath(ide.nativePath)}</span>
        ${ide.type === EnumIDEInfoType.custom ? `<button class="btn-small btn-remove" onclick="removeCustomIDE(${index})" title="Remove this custom IDE">Remove</button>` : ''}
      </div>`
      )
      .join('');

    // Generate unavailable IDEs HTML (grayed out)
    const unavailableIDEsHTML = unavailableIDEs
      .map(
        (ide) =>
          `<div class="ide-item unavailable" title="Not detected: ${ide.expectedPath}">
        <input type="checkbox" id="ide-unavail-${ide.name}" class="ide-checkbox" disabled>
        <label for="ide-unavail-${ide.name}"><strong>${ide.name}</strong></label>
        <span class="ide-path">❌ Not detected</span>
      </div>`
      )
      .join('');

    const csp = `default-src 'none'; img-src ${this.panel.webview.cspSource} https:; style-src ${this.panel.webview.cspSource} 'unsafe-inline'; script-src ${this.panel.webview.cspSource} 'unsafe-inline' 'unsafe-eval';`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IDE Settings Sync</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding: 20px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      font-size: 14px;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    h1 {
      font-size: 24px;
      color: var(--vscode-editor-foreground);
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    h2 {
      font-size: 16px;
      margin-top: 15px;
      margin-bottom: 10px;
      color: var(--vscode-textBlockQuote-border);
      border-bottom: 1px solid var(--vscode-editorGroup-border);
      padding-bottom: 8px;
    }

    .section {
      margin-bottom: 25px;
      padding: 15px;
      background-color: var(--vscode-editor-lineHighlightBackground);
      border: 1px solid var(--vscode-editorGroup-border);
      border-radius: 4px;
    }

    .ide-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ide-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      background-color: var(--vscode-list-hoverBackground);
      border-radius: 4px;
      border-left: 3px solid var(--vscode-textBlockQuote-border);
    }

    .ide-item.unavailable {
      opacity: 0.5;
      background-color: var(--vscode-editor-background);
      border-left-color: var(--vscode-inputValidation-errorBorder);
    }

    .ide-item.unavailable label {
      text-decoration: line-through;
    }

    .ide-checkbox {
      cursor: pointer;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .ide-item.unavailable .ide-checkbox {
      cursor: not-allowed;
    }

    .ide-item label {
      cursor: pointer;
      flex: 1;
      word-break: break-word;
    }

    .ide-path {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      flex: 1;
      word-break: break-all;
      margin-right: auto;
      max-width: 300px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .language-selector {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 15px;
    }

    .language-selector label {
      font-weight: 500;
    }

    .language-selector select {
      padding: 6px 10px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-textBlockQuote-border);
      border-radius: 4px;
      cursor: pointer;
    }

    .language-config {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .config-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background-color: var(--vscode-editor-background);
      border-radius: 4px;
    }

    .config-row label {
      font-weight: 500;
      flex: 0 0 150px;
    }

    .config-row select {
      flex: 1;
      padding: 6px 8px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-inputValidation-infoBorder);
      border-radius: 4px;
      cursor: pointer;
    }

    .fallback-list {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      flex: 1;
    }

    .fallback-tag {
      display: inline-block;
      padding: 4px 8px;
      background-color: var(--vscode-textBlockQuote-border);
      color: var(--vscode-editor-background);
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .secondary-lang {
      padding: 4px 8px;
      background-color: var(--vscode-inputValidation-infoBorder);
      color: var(--vscode-editor-background);
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .search-container {
      margin-bottom: 15px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 200px;
      padding: 8px 12px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-inputValidation-infoBorder);
      border-radius: 4px;
      font-size: 14px;
    }

    .search-input::placeholder {
      color: var(--vscode-input-placeholderForeground);
    }

    .btn {
      padding: 8px 16px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .btn:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .btn-small {
      padding: 4px 8px;
      font-size: 12px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .btn-small.btn-remove {
      background-color: var(--vscode-inputValidation-errorBackground);
      color: var(--vscode-inputValidation-errorForeground);
    }

    .btn-small.btn-remove:hover {
      background-color: var(--vscode-inputValidation-errorBorder);
    }

    .btn.secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .btn.secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .settings-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 500px;
      overflow-y: auto;
    }

    .setting-item {
      padding: 12px;
      background-color: var(--vscode-list-hoverBackground);
      border-left: 3px solid var(--vscode-textBlockQuote-border);
      border-radius: 4px;
    }

    .setting-key {
      font-weight: bold;
      color: var(--vscode-symbolIcon-fieldForeground);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .setting-checkbox {
      margin-right: 0;
      cursor: pointer;
      width: 16px;
      height: 16px;
    }

    .setting-description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
      font-style: italic;
    }

    .setting-values {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px;
      font-size: 12px;
    }

    .ide-value {
      padding: 8px;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-editorGroup-border);
      border-radius: 3px;
      word-break: break-word;
    }

    .ide-value-label {
      color: var(--vscode-symbolIcon-fieldForeground);
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .ide-value-content {
      color: var(--vscode-descriptionForeground);
      word-break: break-all;
      max-height: 60px;
      overflow-y: auto;
    }

    /* highlight when a particular IDE is the one running this extension */
    .ide-value.current {
      background-color: var(--vscode-inputValidation-infoBackground);
      border: 1px solid var(--vscode-inputValidation-infoBorder);
    }

    /* missing values get greyed out/red tinted */
    .ide-value-missing {
      background-color: var(--vscode-inputValidation-errorBackground);
      color: var(--vscode-inputValidation-errorForeground);
    }

    /* mark the current IDE in the IDE list */
    .ide-item.current {
      background-color: var(--vscode-inputValidation-infoBackground);
      border-left-color: var(--vscode-inputValidation-infoBorder);
    }

    /* colored action buttons */
    .btn-sync {
      background-color: #0fbf5a;
      color: #ffffff;
    }
    .btn-sync:hover {
      background-color: #0aa34f;
    }
    .btn-delete {
      background-color: var(--vscode-inputValidation-errorBackground);
      color: var(--vscode-inputValidation-errorForeground);
      margin-left: auto;
    }
    .btn-delete:hover {
      background-color: var(--vscode-inputValidation-errorBorder);
    }

    .actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
      flex-wrap: wrap;
    }

    .message {
      padding: 12px 15px;
      margin-top: 15px;
      border-radius: 4px;
      display: none;
      border-left: 4px solid;
    }

    .message.success {
      background-color: var(--vscode-gitDecoration-addedResourceForeground);
      color: var(--vscode-editor-background);
      border-left-color: var(--vscode-gitDecoration-addedResourceForeground);
      display: block;
    }

    .message.error {
      background-color: var(--vscode-inputValidation-errorBackground);
      color: var(--vscode-inputValidation-errorForeground);
      border-left-color: var(--vscode-inputValidation-errorBorder);
      display: block;
    }

    .message.info {
      background-color: var(--vscode-inputValidation-infoBorder);
      color: var(--vscode-editor-background);
      border-left-color: var(--vscode-inputValidation-infoBorder);
      display: block;
    }

    .tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--vscode-editorGroup-border);
      margin-bottom: 15px;
    }

    .tab {
      padding: 10px 15px;
      cursor: pointer;
      border: none;
      background: none;
      color: var(--vscode-foreground);
      border-bottom: 2px solid transparent;
      transition: border-color 0.2s;
    }

    .tab:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .tab.active {
      border-bottom-color: var(--vscode-textBlockQuote-border);
      color: var(--vscode-textBlockQuote-border);
      font-weight: 500;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .stats {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--vscode-editorGroup-border);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔄 IDE Settings Sync</h1>
      <div class="header-actions">
        <button class="btn secondary" onclick="refreshIDEs()" title="Refresh IDE list">🔄 Refresh</button>
      </div>
    </div>

    <div class="section">
      <h2>Select IDEs</h2>
      <div class="ide-list">
        ${availableIDEsHTML}
        ${unavailableIDEsHTML}
      </div>
      <button class="btn" onclick="addCustomIDE()" style="margin-top: 10px;" title="Manually specify an IDE/settings folder">+ Add Custom IDE Path</button>
    </div>

    <div class="section">
      <h2>Description Language Configuration</h2>
      <div class="language-config">
        <div class="config-row">
          <label for="primaryLang">Primary Language:</label>
          <select id="primaryLang" onchange="changePrimaryLanguage()">
            ${supportedLanguages.map((lang) => `<option value="${lang.code}" ${lang.code === this.languageConfig.primary ? 'selected' : ''}>${lang.name}</option>`).join('')}
          </select>
          <button class="btn-small" onclick="openLanguageConfig()" title="Configure language settings">⚙ Config</button>
        </div>

        <div class="config-row">
          <label>Fallback Languages:</label>
          <div class="fallback-list" id="fallbackList">
            ${this.languageConfig.fallbackList.map((lang) => {
              const langInfo = supportedLanguages.find(l => l.code === lang);
              return `<span class="fallback-tag">${langInfo?.name || lang}</span>`;
            }).join('')}
          </div>
        </div>

        ${this.languageConfig.showSecondary && this.languageConfig.secondary
          ? `<div class="config-row">
              <label>Secondary Language:</label>
              <span class="secondary-lang">${supportedLanguages.find(l => l.code === this.languageConfig.secondary)?.name || this.languageConfig.secondary}</span>
            </div>`
          : ''}
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" onclick="switchTab('sync')">Sync Settings</button>
      <button class="tab" onclick="switchTab('values')">View All Settings</button>
      <button class="tab" onclick="switchTab('selected')">Selected Settings</button>
    </div>

    <div id="sync" class="tab-content active">
      <div class="section">
        <h2>Search & Sync Settings</h2>
        <div class="search-container">
          <input
            type="text"
            class="search-input"
            id="searchInput"
            placeholder="e.g., editor.fontFamily, editor.fontSize..."
            onkeyup="searchSettings();saveSearchHistory()"
          >
          <button class="btn" onclick="clearSearch()" title="Clear search field">Clear</button>
        </div>

        <div id="searchResults" class="settings-list"></div>
        <div class="actions">
          <!-- refresh button added so users can manually reload settings from disk -->
          <button class="btn" onclick="refreshSettings()" title="Reload settings from disk">↻ Refresh Settings</button>
          <button class="btn" onclick="saveSearchSelectedSettings()" title="Save checked settings">💾 Save Selected Settings List</button>
          <button class="btn btn-sync" onclick="syncSettings()" title="Start syncing selected settings">✓ Sync Selected</button>
          <button class="btn btn-delete" onclick="deleteSettings()" title="Delete selected settings">✗ Delete Selected</button>
        </div>
        <div id="message" class="message"></div>
      </div>
    </div>

    <div id="values" class="tab-content">
      <div class="section">
        <h2>All IDE Settings</h2>
        <div id="allSettings" class="settings-list"></div>
        <div class="actions">
          <!-- allow refreshing settings without touching IDE list -->
          <button class="btn" onclick="refreshSettings()" title="Reload settings from disk">↻ Refresh Settings</button>
          <button class="btn" onclick="saveAllSelectedSettings()" title="Save checked settings">💾 Save Selected Settings</button>
          <button class="btn btn-sync" onclick="syncSettings()" title="Start syncing selected settings">✓ Sync Selected</button>
          <button class="btn btn-delete" onclick="deleteSettings()" title="Delete selected settings">✗ Delete Selected</button>
        </div>
      </div>
    </div>

    <div id="selected" class="tab-content">
      <div class="section">
        <h2>Selected Settings List</h2>
        <p style="color: var(--vscode-descriptionForeground); margin-bottom: 15px; font-size: 13px;">
          👇 All checked settings from both Search & Sync and View All sections
        </p>
        <div id="selectedSettingsList" class="settings-list"></div>
        <div class="actions">
          <!-- user may want to refresh latest values while inspecting selected list -->
          <button class="btn" onclick="refreshSettings()" title="Reload settings from disk">↻ Refresh Settings</button>
          <button class="btn" onclick="clearAllSelectedSettings()" title="Remove all saved selections">🗑️ Clear All Selected</button>
          <button class="btn btn-sync" onclick="syncSettings()" title="Start syncing selected settings">✓ Sync Selected</button>
          <button class="btn btn-delete" onclick="deleteSettings()" title="Delete selected settings">✗ Delete Selected</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let ideList = ${JSON.stringify(this.ideProvider.getIDEListToWebviewContent())};
    let currentLanguage = '${this.currentLanguage}';
    let languageConfig = ${JSON.stringify(this.languageConfig)};
    let currentIDEName = '${currentIDEName.replace(/'/g, "\\'")}';

    // 👇 已保存的狀態值（從 globalState 恢復）
    const savedSearchHistory = '${savedSearchHistory.replace(/'/g, "\\'")}';
    const savedSelectedSettings = ${JSON.stringify(savedSelectedSettings)};
    const savedSelectedIDEs = ${JSON.stringify(savedSelectedIDEs)};

    // 👇 Multi-language setting descriptions
    const settingDescriptions = ${JSON.stringify(this.generateMultilingualDescriptions())};
    
    // 👇 Description lookup function with language fallback
    function getSettingDescription(key) {
      if (settingDescriptions[key]) {
        const desc = settingDescriptions[key];
        // If there's a secondary language description, show both
        if (desc.secondary) {
          return \`\${desc.primary}<br/><small style="color: #999; font-style: italic;">(\${desc.secondary})</small>\`;
        }
        return desc.primary || 'No description available';
      }
      return 'No description available';
    }

    function switchTab(tabName) {
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      const content = document.getElementById(tabName);
      if (content) content.classList.add('active');

      // Safely activate the corresponding tab button by index
      const tabIndexMap = { sync: 0, values: 1, selected: 2 };
      const tabs = Array.from(document.querySelectorAll('.tab'));
      const btn = tabs[tabIndexMap[tabName]];
      if (btn) btn.classList.add('active');

      if (tabName === 'values') {
        try { displayAllSettings(); } catch (e) { console.error(e); }
      } else if (tabName === 'selected') {
        try { displaySelectedSettingsList(); } catch (e) { console.error(e); }
      }
    }

    function changePrimaryLanguage() {
      const newLang = document.getElementById('primaryLang').value;
      vscode.postMessage({ command: 'changePrimaryLanguage', language: newLang });
      const activeTab = document.querySelector('.tab.active');
      if (activeTab.textContent.includes('All')) {
        displayAllSettings();
      } else {
        searchSettings();
      }
    }

    function openLanguageConfig() {
      vscode.postMessage({ command: 'openLanguageConfig' });
    }

    function displayAllSettings() {
      const allSettingsDiv = document.getElementById('allSettings');
      allSettingsDiv.innerHTML = '';

      // 👇 Step 1: Collect all unique setting keys across ALL IDEs
      const allKeys = new Set();
      ideList.forEach((ide) => {
        Object.keys(ide.settings || {}).forEach(key => allKeys.add(key));
      });

      // 👇 Step 2: Create a map with entries for each key in ALL IDEs (even missing ones)
      const settingMap = new Map();
      allKeys.forEach(key => {
        settingMap.set(key, {});
        ideList.forEach((ide) => {
          if (ide.settings && ide.settings.hasOwnProperty(key)) {
            settingMap.get(key)[ide.name] = ide.settings[key];
          } else {
            // 👇 Mark missing values explicitly
            settingMap.get(key)[ide.name] = undefined;
          }
        });
      });

      // 👇 Sort keys for consistent display
      const sortedKeys = Array.from(allKeys).sort();
      sortedKeys.forEach(key => {
        allSettingsDiv.innerHTML += createSettingHTML(key, settingMap.get(key));
      });
    }

    function searchSettings() {
      const query = document.getElementById('searchInput').value.toLowerCase();
      const resultsDiv = document.getElementById('searchResults');
      resultsDiv.innerHTML = '';

      if (query.length === 0) {
        return;
      }

      // 👇 Step 1: Collect all unique setting keys across ALL IDEs that match query
      const matchedKeys = new Set();
      ideList.forEach((ide) => {
        Object.keys(ide.settings || {}).forEach(key => {
          if (key.toLowerCase().includes(query)) {
            matchedKeys.add(key);
          }
        });
      });

      // 👇 Step 2: Create a map with entries for each matched key in ALL IDEs
      const settingMap = new Map();
      matchedKeys.forEach(key => {
        settingMap.set(key, {});
        ideList.forEach((ide) => {
          if (ide.settings && ide.settings.hasOwnProperty(key)) {
            settingMap.get(key)[ide.name] = ide.settings[key];
          } else {
            // 👇 Mark missing values explicitly for consistency
            settingMap.get(key)[ide.name] = undefined;
          }
        });
      });

      // 👇 Sort keys for consistent display
      const sortedKeys = Array.from(matchedKeys).sort();
      sortedKeys.forEach(key => {
        resultsDiv.innerHTML += createSettingHTML(key, settingMap.get(key));
      });
    }

    function createSettingHTML(key, values) {
      let valuesHTML = '';
      Object.entries(values).forEach(([ideName, value]) => {
        // 👇 Handle missing values (undefined) with special display
        let displayValue;
        if (value === undefined) {
          displayValue = '<em style="color: #999;">Not set</em>';
        } else if (typeof value === 'object') {
          displayValue = JSON.stringify(value, null, 2);
        } else {
          displayValue = String(value);
        }
        
        const isCurrent = ideName === currentIDEName;
        let valueClass = value === undefined ? 'ide-value-missing' : '';
        if (!valueClass && isCurrent) {
          valueClass = 'current';
        }
        valuesHTML += \`<div class="ide-value \${valueClass}">
          <div class="ide-value-label">\${ideName}</div>
          <div class="ide-value-content">\${displayValue}</div>
        </div>\`;
      });

      const settingId = 'setting-' + key.replace(/\\./g, '_');
      // 👇 Use the new multilingual description function
      const description = getSettingDescription(key);
      return \`<div class="setting-item">
        <div class="setting-key">
          <input type="checkbox" class="setting-checkbox" id="\${settingId}" data-key="\${key}">
          <label for="\${settingId}">\${key}</label>
        </div>
        <div class="setting-description">\${description}</div>
        <div class="setting-values">\${valuesHTML}</div>
      </div>\`;
    }

    function clearSearch() {
      document.getElementById('searchInput').value = '';
      document.getElementById('searchResults').innerHTML = '';
      saveSearchHistory(); // 👇 清除搜尋歷史記憶
    }

    // 👇 顯示被勾選的設定值清單
    function displaySelectedSettingsList() {
      const selectedListDiv = document.getElementById('selectedSettingsList');
      selectedListDiv.innerHTML = '';

      if (!savedSelectedSettings || savedSelectedSettings.length === 0) {
        selectedListDiv.innerHTML = '<div style="color: var(--vscode-descriptionForeground); padding: 20px; text-align: center;">No settings selected yet</div>';
        return;
      }

      // 按字母順序排序
      const sortedSelectedSettings = [...savedSelectedSettings].sort();

      sortedSelectedSettings.forEach(key => {
        const description = getSettingDescription(key);
        const settingId = 'setting-' + key.replace(/\\./g, '_');
        
        // 查找該設定值是否在 ideList 中
        let valuesHTML = '';
        let settingExists = false;

        ideList.forEach((ide) => {
          if (ide.settings && ide.settings.hasOwnProperty(key)) {
            settingExists = true;
            const value = ide.settings[key];

            let displayValue;
            if (value === undefined) {
              displayValue = '<em style="color: #999;">Not set</em>';
            } else if (typeof value === 'object') {
              displayValue = JSON.stringify(value, null, 2);
            } else {
              displayValue = String(value);
            }

            const isCurrent = ide.name === currentIDEName;
            let valueClass = value === undefined ? 'ide-value-missing' : '';
            if (!valueClass && isCurrent) {
              valueClass = 'current';
            }
            valuesHTML += \`<div class="ide-value \${valueClass}">
              <div class="ide-value-label">\${ide.name}</div>
              <div class="ide-value-content">\${displayValue}</div>
            </div>\`;
          }
        });

        selectedListDiv.innerHTML += \`<div class="setting-item">
          <div class="setting-key">
            <input type="checkbox" class="setting-checkbox" id="\${settingId}" data-key="\${key}" checked>
            <label for="\${settingId}">\${key}</label>
            <button class="btn-small" onclick="removeFromSelectedSettings('\${key}')" style="margin-left: auto;">✕ Remove</button>
          </div>
          <div class="setting-description">\${description}</div>
          <div class="setting-values">\${valuesHTML}</div>
        </div>\`;
      });
    }

    // 👇 從被勾選的設定值清單中移除一個項目
    function removeFromSelectedSettings(key) {
      const index = savedSelectedSettings.indexOf(key);
      if (index > -1) {
        savedSelectedSettings.splice(index, 1);
        vscode.postMessage({ command: 'saveSelectedSettings', selectedSettings: savedSelectedSettings });
        displaySelectedSettingsList();
        showMessage(\`✓ Removed "\${key}" from selected settings\`, 'success');
      }
    }

    // 👇 清除所有被勾選的設定值
    function clearAllSelectedSettings() {
      if (confirm('Clear all selected settings?')) {
        savedSelectedSettings = [];
        vscode.postMessage({ command: 'saveSelectedSettings', selectedSettings: [] });
        displaySelectedSettingsList();
        showMessage('✓ All selected settings cleared', 'success');
      }
    }

    function addCustomIDE() {
      const path = prompt('Enter the path to the IDE settings folder (containing settings.json):');
      if (path) {
        const name = prompt('Enter a name for this IDE:');
        if (name) {
          vscode.postMessage({ command: 'addCustomIDE', name, path });
        }
      }
    }

    function removeCustomIDE(index) {
      if (confirm('Remove this custom IDE?')) {
        vscode.postMessage({ command: 'removeCustomIDE', index });
      }
    }

    /**
     * Ask the extension to re-scan the system for IDE installations.
     * This will update the IDE list itself and then rebuild the webview.
     * / 請求擴充套件重新掃描 IDE 安裝，更新 IDE 列表並重建視窗。
     *
     * @jsdoc
     */
    function refreshIDEs() {
      vscode.postMessage({ command: 'refreshIDEs' });
    }

    function syncSettings() {
      const selectedIDEs = [];
      document.querySelectorAll('.ide-checkbox:checked').forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index);
        if (!isNaN(index)) {
          selectedIDEs.push(index);
        }
      });

      const selectedSettings = [];
      document.querySelectorAll('.setting-checkbox:checked').forEach(checkbox => {
        selectedSettings.push(checkbox.dataset.key);
      });

      if (selectedIDEs.length < 2) {
        showMessage('Please select at least 2 IDEs', 'error');
        return;
      }

      if (selectedSettings.length === 0) {
        showMessage('Please select at least one setting to sync', 'error');
        return;
      }

      vscode.postMessage({
        command: 'syncSettings',
        sourceIDE: selectedIDEs[0],
        targetIDEs: selectedIDEs.slice(1),
        settings: selectedSettings
      });
    }

    /**
     * Request the extension to reload all IDE settings and
     * re-render the webview contents. Useful when external
     * changes have been made to the settings files.
     *
     * / 提示擴充套件重新載入所有 IDE 設定並重新渲染視窗。
     * 通常在設定檔已經由外部修改時使用。
     *
     * @jsdoc
     */
    /**
     * Reload settings values for the currently-detected IDEs without
     * re-scanning for new installations. Used by the in-panel ↻ buttons.
     * / 僅重新載入目前已偵測到的 IDE 的設定值，不重新掃描安裝位置。
     *
     * @jsdoc
     */
    function refreshSettings() {
      vscode.postMessage({ command: 'refreshData' });
      showMessage('⟳ Settings refreshed', 'info');
    }

    function deleteSettings() {
      const selectedIDEs = [];
      document.querySelectorAll('.ide-checkbox:checked').forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index);
        if (!isNaN(index)) {
          selectedIDEs.push(index);
        }
      });

      const selectedSettings = [];
      document.querySelectorAll('.setting-checkbox:checked').forEach(checkbox => {
        selectedSettings.push(checkbox.dataset.key);
      });

      if (selectedIDEs.length === 0) {
        showMessage('Please select at least one IDE', 'error');
        return;
      }

      if (selectedSettings.length === 0) {
        showMessage('Please select at least one setting to delete', 'error');
        return;
      }

      if (confirm(\`Delete \${selectedSettings.length} setting(s) from \${selectedIDEs.length} IDE(s)?\`)) {
        vscode.postMessage({
          command: 'deleteSettings',
          ideIndices: selectedIDEs,
          settings: selectedSettings
        });
      }
    }

    function showMessage(text, type) {
      const messageDiv = document.getElementById('message');
      messageDiv.textContent = text;
      messageDiv.className = \`message \${type}\`;
      setTimeout(() => {
        messageDiv.className = 'message';
      }, 5000);
    }

    // 👇 記憶功能：初始化時恢復已保存的狀態
    function initializeMemory() {
      // 恢復搜尋字符串
      if (savedSearchHistory) {
        document.getElementById('searchInput').value = savedSearchHistory;
      }

      // 恢復勾選的IDE
      if (savedSelectedIDEs && savedSelectedIDEs.length > 0) {
        savedSelectedIDEs.forEach(index => {
          const checkbox = document.querySelector(\`input.ide-checkbox[data-index="\${index}"]\`);
          if (checkbox) {
            checkbox.checked = true;
          }
        });
      }

      // 恢復勾選的設定值
      if (savedSelectedSettings && savedSelectedSettings.length > 0) {
        savedSelectedSettings.forEach(key => {
          const settingId = 'setting-' + key.replace(/\\./g, '_');
          const checkbox = document.getElementById(settingId);
          if (checkbox) {
            checkbox.checked = true;
          }
        });
      }
    }

    // 👇 記憶功能：保存搜尋字符串
    function saveSearchHistory() {
      const searchText = document.getElementById('searchInput').value;
      vscode.postMessage({ command: 'saveSearchHistory', searchText: searchText });
    }

    // 👇 記憶功能：手動保存搜尋結果中的勾選設定值
    function saveSearchSelectedSettings() {
      const selectedSettings = [];
      // 只從搜尋結果中獲取勾選的設定值
      document.querySelectorAll('#searchResults .setting-checkbox:checked').forEach(checkbox => {
        selectedSettings.push(checkbox.dataset.key);
      });
      vscode.postMessage({ command: 'saveSelectedSettings', selectedSettings: selectedSettings });
      showMessage('✓ Search settings saved', 'success');
    }

    // 👇 記憶功能：手動保存所有設定值中的勾選設定值
    function saveAllSelectedSettings() {
      const selectedSettings = [];
      // 只從所有設定值中獲取勾選的設定值
      document.querySelectorAll('#allSettings .setting-checkbox:checked').forEach(checkbox => {
        selectedSettings.push(checkbox.dataset.key);
      });
      vscode.postMessage({ command: 'saveSelectedSettings', selectedSettings: selectedSettings });
      showMessage('✓ All settings saved', 'success');
    }

    // 👇 記憶功能：保存勾選的IDE
    function saveSelectedIDEs() {
      const selectedIDEs = [];
      document.querySelectorAll('.ide-checkbox:checked').forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index);
        if (!isNaN(index)) {
          selectedIDEs.push(index);
        }
      });
      vscode.postMessage({ command: 'saveSelectedIDEs', selectedIDEs: selectedIDEs });
    }

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'syncComplete') {
        showMessage('Settings synced successfully!', 'success');
        vscode.postMessage({ command: 'refreshData' });
      } else if (message.command === 'deleteComplete') {
        showMessage('Settings deleted successfully!', 'success');
        vscode.postMessage({ command: 'refreshData' });
      }
    });

    // 👇 在 DOM 加載完成後初始化事件監聽和恢復狀態
    function initializeEventListeners() {
      // 初始化時恢復已保存的狀態
      initializeMemory();

      // 為搜尋輸入框添加事件監聽
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.addEventListener('input', saveSearchHistory);
      }

      // 為所有IDE勾選框添加事件監聽 - 保持自動保存
      document.querySelectorAll('.ide-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', saveSelectedIDEs);
      });

      // 👇 設定值勾選框改為手動保存，不再自動監聽
      // 設定值的保存由 saveSearchSelectedSettings() 和 saveAllSelectedSettings() 手動觸發

      /**
       * If the search input already contains text (for example restored from
       * memory after a refresh), trigger the search automatically so the
       * UI shows the expected results immediately.
       *
       * / 如果搜尋框在初始化時已包含文字（例如從記憶還原），自動觸發搜尋
       * 以便立即顯示結果。
       *
       * @jsdoc
       */
      if (searchInput && searchInput.value && searchInput.value.trim().length > 0) {
        try {
          searchSettings();
        } catch (e) {
          console.error('searchSettings failed during init:', e);
        }
      }
    }

    document.addEventListener('DOMContentLoaded', initializeEventListeners);
  </script>
</body>
</html>`;
  }

  private formatPath(fullPath: string): string {
    const parts = fullPath.replace(/\\\\/g, '/').split('/');
    if (parts.length > 3) {
      return '...' + parts.slice(-3).join('/');
    }
    return fullPath;
  }

  /**
   * 生成多語言設定描述對象
   * Generate multi-language setting descriptions object for WebView injection
   */
  private generateMultilingualDescriptions(): Record<string, { primary: string; secondary?: string }> {
    const descriptions: Record<string, { primary: string; secondary?: string }> = {};
    const allKeys = getAllSettingKeys();

    for (const key of allKeys) {
      const bilingual = getSettingDescriptionBilingual(
        key,
        this.currentLanguage,
        this.languageConfig.secondary,
        this.languageConfig.fallbackList || []
      );
      descriptions[key] = bilingual;
    }

    return descriptions;
  }

  private setupMessageHandler(): void {
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'addCustomIDE':
            await this.ideProvider.addCustomIDE(message.name, message.path);
            await this.updateWebview();
            break;

          case 'removeCustomIDE':
            await this.ideProvider.removeCustomIDE(message.index);
            await this.updateWebview();
            break;

          case 'syncSettings':
            await this.performSync(message.sourceIDE, message.targetIDEs, message.settings);
            this.panel.webview.postMessage({ command: 'syncComplete' });
            await this.updateWebview();
            break;

          case 'deleteSettings':
            await this.performDelete(message.ideIndices, message.settings);
            this.panel.webview.postMessage({ command: 'deleteComplete' });
            await this.updateWebview();
            break;

          case 'refreshIDEs':
            // full refresh: re-scan for IDE installations
            await this.updateWebview(true);
            break;

          case 'refreshData':
            // data-only refresh: reload settings from existing IDEs
            await this.updateWebview(false);
            break;

          case 'changePrimaryLanguage':
            if (message.language) {
              this.languageConfig.primary = message.language as ILanguageCode;
              this.currentLanguage = message.language as ILanguageCode;
            }
            break;

          case 'openLanguageConfig':
            vscode.commands.executeCommand('vscode-ide-settings-sync.configLanguage');
            break;

          case 'saveSearchHistory':
            this.context.globalState.update(EnumGlobalStateName.searchHistory, message.searchText);
            break;

          case 'saveSelectedSettings':
            this.context.globalState.update(EnumGlobalStateName.selectedSettings, message.selectedSettings);
            break;

          case 'saveSelectedIDEs':
            this.context.globalState.update(EnumGlobalStateName.selectedIDEs, message.selectedIDEs);
            break;
        }
      },
      undefined,
      this.disposables
    );
  }

  private async performSync(
    sourceIDEIndex: number,
    targetIDEIndices: number[],
    settingKeys: string[]
  ): Promise<void> {
    for (const settingKey of settingKeys) {
      const value = await this.ideProvider.getSettingValue(sourceIDEIndex, settingKey);

      for (const targetIDEIndex of targetIDEIndices) {
        await this.ideProvider.setSetting(targetIDEIndex, settingKey, value);
      }
    }

    this.ideProvider.saveSync(sourceIDEIndex, targetIDEIndices);
  }

  private async performDelete(ideIndices: number[], settingKeys: string[]): Promise<void> {
    for (const settingKey of settingKeys) {
      for (const ideIndex of ideIndices) {
        await this.ideProvider.deleteSetting(ideIndex, settingKey);
      }
    }
  }

  refreshData(): void {
    this.updateWebview();
  }

  reveal(): void {
    this.panel.reveal();
  }

  dispose(): void {
    this.panel.dispose();
    this.disposables.forEach((d) => d.dispose());
  }

  onDispose(callback: () => void): void {
    this.onDisposeCallback = callback;
  }

  async syncSelectedSettings(): Promise<void> {
    // This would be called by the extension when user clicks sync
    // The actual sync is handled by the WebView message handler
  }
}
