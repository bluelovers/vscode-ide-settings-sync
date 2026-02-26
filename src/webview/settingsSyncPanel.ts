import * as vscode from 'vscode';
import { IDEProvider } from '../providers/ideProvider';
import { ILanguageConfig } from '../types';
import {
  getSupportedLanguages,
  ILanguageCode,
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

  private async updateWebview(): Promise<void> {
    await this.ideProvider.refreshIDEList();
    this.panel.webview.html = this.getWebviewContent();
  }

  private getWebviewContent(): string {
    const ideList = this.ideProvider.getIDEList();
    const unavailableIDEs = this.ideProvider.getUnavailableIDEs();
    const supportedLanguages = getSupportedLanguages();

    // Generate available IDEs HTML
    const availableIDEsHTML = ideList
      .map(
        (ide, index) =>
          `<div class="ide-item available">
        <input type="checkbox" id="ide-${index}" class="ide-checkbox" data-index="${index}" data-name="${ide.name}">
        <label for="ide-${index}"><strong>${ide.name}</strong></label>
        <span class="ide-path" title="${ide.nativePath}">${this.formatPath(ide.nativePath)}</span>
        ${ide.type === 'custom' ? `<button class="btn-small btn-remove" onclick="removeCustomIDE(${index})">Remove</button>` : ''}
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
      <button class="btn" onclick="addCustomIDE()" style="margin-top: 10px;">+ Add Custom IDE Path</button>
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
            onkeyup="searchSettings()"
          >
          <button class="btn" onclick="clearSearch()">Clear</button>
        </div>

        <div id="searchResults" class="settings-list"></div>
        <div class="actions">
          <button class="btn" onclick="syncSettings()">✓ Sync Selected</button>
          <button class="btn secondary" onclick="deleteSettings()">✗ Delete Selected</button>
        </div>
        <div id="message" class="message"></div>
      </div>
    </div>

    <div id="values" class="tab-content">
      <div class="section">
        <h2>All IDE Settings</h2>
        <div id="allSettings" class="settings-list"></div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let ideList = ${JSON.stringify(ideList)};
    let currentLanguage = '${this.currentLanguage}';

    const settingDescriptions = {
      'editor.fontFamily': 'The font family to use in the editor',
      'editor.fontSize': 'The font size in pixels',
      'editor.tabSize': 'The number of spaces a tab represents',
      'editor.insertSpaces': 'Insert spaces instead of tabs',
      'files.autoSave': 'Enable auto save',
      'workbench.colorTheme': 'The color theme to use',
    };

    function switchTab(tabName) {
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      document.getElementById(tabName).classList.add('active');
      event.target.classList.add('active');

      if (tabName === 'values') {
        displayAllSettings();
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

      const settingMap = new Map();
      ideList.forEach((ide, ideIndex) => {
        Object.entries(ide.settings).forEach(([key, value]) => {
          if (!settingMap.has(key)) {
            settingMap.set(key, {});
          }
          settingMap.get(key)[ide.name] = value;
        });
      });

      settingMap.forEach((values, key) => {
        allSettingsDiv.innerHTML += createSettingHTML(key, values);
      });
    }

    function searchSettings() {
      const query = document.getElementById('searchInput').value.toLowerCase();
      const resultsDiv = document.getElementById('searchResults');
      resultsDiv.innerHTML = '';

      if (query.length === 0) {
        return;
      }

      const settingMap = new Map();
      ideList.forEach((ide) => {
        Object.entries(ide.settings).forEach(([key, value]) => {
          if (key.toLowerCase().includes(query)) {
            if (!settingMap.has(key)) {
              settingMap.set(key, {});
            }
            settingMap.get(key)[ide.name] = value;
          }
        });
      });

      settingMap.forEach((values, key) => {
        resultsDiv.innerHTML += createSettingHTML(key, values);
      });
    }

    function createSettingHTML(key, values) {
      let valuesHTML = '';
      Object.entries(values).forEach(([ideName, value]) => {
        const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        valuesHTML += \`<div class="ide-value">
          <div class="ide-value-label">\${ideName}</div>
          <div class="ide-value-content">\${displayValue}</div>
        </div>\`;
      });

      const settingId = 'setting-' + key.replace(/\\./g, '_');
      const description = settingDescriptions[key] || 'No description available';
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
            await this.updateWebview();
            break;

          case 'refreshData':
            await this.updateWebview();
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
