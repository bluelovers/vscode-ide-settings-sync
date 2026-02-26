import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { EnumGlobalStateName, EnumIDEInfoType, IIDEInfo, IUnavailableIDE } from '../types';
import { _keyToPath } from '../utils/json';
import { IdeSettingProvider } from './ideSettingProvider';


/**
 * IDE 設定供應商
 * Provides IDE detection, settings I/O, and management functionality
 *
 * 此類負責：
 * - 偵測系統中安裝的已知 IDE（VS Code、VS Code Insiders、Antigravity 等）
 * - 管理自訂 IDE 路徑
 * - 讀取/寫入 IDE 設定檔案
 * - 追蹤可用和不可用的 IDE
 */
export class IDEProvider {
  // IDE 列表：存儲成功偵測到的可用 IDE
  // IDE list: Stores successfully detected available IDEs
  private ideList: IIDEInfo[] = [];

  // 不可用 IDE 列表：存儲偵測清單中但未找到的 IDE
  // Unavailable IDEs: Stores IDEs in detection list but not found
  private unavailableIDEs: IUnavailableIDE[] = [];

  // VS Code 擴展上下文
  // VS Code extension context
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * 重新整理 IDE 列表
   * Refresh the IDE detection list
   *
   * 此方法會：
   * 1. 清空現有的 IDE 列表
   * 2. 偵測所有已知的 IDE
   * 3. 載入使用者定義的自訂 IDE 路徑
   */
  async refreshIDEList(): Promise<void> {
    this.ideList = [];
    this.unavailableIDEs = [];

    // 偵測內建已知的 IDE
    // Detect built-in known IDEs (VS Code, Insiders, etc.)
    await this.detectKnownIDEs();

    // 從擴展設定中載入自訂 IDE 路徑
    // Load custom IDE paths from extension settings
    await this.loadCustomIDEs();
  }

  /**
   * 偵測已知的 IDE
   * Detect known IDEs installed on the system
   *
   * 此方法會嘗試在以下位置查找 IDE：
   * - Windows: %APPDATA%\{IDEName}\User\settings.json
   * - macOS/Linux: ~/.{IDEName}/User/settings.json
   *
   * 支援的 IDE：
   * - Visual Studio Code (Code)
   * - Visual Studio Code - Insiders (Code - Insiders, Code-Insiders)
   * - Antigravity
   * - CodeBuddy CN
   */
  private async detectKnownIDEs(): Promise<void> {
    // 定義已知 IDE 的資訊，包括可能的多個資料夾名稱
    // Define known IDEs with possible folder name variations
    // 註：某些 IDE 可能在不同安裝方式下使用不同的資料夾名稱
    // Note: Some IDEs may use different folder names depending on installation method
    const knownIDEs = [
      {
        name: 'Visual Studio Code',
        // 標準的 VS Code 資料夾名稱
        // Standard VS Code folder name
        appFolderNames: ['Code'],
      },
      {
        name: 'Visual Studio Code - Insiders',
        // VS Code Insiders 可能使用 "Code - Insiders" 或 "Code-Insiders"
        // VS Code Insiders may use "Code - Insiders" or "Code-Insiders"
        // 重要：空格版本 "Code - Insiders" 應優先嘗試
        // Important: Space version "Code - Insiders" should be tried first
        appFolderNames: ['Code - Insiders', 'Code-Insiders', 'CodeInsiders'],
      },
      {
        name: 'Antigravity',
        appFolderNames: ['Antigravity'],
      },
      {
        name: 'CodeBuddy CN',
        // CodeBuddy CN 可能使用空格或連字符
        // CodeBuddy CN may use spaces or hyphens
        appFolderNames: ['CodeBuddy CN', 'CodeBuddy-CN', 'CodeBuddyCN'],
      },
    ];

    // 逐個 IDE 進行偵測
    // Perform detection for each IDE
    for (const ide of knownIDEs) {
      let foundPath: string | null = null;
      let detectedPath: string | null = null;

      // 嘗試多個可能的資料夾名稱
      // Try multiple possible folder name variations
      for (const appFolderName of ide.appFolderNames) {
        // 根據作業系統環境變量構造可能的路徑
        // Construct possible path based on OS environment variables
        const testPath = this.getUserDataPath(appFolderName, 'User');
        const settingsJsonPath = path.join(testPath, 'settings.json');

        console.log(`[IDE Detection] 嘗試檢測 ${ide.name} at ${testPath}`);
        console.log(`[IDE Detection] Attempting to detect ${ide.name} at ${testPath}`);

        // 步驟 1：檢查主資料夾是否存在
        // Step 1: Check if the main folder exists
        if (fs.existsSync(testPath)) {
          detectedPath = testPath;
          console.log(`[IDE Detection] ✓ 找到資料夾 ${ide.name} at ${testPath}`);
          console.log(`[IDE Detection] ✓ Found folder for ${ide.name} at ${testPath}`);

          // 步驟 2：檢查 settings.json 檔案是否存在
          // Step 2: Check if settings.json file exists
          if (fs.existsSync(settingsJsonPath)) {
            foundPath = testPath;
            console.log(`[IDE Detection] ✓✓ 成功偵測到 ${ide.name}，settings.json 已找到`);
            console.log(`[IDE Detection] ✓✓ Successfully detected ${ide.name}, settings.json found`);
            // 成功找到，退出迴圈
            // Found successfully, exit loop
            break;
          } else {
            // 資料夾存在但缺少 settings.json 檔案
            // Folder exists but settings.json is missing
            console.log(
              `[IDE Detection] ⚠ 資料夾存在但找不到 settings.json: ${settingsJsonPath}`
            );
            console.log(
              `[IDE Detection] ⚠ Folder exists but settings.json not found: ${settingsJsonPath}`
            );
            // 如果這是最後一個嘗試，記錄此路徑供後續使用
            // If this is the last attempt, record this path for later use
            if (!detectedPath) {
              detectedPath = testPath;
            }
          }
        } else {
          console.log(`[IDE Detection] ✗ 路徑不存在 / Path not found: ${testPath}`);
        }
      }

      // 步驟 3：根據偵測結果進行相應處理
      // Step 3: Handle the detection result
      if (foundPath) {
        // 成功找到 IDE，嘗試載入設定
        // Successfully found IDE, attempt to load settings
        const settingsJsonPath = path.join(foundPath, 'settings.json');
        try {
          // 使用 IdeSettingProvider 處理讀取與解析
          // Use IdeSettingProvider to manage read/parse
          const settingProvider = new IdeSettingProvider(foundPath, settingsJsonPath);
          settingProvider.load();

          // 將 IDE 新增到可用列表，並附加 provider
          // Add IDE to available list with provider
          this.ideList.push({
            name: ide.name,
            type: EnumIDEInfoType.known,
            available: true,
            nativePath: foundPath,
            settingProvider,
          });

          console.log(`[IDE Detection] ✓ 成功載入 ${ide.name} 的設定`);
          console.log(`[IDE Detection] ✓ Successfully loaded settings for ${ide.name}`);

        } catch (error) {
          // settings.json 檔案存在但無法解析（例如格式錯誤）
          // settings.json exists but cannot be parsed (e.g., invalid format)
          console.error(
            `[IDE Detection] ✗ 無法讀取或解析 ${ide.name} 的設定檔案:`,
            error
          );
          console.error(
            `[IDE Detection] ✗ Failed to read or parse settings for ${ide.name}:`,
            error
          );

          // 將 IDE 標記為不可用
          // Mark IDE as unavailable
          this.unavailableIDEs.push({
            name: ide.name,
            type: EnumIDEInfoType.known,
            expectedPath: detectedPath || foundPath,
          });
        }
      } else {
        // 未能找到任何可用的 IDE 路徑
        // Failed to find any available IDE path
        const defaultPath = this.getUserDataPath(ide.appFolderNames[0], 'User');
        console.log(`[IDE Detection] ✗ 未偵測到 ${ide.name}`);
        console.log(`[IDE Detection] ✗ ${ide.name} not detected`);

        // 將 IDE 標記為不可用
        // Mark IDE as unavailable
        this.unavailableIDEs.push({
          name: ide.name,
          type: EnumIDEInfoType.known,
          expectedPath: detectedPath || defaultPath,
        });
      }
    }
  }

  /**
   * 載入自訂 IDE 路徑
   * Load custom IDE paths from extension settings
   *
   * 此方法讀取用戶先前新增的自訂 IDE 路徑，
   * 並嘗試驗證這些路徑和載入它們的設定檔案。
   */
  private async loadCustomIDEs(): Promise<void> {
    // 從全域狀態讀取自訂 IDE 清單
    // Read custom IDE list from global state
    const customIDEs = this.context.globalState.get<Array<{ name: string; path: string }>>(
      EnumGlobalStateName.customIDEs,
      [] // 預設值：空陣列 / Default value: empty array
    );

    console.log(`[Custom IDE] 載入 ${customIDEs.length} 個自訂 IDE`);
    console.log(`[Custom IDE] Loading ${customIDEs.length} custom IDEs`);

    // 逐個處理自訂 IDE
    // Process each custom IDE
    for (const customIDE of customIDEs) {
      const settingsJsonPath = path.join(customIDE.path, 'settings.json');

      console.log(`[Custom IDE] 檢查自訂 IDE: ${customIDE.name} at ${customIDE.path}`);
      console.log(`[Custom IDE] Checking custom IDE: ${customIDE.name} at ${customIDE.path}`);

      // 檢查 settings.json 是否存在
      // Check if settings.json exists
      if (fs.existsSync(settingsJsonPath)) {
        try {
          // 使用 IdeSettingProvider 載入設定檔案
          // Use IdeSettingProvider to load settings file
          const settingProvider = new IdeSettingProvider(customIDE.path, settingsJsonPath);
          settingProvider.load();

          // 成功載入，新增到 IDE 列表並附加 provider
          // Successfully loaded, add to IDE list with provider
          this.ideList.push({
            name: customIDE.name,
            type: EnumIDEInfoType.custom,
            available: true,
            nativePath: customIDE.path,
            settingProvider,
          });

          console.log(`[Custom IDE] ✓ 成功載入自訂 IDE: ${customIDE.name}`);
          console.log(`[Custom IDE] ✓ Successfully loaded custom IDE: ${customIDE.name}`);
        } catch (error) {
          // settings.json 存在但無法解析
          // settings.json exists but cannot be parsed
          console.error(
            `[Custom IDE] ✗ 無法讀取或解析 ${customIDE.name} 的設定:`,
            error
          );
          console.error(
            `[Custom IDE] ✗ Failed to read or parse settings for ${customIDE.name}:`,
            error
          );

          // 標記為不可用
          // Mark as unavailable
          this.unavailableIDEs.push({
            name: customIDE.name,
            type: EnumIDEInfoType.custom,
            expectedPath: customIDE.path,
          });
        }
      } else {
        // settings.json 檔案不存在
        // settings.json file does not exist
        console.log(
          `[Custom IDE] ✗ 無法找到 ${customIDE.name} 的 settings.json: ${settingsJsonPath}`
        );
        console.log(
          `[Custom IDE] ✗ Cannot find settings.json for ${customIDE.name}: ${settingsJsonPath}`
        );

        // 標記為不可用
        // Mark as unavailable
        this.unavailableIDEs.push({
          name: customIDE.name,
          type: EnumIDEInfoType.custom,
          expectedPath: customIDE.path,
        });
      }
    }
  }

  /**
   * 根據應用名稱和資料夾名稱構造用戶資料路徑
   * Construct user data path based on app and folder names
   *
   * @param appName - 應用程式名稱 / Application name (e.g., "Code - Insiders")
   * @param folderName - 資料夾名稱 / Folder name (e.g., "User")
   * @returns 完整的用戶資料路徑 / Full user data path
   *
   * 範例 (Example):
   * - Windows: C:\Users\{User}\AppData\Roaming\Code - Insiders\User
   * - macOS: ~/.config/Code - Insiders/User
   * - Linux: ~/.config/Code - Insiders/User
   */
  private getUserDataPath(appName: string, folderName: string): string {
    // 取得平台相關的應用資料目錄
    // Get platform-specific application data directory
    // Windows: %APPDATA% env var
    // macOS/Linux: $HOME/.config or similar
    const userDataDir = process.env.APPDATA || process.env.HOME || '';

    if (!userDataDir) {
      console.warn('[IDE Detection] 警告：無法確定系統的應用資料目錄');
      console.warn('[IDE Detection] Warning: Cannot determine system app data directory');
    }

    // 合併路徑部分
    // Join path segments
    const fullPath = path.join(userDataDir, appName, folderName);

    console.log(`[Path Resolution] ${appName}/${folderName} -> ${fullPath}`);

    return fullPath;
  }

  /**
   * 取得可用的 IDE 列表
   * Get list of available IDEs
   *
   * @returns 成功偵測到的 IDE 陣列 / Array of successfully detected IDEs
   */
  getIDEList(): IIDEInfo[] {
    return this.ideList;
  }

  /**
   * 用於 WebviewContent
   *
   * @see src/webview/settingsSyncPanel.ts
   * @example let ideList = ${JSON.stringify(this.ideProvider.getIDEListToWebviewContent())};
   */
  getIDEListToWebviewContent()
  {
    return this.ideList.map(ide => {
      return {
        ...ide,
        settings: ide.settingProvider.load().valueOf(),
      }
    })
  }

  /**
   * 取得不可用的 IDE 列表
   * Get list of unavailable IDEs
   *
   * 不可用的 IDE 包括：
   * - 在偵測清單中但系統上未找到的 IDE
   * - 路徑存在但無法讀取設定檔案的 IDE
   *
   * @returns 不可用的 IDE 陣列 / Array of unavailable IDEs
   */
  getUnavailableIDEs(): IUnavailableIDE[] {
    return this.unavailableIDEs;
  }

  /**
   * 取得可用 IDE 的數量
   * Get count of available IDEs
   *
   * @returns 可用 IDE 的數量 / Number of available IDEs
   */
  getAvailableIDECount(): number {
    return this.ideList.length;
  }

  getIdeByIndex(ideIndex: number, isCustomIDE?: boolean)
  {
    // 驗證索引有效性 / Validate index is within bounds
    if (ideIndex >= 0 || ideIndex < this.ideList.length)
    {
      return this.ideList[ideIndex];
    }

    console.warn(`[${isCustomIDE ? 'Custom ' : ''}IDE] 無效的索引 / Invalid index: ${ideIndex}`);
  }

  /**
   * 取得 IDE 的設定值
   * Get setting value from an IDE
   *
   * 支援嵌套設定鍵（例如 "editor.fontFamily" 會查找 settings.editor.fontFamily）
   * Supports nested setting keys (e.g., "editor.fontFamily" looks for settings.editor.fontFamily)
   *
   * @param ideIndex - IDE 在列表中的索引 / Index of IDE in list
   * @param settingKey - 設定鍵值，使用點號分隔嵌套層級 / Setting key with dot notation for nested levels
   * @returns 設定值，如果不存在返回 undefined / Setting value or undefined if not found
   */
  async getSettingValue(ideIndex: number, settingKey: string): Promise<any> {
    const ide = this.getIdeByIndex(ideIndex);

    return ide?.settingProvider.load().get([settingKey]);
  }

  /**
   * 設定 IDE 的設定值
   * Set setting value in an IDE
   *
   * 此方法會：
   * 1. 驗證 IDE 索引
   * 2. 在內存中更新設定值（建立必要的嵌套物件）
   * 3. 將更新寫入 settings.json 檔案
   *
   * @param ideIndex - IDE 在列表中的索引 / Index of IDE in list
   * @param settingKey - 設定鍵值，支援嵌套 / Setting key with dot notation
   * @param value - 要設定的值 / Value to set
   */
  async setSetting(ideIndex: number, settingKey: string, value: any): Promise<void> {
    const ide = this.getIdeByIndex(ideIndex);

    if (ide)
    {
      ide.settingProvider.set([settingKey], value);
      // ide?.settingProvider.save();

      console.log(
        `[Settings Update] 已更新 ${ide.name} 的設定: ${settingKey} = ${JSON.stringify(value)}`
      );
    }
  }

  saveSync(sourceIDEIndex: number, targetIDEIndices: number[])
  {
    targetIDEIndices = [
      ...targetIDEIndices,
      sourceIDEIndex,
    ];

    console.log(
      `[Settings Sync] 開始同步 ${targetIDEIndices} 的設定`
    );

    for (const ideIndex of targetIDEIndices)
    {
      const ide = this.getIdeByIndex(ideIndex);

      if (ide)
      {
        ide.settingProvider.load().save();

        console.log(
          `[Settings Sync] 已同步 ${ide.name} 的設定`
        );
      }
    }
  }

  /**
   * 刪除 IDE 的設定值
   * Delete setting value from an IDE
   *
   * @param ideIndex - IDE 在列表中的索引 / Index of IDE in list
   * @param settingKey - 設定鍵值，支援嵌套 / Setting key with dot notation
   */
  async deleteSetting(ideIndex: number, settingKey: string): Promise<void> {
    const ide = this.getIdeByIndex(ideIndex)!;

    const deleted = ide?.settingProvider.delete([settingKey]);
    if (deleted) {
      // ide.settingProvider.save();
      console.log(`[Settings Delete] 已從 ${ide.name} 刪除: ${settingKey}`);
    }
  }

  /**
   * 添加自訂 IDE 路徑
   * Add a custom IDE path
   *
   * @param name - 自訂 IDE 的顯示名稱 / Display name for custom IDE
   * @param settingsPath - IDE 設定資料夾的完整路徑 / Full path to IDE settings folder
   */
  async addCustomIDE(name: string, settingsPath: string): Promise<void> {
    // 從全域狀態讀取現有自訂 IDE 列表 / Read existing custom IDE list
    const customIDEs = this.context.globalState.get<Array<{ name: string; path: string }>>(
      EnumGlobalStateName.customIDEs,
      []
    );

    // 檢查路徑是否已存在 / Check if path already exists
    const alreadyExists = customIDEs.some((ide) => ide.path === settingsPath);
    if (alreadyExists) {
      console.warn(`[Custom IDE] 路徑已存在 / Path already exists: ${settingsPath}`);
      return;
    }

    // 添加新的自訂 IDE / Add new custom IDE
    customIDEs.push({ name, path: settingsPath });
    await this.context.globalState.update(EnumGlobalStateName.customIDEs, customIDEs);

    console.log(`[Custom IDE] 已添加 / Added: ${name} at ${settingsPath}`);

    // 重新整理以驗證新路徑 / Refresh to validate new path
    await this.refreshIDEList();
  }

  /**
   * 移除自訂 IDE 路徑
   * Remove a custom IDE path
   *
   * @param ideIndex - IDE 在列表中的索引 / Index of IDE in list
   */
  async removeCustomIDE(ideIndex: number): Promise<void> {
    const ide = this.getIdeByIndex(ideIndex, true);

    if (!ide)
    {
      return;
    }

    // 只允許移除自訂 IDE，不能移除內建 IDE / Only allow removal of custom IDEs
    if (ide.type === EnumIDEInfoType.custom) {
      // 從全域狀態讀取自訂 IDE 列表 / Read custom IDE list from global state
      const customIDEs = this.context.globalState.get<Array<{ name: string; path: string }>>(
        EnumGlobalStateName.customIDEs,
        []
      );

      // 過濾掉要移除的 IDE / Filter out the IDE to be removed
      const filtered = customIDEs.filter((c) => c.path !== ide.nativePath);
      await this.context.globalState.update(EnumGlobalStateName.customIDEs, filtered);

      console.log(`[Custom IDE] 已移除 / Removed: ${ide.name}`);

      // 重新整理 IDE 列表 / Refresh IDE list
      await this.refreshIDEList();
    } else {
      // 試圖移除內建 IDE / Attempted to remove built-in IDE
      console.warn(`[Custom IDE] 無法移除內建 IDE / Cannot remove built-in IDE: ${ide.name}`);
    }
  }
}
