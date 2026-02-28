# VS Code IDE Settings Sync Extension

## 專案概述

一個用於跨多個 VS Code IDE 同步設定的 VS Code 擴充功能。支援 Antigravity、VS Code Insiders、CodeBuddy CN、自訂路徑等多種 IDE 的設定同步。

## 技術棧

- **Language**: TypeScript
- **Package Manager**: pnpm
- **Build Tool**: esbuild
- **Min VS Code**: 1.85.0
- **Test Framework**: Jest

## 核心功能

### IDE 偵測
自動偵測以下 IDE：
- Visual Studio Code
- VS Code Insiders
- Antigravity
- CodeBuddy CN
- 自訂 IDE 路徑

> 💡 詳細資訊請參考 [已支援的 IDE 清單](../docs/supported-ides.md)

### 設定管理
- **自訂 IDE 支援**：透過 UI 新增自訂 IDE 路徑
- **設定搜尋**：搜尋特定 VS Code 設定
- **設定預覽**：同步前檢視所有偵測到的 IDE 中的目前值
- **設定同步**：將選取的設定從來源 IDE 同步到多個目標 IDE
- **設定刪除**：從 IDE 移除特定設定
- **設定描述**：內建常見 VS Code 設定的描述（使用 i18n 資料）

## 專案結構

```
src/
├── extension.ts              # 擴充功能主入口點
├── types.ts                  # TypeScript 類型定義
├── providers/
│   ├── ideProvider.ts       # IDE 偵測與設定管理
│   └── ideSettingProvider.ts # IDE 設定提供者
├── webview/
│   ├── settingsSyncPanel.ts # WebView UI 元件
│   └── settingsSyncPanel.scss # 樣式
├── utils/
│   ├── json.ts              # JSON 工具函式 (使用 jsonc-parser)
│   └── settingsDescriptions.ts # 設定描述對應表
test/                        # Jest 單元測試
    ├── providers/
    │   └── ideSettingProvider.test.ts
    └── utils/
        └── json.test.ts
```

## 建置與測試

### 建置

```bash
pnpm run esbuild
```

### 單元測試

```bash
# 執行所有測試
pnpm run test:unit

# 含覆蓋率
pnpm run test:unit:coverage
```

### 生產建置

```bash
pnpm run vscode:prepublish
```

產出檔案：
- `dist/extension.js` - 打包後的擴充功能
- `dist/extension.js.map` - 原始碼對應表

## 如何執行

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

## 開發規範

- 使用 TypeScript 嚴格模式
- 所有 API 需有 JSDoc 註解
- 測試檔案使用 Jest
- 優先使用 snapshot 測試
- 遵循現有程式碼風格

## 快捷鍵

| 功能 | Windows/Linux | macOS |
|------|---------------|-------|
| 開啟設定同步面板 | `Ctrl+Shift+Alt+S` | `Cmd+Shift+Alt+S` |
| 重新整理 IDE 清單 | `Ctrl+Shift+Alt+R` | `Cmd+Shift+Alt+R` |

## 依賴套件

### 主要依賴
- `jsonc-parser` - 處理 JSON 註解
- `js-yaml` - YAML 解析
- `ts-type` - TypeScript 類型增強

### 開發依賴
- `esbuild` - 打包工具
- `jest` / `ts-jest` - 測試框架
- `typescript` - 語言編譯器
- `sass` - CSS 預處理器

## 文件目標讀者分組

| 檔案 | 目標讀者 | 內容焦點 |
| - | - | - |
| README.md | 使用者 (End Users) | 功能介紹、安裝說明、使用方法、常見問題、疑難排解 |
| QUICKSTART.md | 開發者 (Extension Developers) | 開發環境設定、建置指令、測試方式、發布流程、專案結構 |
| .github/copilot-instructions.md | AI Agent | 技術棧、專案結構、開發規範、測試與建置命令 |
