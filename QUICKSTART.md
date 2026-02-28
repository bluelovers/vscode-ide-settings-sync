# 開發者快速入門指南

本指南適用於想要開發或貢獻此擴充功能的開發者。

## 前置需求

- Visual Studio Code 1.85.0 或更高版本
- Node.js 18+
- pnpm 11.0.0-dev

## 安裝依賴

```bash
pnpm install
```

## 開發模式

### 建置擴充功能

```bash
pnpm run esbuild
```

### 監聽模式（自動重新建置）

```bash
pnpm run esbuild-watch
```

### 啟動擴充功能開發模式 (VS Code 中按 F5)
1. 在 VS Code 中按 `F5`
   - 會在新的 VS Code 視窗中啟動擴充功能主機
2. 擴充功能會自動載入
3. 開啟命令選擇區（`Ctrl+Shift+P` / `Cmd+Shift+P`）
   - 搜尋並執行："Open IDE Settings Sync Panel"
4. 在面板中操作：
   - 選擇要同步的多個 IDE
   - 搜尋特定設定
   - 檢視各 IDE 的目前值
   - 同步或刪除選取的設定
5. 擴充功能會：
   - 自動偵測所有相容的 IDE
   - 顯示 WebView 同步介面
   - 允許搜尋和同步設定

## 測試

### 單元測試

```bash
# 執行所有測試
pnpm run test:unit

# 監聽模式
pnpm run test:unit:watch

# 含覆蓋率
pnpm run test:unit:coverage
```

### 整合測試

```bash
pnpm run test
```

## 生產環境建置

建立優化的生產環境建置：

```bash
pnpm run vscode:prepublish
```

產出檔案：
- `dist/extension.js` - 打包後的擴充功能
- `dist/extension.js.map` - 原始碼對應表

## 專案結構

```
src/
├── extension.ts              # 擴充功能主入口
├── types.ts                  # TypeScript 類型定義
├── providers/
│   ├── ideProvider.ts       # IDE 偵測與設定管理
│   └── ideSettingProvider.ts # IDE 設定提供者
├── webview/
│   ├── settingsSyncPanel.ts # WebView UI 元件
│   └── settingsSyncPanel.scss # 樣式
├── utils/
│   ├── json.ts              # JSON 工具函式
│   └── settingsDescriptions.ts # 設定描述對應表
test/
├── providers/
│   └── ideSettingProvider.test.ts
└── utils/
    └── json.test.ts
```

## 快捷鍵

| 功能 | Windows/Linux | macOS |
|------|---------------|-------|
| 開啟設定同步面板 | `Ctrl+Shift+Alt+S` | `Cmd+Shift+Alt+S` |
| 重新整理 IDE 清單 | `Ctrl+Shift+Alt+R` | `Cmd+Shift+Alt+R` |

## 發布至 Marketplace

1. 更新 `package.json` 中的版本號
2. 執行生產建置：`pnpm run vscode:prepublish`
3. 使用 `vsce` 發布：

```bash
npm install -g @vscode/vsce
vsce publish
```

## 相關連結

- [完整 README](./README.md) - 使用者文件
- [Copilot 指令](./.github/copilot-instructions.md) - AI 開發規範
- [已支援的 IDE 清單](./docs/supported-ides.md) - 支援的 IDE 與路徑
- [VS Code 擴充功能開發文件](https://code.visualstudio.com/api)
