# 獨立 IDE 偵測功能使用指南
# Standalone IDE Detection Usage Guide

## 概述 / Overview

獨立 IDE 偵測功能提供了一個不依賴 VSCode 擴展架構的 IDE 偵測解決方案，可以在任何 Node.js 環境中使用。

The standalone IDE detection feature provides an IDE detection solution that does not depend on the VSCode extension architecture and can be used in any Node.js environment.

## 主要特點 / Key Features

- ✅ **完全獨立** / **Completely Independent**: 不依賴 VSCode 擴展 API
- ✅ **參數化配置** / **Parameterized Configuration**: 支援自訂用戶資料目錄、日誌等
- ✅ **CustomIDEs 支援** / **CustomIDEs Support**: 完整的自訂 IDE 偵測功能
- ✅ **多種使用方式** / **Multiple Usage Methods**: 類別、便利函數、Provider 等
- ✅ **TypeScript 支援** / **TypeScript Support**: 完整的類型定義

## 快速開始 / Quick Start

### 1. 基本使用 / Basic Usage

```typescript
import { IDEDetector, knownIDEs } from './src/utils/ideDetector';

// 創建偵測器
// Create detector
const detector = new IDEDetector({
  verbose: true,
  logger: (message) => console.log(message),
});

// 偵測所有已知 IDE
// Detect all known IDEs
const results = detector.detectIDEs([...knownIDEs]);

console.log(`偵測到 ${results.filter(r => r.detected).length} 個 IDE`);
console.log(`Detected ${results.filter(r => r.detected).length} IDEs`);
```

### 2. 使用便利函數 / Using Convenience Functions

```typescript
import { detectIDEs, detectCustomIDEs, detectAllIDEs } from './src/utils/ideDetector';

// 偵測已知 IDE
// Detect known IDEs
const knownResults = detectIDEs([...knownIDEs]);

// 偵測自訂 IDE
// Detect custom IDEs
const customIDEs = [
  { name: 'My IDE', path: '/path/to/my/ide' },
];
const customResults = detectCustomIDEs(customIDEs);

// 整合偵測
// Integrated detection
const allResults = detectAllIDEs([...knownIDEs], customIDEs);
```

### 3. 使用 StandaloneProvider / Using StandaloneProvider

```typescript
import { createStandaloneIDEProvider, quickDetectIDEs } from './src/providers/standaloneIDEProvider';

// 創建 Provider
// Create provider
const provider = createStandaloneIDEProvider([...knownIDEs], {
  verbose: true,
  customIDEs: [
    { name: 'My IDE', path: '/path/to/my/ide' },
  ],
});

// 刷新偵測
// Refresh detection
await provider.refresh();

// 取得結果
// Get results
const available = provider.getAvailableIDEs();
const statistics = provider.getStatistics();

console.log(`偵測率: ${(statistics.detectionRate * 100).toFixed(1)}%`);
console.log(`Detection Rate: ${(statistics.detectionRate * 100).toFixed(1)}%`);
```

## CustomIDEs 功能 / CustomIDEs Functionality

### 添加自訂 IDE / Adding Custom IDEs

```typescript
const customIDEs = [
  {
    name: 'My Custom IDE 1',
    path: 'C:\\Program Files\\MyIDE',
  },
  {
    name: 'My Custom IDE 2',
    path: '/Users/myuser/.config/MyIDE',
  },
];

const results = detectCustomIDEs(customIDEs, {
  verbose: true,
});
```

### 自訂 IDE 偵測邏輯 / Custom IDE Detection Logic

自訂 IDE 的偵測會嘗試以下路徑：
Custom IDE detection tries the following paths:

1. `{path}/settings.json`
2. `{path}/User/settings.json`

## 執行方式 / Execution Methods

### 使用 tsx / Using tsx

```bash
# 直接執行 TypeScript 檔案
# Directly execute TypeScript file
npx tsx test/custom-ide-demo.ts

# 或安裝 tsx
# Or install tsx
npm install -g tsx
tsx test/custom-ide-demo.ts
```

### 使用 ts-node / Using ts-node

```bash
# 使用 ts-node
# Use ts-node
npx ts-node test/custom-ide-demo.ts

# 或安裝 ts-node
# Or install ts-node
npm install -g ts-node
ts-node test/custom-ide-demo.ts
```

### 編譯後執行 / Execute After Compilation

```bash
# 編譯專案
# Compile project
pnpm run build

# 執行編譯後的檔案
# Execute compiled file
node dist/examples/standalone-detection-demo.js
```

## 配置選項 / Configuration Options

### IDetectionConfig

```typescript
interface IDetectionConfig {
  // 自訂用戶資料目錄
  // Custom user data directory
  userDataDir?: string;
  
  // 啟用詳細日誌
  // Enable verbose logging
  verbose?: boolean;
  
  // 自訂日誌函數
  // Custom log function
  logger?: (message: string) => void;
  
  // 自訂 IDE 列表
  // Custom IDE list
  customIDEs?: ICustomIDEConfig[];
}
```

### ICustomIDEConfig

```typescript
interface ICustomIDEConfig {
  name: string;
  path: string;
}
```

## API 參考 / API Reference

### IDEDetector 類別 / IDEDetector Class

```typescript
class IDEDetector {
  constructor(config?: IDetectionConfig);
  
  // 偵測單個 IDE
  // Detect single IDE
  detectIDE(ide: IKnownIDE): IDetectionResult;
  
  // 偵測多個 IDE
  // Detect multiple IDEs
  detectIDEs(ides: IKnownIDE[]): IDetectionResult[];
  
  // 偵測自訂 IDE
  // Detect custom IDEs
  detectCustomIDEs(customIDEs: ICustomIDEConfig[]): IDetectionResult[];
  
  // 偵測所有 IDE
  // Detect all IDEs
  detectAllIDEs(knownIDEs: IKnownIDE[], customIDEs?: ICustomIDEConfig[]): {
    knownResults: IDetectionResult[];
    customResults: IDetectionResult[];
    allResults: IDetectionResult[];
  };
  
  // 取得已偵測的 IDE
  // Get detected IDEs
  getDetectedIDEs(ides: IKnownIDE[]): IDetectionResult[];
  
  // 取得未偵測的 IDE
  // Get undetected IDEs
  getUndetectedIDEs(ides: IKnownIDE[]): IDetectionResult[];
}
```

### 便利函數 / Convenience Functions

```typescript
// 偵測單個 IDE
// Detect single IDE
function detectIDE(ide: IKnownIDE, config?: IDetectionConfig): IDetectionResult;

// 偵測多個 IDE
// Detect multiple IDEs
function detectIDEs(ides: IKnownIDE[], config?: IDetectionConfig): IDetectionResult[];

// 偵測自訂 IDE
// Detect custom IDEs
function detectCustomIDEs(customIDEs: ICustomIDEConfig[], config?: IDetectionConfig): IDetectionResult[];

// 偵測所有 IDE
// Detect all IDEs
function detectAllIDEs(knownIDEs: IKnownIDE[], customIDEs?: ICustomIDEConfig[], config?: IDetectionConfig): {
  knownResults: IDetectionResult[];
  customResults: IDetectionResult[];
  allResults: IDetectionResult[];
};

// 取得已偵測的 IDE
// Get detected IDEs
function getDetectedIDEs(ides: IKnownIDE[], config?: IDetectionConfig): IDetectionResult[];

// 取得未偵測的 IDE
// Get undetected IDEs
function getUndetectedIDEs(ides: IKnownIDE[], config?: IDetectionConfig): IDetectionResult[];
```

### StandaloneIDEProvider 類別 / StandaloneIDEProvider Class

```typescript
class StandaloneIDEProvider {
  constructor(knownIDEs: IKnownIDE[], config?: IProviderConfig);
  
  // 重新偵測
  // Refresh detection
  async refresh(): Promise<IDetectionResult[]>;
  
  // 取得所有 IDE
  // Get all IDEs
  getAllIDEs(): IStandaloneIDEInfo[];
  
  // 取得可用的 IDE
  // Get available IDEs
  getAvailableIDEs(): IStandaloneIDEInfo[];
  
  // 取得不可用的 IDE
  // Get unavailable IDEs
  getUnavailableIDEs(): IDetectionResult[];
  
  // 取得統計資訊
  // Get statistics
  getStatistics(): {
    total: number;
    detected: number;
    undetected: number;
    detectionRate: number;
  };
  
  // 匯出結果
  // Export results
  exportResults(): string;
  
  // 管理 CustomIDEs
  // Manage CustomIDEs
  setCustomIDEs(customIDEs: ICustomIDEConfig[]): void;
  addCustomIDE(customIDE: ICustomIDEConfig): void;
  removeCustomIDE(name: string): boolean;
}
```

## 範例 / Examples

### 完整範例 / Complete Example

```typescript
import { createStandaloneIDEProvider, knownIDEs } from './src/providers/standaloneIDEProvider';

async function main() {
  // 創建 Provider
  // Create provider
  const provider = createStandaloneIDEProvider([...knownIDEs], {
    verbose: true,
    customIDEs: [
      { name: 'My Custom IDE', path: '/path/to/my/ide' },
    ],
  });

  // 偵測 IDE
  // Detect IDEs
  await provider.refresh();

  // 顯示結果
  // Show results
  const stats = provider.getStatistics();
  const available = provider.getAvailableIDEs();

  console.log(`偵測統計 / Detection Statistics:`);
  console.log(`- 總計 / Total: ${stats.total}`);
  console.log(`- 已偵測 / Detected: ${stats.detected}`);
  console.log(`- 偵測率 / Detection Rate: ${(stats.detectionRate * 100).toFixed(1)}%`);

  console.log(`\n可用的 IDEs / Available IDEs:`);
  available.forEach((ide, index) => {
    console.log(`${index + 1}. ${ide.name}`);
    console.log(`   路徑 / Path: ${ide.nativePath}`);
  });

  // 匯出結果
  // Export results
  const exported = provider.exportResults();
  console.log(`\n匯出結果 / Exported Results:`, exported);
}

main().catch(console.error);
```

## 故障排除 / Troubleshooting

### 常見問題 / Common Issues

1. **找不到 IDE / IDE Not Found**
   - 檢查路徑是否正確
   - 確認 settings.json 檔案存在
   - 檢查檔案權限

2. **TypeScript 編譯錯誤 / TypeScript Compilation Error**
   - 使用 tsx 或 ts-node 直接執行
   - 確保安裝了必要的依賴

3. **自訂 IDE 偵測失敗 / Custom IDE Detection Failed**
   - 檢查提供的路徑格式
   - 確認 settings.json 檔案位置

### 調試技巧 / Debugging Tips

```typescript
// 啟用詳細日誌
// Enable verbose logging
const detector = new IDEDetector({
  verbose: true,
  logger: (message) => console.log(`[DEBUG] ${message}`),
});

// 檢查偵測結果
// Check detection results
const results = detector.detectIDEs([...knownIDEs]);
results.forEach(result => {
  console.log(`${result.name}: ${result.detected ? '✅' : '❌'}`);
  if (!result.detected) {
    console.log(`  原因 / Reason: ${result.reason}`);
    console.log(`  嘗試路徑 / Attempted Paths: ${result.attemptedPaths.join(', ')}`);
  }
});
```

## 整合到現有專案 / Integration into Existing Projects

### VSCode 擴展整合 / VSCode Extension Integration

```typescript
// 在擴展的 activate 函數中
// In the extension's activate function
import { IDEDetector } from './src/utils/ideDetector';

export function activate(context: vscode.ExtensionContext) {
  const detector = new IDEDetector({
    verbose: true,
    logger: (message) => vscode.window.showInformationMessage(message),
  });

  // 使用偵測器
  // Use detector
  const results = detector.detectIDEs([...knownIDEs]);
  
  // 處理結果...
  // Handle results...
}
```

### Node.js 應用整合 / Node.js Application Integration

```typescript
// 在任何 Node.js 應用中使用
// Use in any Node.js application
import { quickDetectIDEs } from './src/providers/standaloneIDEProvider';

async function detectIDEsInApp() {
  const results = await quickDetectIDEs([...knownIDEs], {
    customIDEs: [
      { name: 'App IDE', path: process.env.CUSTOM_IDE_PATH },
    ],
  });

  return results;
}
```

## 貢獻 / Contributing

歡迎提交 Issue 和 Pull Request 來改進獨立 IDE 偵測功能！

Welcome to submit Issues and Pull Requests to improve the standalone IDE detection feature!

## 授權 / License

本專案採用 MIT 授權條款。

This project is licensed under the MIT License.
