import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IDEInfo, SettingsData, UnavailableIDE } from '../types';

export class IDEProvider {
  private ideList: IDEInfo[] = [];
  private unavailableIDEs: UnavailableIDE[] = [];
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async refreshIDEList(): Promise<void> {
    this.ideList = [];
    this.unavailableIDEs = [];
    
    // Detect known IDEs
    await this.detectKnownIDEs();
    
    // Load custom IDE paths from settings
    await this.loadCustomIDEs();
  }

  private async detectKnownIDEs(): Promise<void> {
    // 為每個IDE定義可能的多個路徑
    const knownIDEs = [
      {
        name: 'Visual Studio Code',
        appFolderNames: ['Code'],
      },
      {
        name: 'Visual Studio Code - Insiders',
        appFolderNames: ['Code - Insiders', 'Code-Insiders'], // 支援多種命名方式
      },
      {
        name: 'Antigravity',
        appFolderNames: ['Antigravity'],
      },
      {
        name: 'CodeBuddy CN',
        appFolderNames: ['CodeBuddy CN', 'CodeBuddyCN'],
      },
    ];

    for (const ide of knownIDEs) {
      let foundPath: string | null = null;
      let detectedPath: string | null = null;

      // 嘗試多個可能的路徑
      for (const appFolderName of ide.appFolderNames) {
        const testPath = this.getUserDataPath(appFolderName, 'User');
        const settingsJsonPath = path.join(testPath, 'settings.json');

        console.log(`[IDE Detection] 嘗試檢測 ${ide.name} at ${testPath}`);

        // 檢查路徑是否存在
        if (fs.existsSync(testPath)) {
          detectedPath = testPath;
          console.log(`[IDE Detection] 找到文件夾 ${ide.name} at ${testPath}`);

          // 檢查 settings.json 是否存在
          if (fs.existsSync(settingsJsonPath)) {
            foundPath = testPath;
            console.log(`[IDE Detection] ✓ 成功檢測到 ${ide.name}`);
            break;
          } else {
            console.log(`[IDE Detection] 文件夾存在但找不到 settings.json at ${settingsJsonPath}`);
          }
        }
      }

      // 嘗試加載 IDE
      if (foundPath) {
        const settingsJsonPath = path.join(foundPath, 'settings.json');
        try {
          const settings = JSON.parse(fs.readFileSync(settingsJsonPath, 'utf-8'));
          this.ideList.push({
            name: ide.name,
            settingsPath: foundPath,
            settingsJsonPath,
            settings,
            type: 'known',
            available: true,
            nativePath: foundPath,
          });
        } catch (error) {
          console.error(`[IDE Detection] ✗ 讀取設定失敗 ${ide.name}:`, error);
          this.unavailableIDEs.push({
            name: ide.name,
            type: 'known',
            expectedPath: detectedPath || foundPath,
          });
        }
      } else {
        // IDE 未檢測到
        const defaultPath = this.getUserDataPath(ide.appFolderNames[0], 'User');
        console.log(`[IDE Detection] ✗ 未檢測到 ${ide.name}`);
        this.unavailableIDEs.push({
          name: ide.name,
          type: 'known',
          expectedPath: detectedPath || defaultPath,
        });
      }
    }
  }

  private async loadCustomIDEs(): Promise<void> {
    const customIDEs = this.context.globalState.get<Array<{ name: string; path: string }>>(
      'customIDEs',
      []
    );

    for (const customIDE of customIDEs) {
      const settingsJsonPath = path.join(customIDE.path, 'settings.json');
      if (fs.existsSync(settingsJsonPath)) {
        try {
          const settings = JSON.parse(fs.readFileSync(settingsJsonPath, 'utf-8'));
          this.ideList.push({
            name: customIDE.name,
            settingsPath: customIDE.path,
            settingsJsonPath,
            settings,
            type: 'custom',
            available: true,
            nativePath: customIDE.path,
          });
        } catch (error) {
          console.error(`Error reading custom IDE settings:`, error);
          this.unavailableIDEs.push({
            name: customIDE.name,
            type: 'custom',
            expectedPath: customIDE.path,
          });
        }
      } else {
        // Custom IDE not found
        this.unavailableIDEs.push({
          name: customIDE.name,
          type: 'custom',
          expectedPath: customIDE.path,
        });
      }
    }
  }

  private getUserDataPath(appName: string, folderName: string): string {
    const userDataDir = process.env.APPDATA || process.env.HOME || '';
    return path.join(userDataDir, appName, folderName);
  }

  getIDEList(): IDEInfo[] {
    return this.ideList;
  }

  getUnavailableIDEs(): UnavailableIDE[] {
    return this.unavailableIDEs;
  }

  getAvailableIDECount(): number {
    return this.ideList.length;
  }

  async getSettingValue(ideIndex: number, settingKey: string): Promise<any> {
    if (ideIndex >= 0 && ideIndex < this.ideList.length) {
      const keys = settingKey.split('.');
      let value = this.ideList[ideIndex].settings;
      for (const key of keys) {
        value = value?.[key];
      }
      return value;
    }
    return undefined;
  }

  async setSetting(ideIndex: number, settingKey: string, value: any): Promise<void> {
    if (ideIndex >= 0 && ideIndex < this.ideList.length) {
      const ide = this.ideList[ideIndex];
      const keys = settingKey.split('.');
      let obj = ide.settings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') {
          obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
      }
      
      obj[keys[keys.length - 1]] = value;
      
      // Write to file
      fs.writeFileSync(ide.settingsJsonPath, JSON.stringify(ide.settings, null, 2), 'utf-8');
    }
  }

  async deleteSetting(ideIndex: number, settingKey: string): Promise<void> {
    if (ideIndex >= 0 && ideIndex < this.ideList.length) {
      const ide = this.ideList[ideIndex];
      const keys = settingKey.split('.');
      let obj = ide.settings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') {
          return;
        }
        obj = obj[keys[i]];
      }
      
      delete obj[keys[keys.length - 1]];
      
      // Write to file
      fs.writeFileSync(ide.settingsJsonPath, JSON.stringify(ide.settings, null, 2), 'utf-8');
    }
  }

  async addCustomIDE(name: string, settingsPath: string): Promise<void> {
    const customIDEs = this.context.globalState.get<Array<{ name: string; path: string }>>(
      'customIDEs',
      []
    );
    
    customIDEs.push({ name, path: settingsPath });
    await this.context.globalState.update('customIDEs', customIDEs);
    
    await this.refreshIDEList();
  }

  async removeCustomIDE(ideIndex: number): Promise<void> {
    const ide = this.ideList[ideIndex];
    if (ide.type === 'custom') {
      const customIDEs = this.context.globalState.get<Array<{ name: string; path: string }>>(
        'customIDEs',
        []
      );
      
      const filtered = customIDEs.filter((c) => c.path !== ide.settingsPath);
      await this.context.globalState.update('customIDEs', filtered);
      
      await this.refreshIDEList();
    }
  }
}
