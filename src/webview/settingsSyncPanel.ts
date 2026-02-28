import * as vscode from 'vscode';
import { IDEProvider } from '../providers/ideProvider';
import { EnumIDEInfoType, ILanguageConfig, EnumGlobalStateName } from '../types';
import {
  getSupportedLanguages,
  ILanguageCode,
  getSettingDescriptionBilingual,
  getAllSettingKeys,
} from '../utils/settingsDescriptions';
// @ts-ignore
import cssContent from './settingsSyncPanel.scss';
import { h, Fragment } from 'preact';
import { render } from 'preact-render-to-string';
import { PageHead } from './components/PageHead';
import { IDEList, IDEListSection } from './components/IDEList';
import { renderJsxToString } from '../utils/render-jsx';
import { formatPath } from '../utils/formatPath';

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

    const extensionUri = context.extensionUri;
    const distUri = vscode.Uri.joinPath(extensionUri, 'dist');

    this.panel = vscode.window.createWebviewPanel(
      'settingsSyncPanel',
      'IDE Settings Sync',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        // 必須明確授權 Webview 存取 dist 資料夾
        localResourceRoots: [distUri],
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

    /**
     * 生成 IDE 列表 HTML
     * 使用 IDEList 組件渲染可用和不可用的 IDE 列表
     */
    const ideListHTML = renderJsxToString(IDEListSection, {
      availableIDEs: ideList,
      unavailableIDEs: unavailableIDEs,
      currentIDEName,
    });

    return `<!DOCTYPE html>
<html>
<head>
  ${renderJsxToString(PageHead, {
    settingsSyncPanel: this,
    cssContent,
  })}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔄 IDE Settings Sync</h1>
      <div class="header-actions">
      </div>
    </div>

    ${ideListHTML}

    <div class="section">
      <h2>Description Language Configuration</h2>
      <div class="language-config">
        <div class="config-row">
          <label for="primaryLang">Primary Language:</label>
          <select id="primaryLang" onchange="changePrimaryLanguage()">
            ${supportedLanguages.map((lang) => `<option value="${lang.code}" ${lang.code === this.languageConfig.primary ? 'selected' : ''}>${lang.name}</option>`).join('')}
          </select>
          <button class="btn btn-small" onclick="openLanguageConfig()" title="Configure language settings">⚙ Config</button>
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
            <button class="btn btn-small" onclick="removeFromSelectedSettings('\${key}')" style="margin-left: auto;">✕ Remove</button>
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
      if (message.command === 'syncComplete')
      {
        showMessage('Settings synced successfully!', 'success');
        vscode.postMessage({ command: 'refreshData' });
      }
      else if (message.command === 'deleteComplete')
      {
        showMessage('Settings deleted successfully!', 'success');
        vscode.postMessage({ command: 'refreshData' });
      }
      else if (message.command === 'addCustomIDEComplete')
      {
        if (message.success)
        {
          showMessage(\`✓ Custom IDE "\${message.name}" added successfully!\`, 'success');
        }
        else
        {
          showMessage(\`✗ Failed to add IDE: \${message.error}\`, 'error');
        }
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
          case 'requestAddCustomIDE':
            // 使用 VS Code 的輸入框來取得路徑
            // Use VS Code's input box to get path
            const path = await vscode.window.showInputBox({
              prompt: 'Enter the path to the IDE settings folder (containing settings.json)',
              placeHolder: 'e.g., C:\\Users\\User\\AppData\\Roaming\\Code\\User',
            });
            if (!path) break;

            // 取得名稱
            // Get name
            const name = await vscode.window.showInputBox({
              prompt: 'Enter a name for this IDE',
              placeHolder: 'e.g., My VS Code',
            });
            if (!name) break;

            // 新增 IDE
            // Add IDE
            try
            {
              await this.ideProvider.addCustomIDE(name, path);
              await this.updateWebview();
              this.panel.webview.postMessage({ command: 'addCustomIDEComplete', success: true, name });
            }
            catch (error)
            {
              const errorMessage = error instanceof Error ? error.message : String(error);
              this.panel.webview.postMessage({ command: 'addCustomIDEComplete', success: false, error: errorMessage });
            }
            break;

          case 'addCustomIDE':
            try
            {
              await this.ideProvider.addCustomIDE(message.name, message.path);
              await this.updateWebview();
              this.panel.webview.postMessage({ command: 'addCustomIDEComplete', success: true, name: message.name });
            }
            catch (error)
            {
              const errorMessage = error instanceof Error ? error.message : String(error);
              this.panel.webview.postMessage({ command: 'addCustomIDEComplete', success: false, error: errorMessage });
            }
            break;

          case 'removeCustomIDE':
            await this.ideProvider.removeCustomIDE(message.index, message.name);
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

          case 'openIDEFolder':
            if (message.path) {
              vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(message.path));
            }
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
