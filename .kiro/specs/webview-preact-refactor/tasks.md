# Implementation Plan: webview-preact-refactor

## Overview

將 `src/webview/settingsSyncPanel.ts` 中的混合式 HTML 字串注入重構為完全使用 Preact JSX 的架構。建立獨立的 `webview/` 前端資料夾，由 esbuild 打包為 IIFE bundle；Extension host 端改為純 SSR 模式，所有 client-side 互動邏輯移至 `webview/src/` TypeScript 模組。

## Tasks

- [x] 1. 設定雙 Bundle 建置系統
  - 修改 `esbuild.config.ts`，新增第二個 entry point：`webview/src/index.tsx` → `dist/webview/index.js`
  - Webview bundle 設定：`format: 'iife'`、`platform: 'browser'`、不排除任何外部模組
  - Extension bundle 保留現有設定：`format: 'cjs'`、`platform: 'node'`、`external: ['vscode']`、`jsxFactory: 'h'`
  - 確保 `--minify` 和 `--watch` 旗標同時套用至兩個 bundle
  - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6_

- [x] 2. 建立 `webview/` 資料夾結構與型別定義
  - [x] 2.1 建立資料夾結構與設定檔
    - 建立 `webview/src/components/tabs/` 目錄結構
    - 建立 `webview/src/scripts/` 目錄
    - 建立 `webview/tsconfig.json`，設定 `"jsxImportSource": "preact"`、`"strict": true`，並排除 Node.js / VS Code 相依
    - _Requirements: 1.1, 1.2, 1.3, 9.3_
  - [x] 2.2 建立 `webview/src/types.ts`
    - 定義 `IWebviewInitialState` 介面（`ideList`、`currentLanguage`、`languageConfig`、`currentIDEName`、`currentIDEUuid`、`savedSearchHistory`、`savedSelectedSettings`、`savedSelectedIDEs`、`settingDescriptions`）
    - 從 `src/webview/components/types.ts` 重新匯出或精簡複製 `IIDEInfoWebview`、`IUnavailableIDEInfoWebview`，避免引入 VS Code 相依
    - _Requirements: 1.6, 9.1, 9.2_

- [x] 3. 新增 SSR 組件
  - [x] 3.1 建立 `webview/src/components/LanguageConfig.tsx`
    - 定義 `ILanguageConfigProps`（`languageConfig: ILanguageConfig`、`supportedLanguages`、`currentLanguage`）
    - 渲染 primary language `<select id="primaryLang">`，含 `onclick="changePrimaryLanguage()"` 字串屬性
    - 渲染 fallback 語言標籤列表
    - 條件性渲染 secondary language 列（`showSecondary === true` 且 `secondary` 有值時）
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 3.2 為 LanguageConfig 撰寫屬性測試
    - **Property 3: LanguageConfig 組件的渲染正確性**
    - 使用 `fc.array` 產生任意 `supportedLanguages`，驗證 `<option>` 數量與陣列長度相同
    - 驗證對應 `languageConfig.primary` 的 `<option>` 具有 `selected` 屬性
    - 驗證 `showSecondary` 旗標控制 secondary language 列的顯示
    - **Validates: Requirements 4.3, 4.5**
  - [x] 3.3 建立 Tab 組件：`webview/src/components/tabs/SyncTab.tsx`
    - 渲染「Search & Sync Settings」面板靜態骨架
    - 包含 `<input id="searchInput">`、`<div id="searchResults">`、`<div id="message">`
    - 包含操作按鈕（Refresh、Save Selected、Sync Selected、Delete Selected），使用 `onclick` 字串屬性
    - _Requirements: 5.1, 5.4, 5.5_
  - [x] 3.4 建立 Tab 組件：`webview/src/components/tabs/ValuesTab.tsx`
    - 渲染「All IDE Settings」面板骨架，包含 `<div id="allSettings">` 與操作按鈕
    - _Requirements: 5.2, 5.4, 5.5_
  - [x] 3.5 建立 Tab 組件：`webview/src/components/tabs/SelectedTab.tsx`
    - 渲染「Selected Settings List」面板骨架，包含 `<div id="selectedSettingsList">` 與操作按鈕
    - _Requirements: 5.3, 5.4, 5.5_
  - [ ]* 3.6 為 Tab 組件撰寫屬性測試
    - **Property 4: Tab 組件渲染包含必要的 DOM 元素**
    - 驗證 `SyncTab` 渲染包含 `id="searchInput"`、`id="searchResults"`、`id="message"`
    - 驗證 `ValuesTab` 渲染包含 `id="allSettings"`
    - 驗證 `SelectedTab` 渲染包含 `id="selectedSettingsList"`
    - **Validates: Requirements 5.4**
  - [x] 3.7 建立 `webview/src/app.tsx` — SSR 根組件
    - 定義 `IAppProps`（`ideList`、`unavailableIDEs`、`currentIDEName`、`sourceIDEUuid`、`languageConfig`、`supportedLanguages`、`currentLanguage`、`cssContent`、`cspSource`、`webviewScriptUri`、`initialState`）
    - 組合所有 SSR 子組件：`PageHead`、`IDEListSection`、`LanguageConfig`、`SourceIdeIndicator`、`SettingsNav`、`SyncTab`、`ValuesTab`、`SelectedTab`、`ExportImportPanel`
    - 在 `<body>` 末尾注入 `<script>window.__INITIAL_STATE__ = {...};</script>` 與 `<script src={webviewScriptUri}>`
    - 產生完整的 `<!DOCTYPE html>` 文件
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ]* 3.8 為 App 組件撰寫屬性測試
    - **Property 1: getWebviewContent() 產生包含必要結構的 HTML**
    - 使用 `fc.record` 產生任意 `IAppProps`，驗證輸出包含 `<!DOCTYPE html>`、CSP meta 標籤、`window.__INITIAL_STATE__`、`id="sync"`、`id="values"`、`id="selected"`、`id="export-import"`
    - **Validates: Requirements 3.3, 3.4, 3.5**

- [x] 4. 遷移 client-side 腳本至 `webview/src/scripts/`
  - [x] 4.1 建立 `webview/src/scripts/messages.ts`
    - 定義 `showMessage(text: string, type: 'success' | 'error' | 'info'): void`
    - 實作 `window.addEventListener('message', ...)` handler，處理 `syncComplete`、`deleteComplete`、`addCustomIDEComplete`、`exportPathSelected`、`importPathSelected`、`exportComplete`、`importComplete`
    - 使用 optional chaining 存取 DOM 元素
    - _Requirements: 6.1, 6.2, 6.5, 7.2, 7.3_
  - [x] 4.2 建立 `webview/src/scripts/tabs.ts`
    - 實作 `switchTab(tabName: string): void`，切換 tab 顯示並更新 active 狀態
    - _Requirements: 6.1, 6.2, 6.5_
  - [x] 4.3 建立 `webview/src/scripts/language.ts`
    - 實作 `changePrimaryLanguage(): void`，讀取 `#primaryLang` 值並 postMessage
    - 實作 `openLanguageConfig(): void`
    - _Requirements: 6.1, 6.2, 6.5, 7.1_
  - [x] 4.4 建立 `webview/src/scripts/memory.ts`
    - 實作 `initializeMemory(): void`，從 `window.__INITIAL_STATE__` 恢復搜尋字串、已選 IDE、已選設定
    - 實作 `saveSearchHistory(): void`、`saveSearchSelectedSettings(): void`、`saveAllSelectedSettings(): void`、`saveSelectedIDEs(): void`
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 7.1_
  - [x] 4.5 建立 `webview/src/scripts/settings.ts`
    - 實作 `searchSettings(): void`、`displayAllSettings(): void`、`displaySelectedSettingsList(): void`
    - 實作 `createSettingHTML(key, values, sourceUuid?, ideRecord?): string`
    - 實作 `getSettingDescription(key: string): string`（從 `__INITIAL_STATE__.settingDescriptions` 查找）
    - 實作 `clearSearch(): void`、`removeFromSelectedSettings(key: string): void`、`clearAllSelectedSettings(): void`、`refreshSettings(): void`
    - 所有 DOM 查詢使用 optional chaining
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 7.1_
  - [x] 4.6 建立 `webview/src/scripts/sync.ts`
    - 實作 `syncSettings(): void`，收集已選 IDE 與設定後 postMessage
    - 實作 `deleteSettings(): void`
    - _Requirements: 6.1, 6.2, 6.5, 7.1, 7.4_
  - [x] 4.7 建立 `webview/src/scripts/ide.ts`（遷移自 `IDEListScript`）
    - 實作 `removeCustomIDE(params): void`、`openIDEFolder(path: string): void`、`openSettingsJson(idePath: string, ideName: string): void`
    - 實作 `addCustomIDE(): void`、`refreshIDEs(): void`、`handleSourceIDEChange(event: Event): void`
    - 在 `DOMContentLoaded` 時為 `.ide-source-radio` 綁定 `handleSourceIDEChange`
    - _Requirements: 6.1, 6.2, 6.5, 7.1, 7.4_
  - [x] 4.8 建立 `webview/src/scripts/export-import.ts`（遷移自 `ExportImportScript`）
    - 實作 `handleExportCustomIDEs()`、`handleExportSelectedSettings()`、`handleExportAll()`、`handleImport()`、`handleBrowseExportPath()`、`handleBrowseImportPath()`
    - 實作 `exportPathSelected` / `importPathSelected` 訊息處理（填入路徑輸入框）
    - _Requirements: 6.1, 6.2, 6.5, 7.1, 7.2_

- [x] 5. 建立 Webview 前端入口 `webview/src/index.tsx`
  - 讀取 `window.__INITIAL_STATE__`，以防禦性方式解構（`?? {}` fallback）
  - 初始化 `const vscode = acquireVsCodeApi()`，並匯出供腳本模組使用
  - 匯入並呼叫所有 scripts 模組的初始化函數（`initializeMemory`、message handler 等）
  - 在 `DOMContentLoaded` 後執行初始化（若 DOM 尚未就緒則延遲）
  - 將所有腳本函數掛載至 `window` 以供 `onclick` 字串屬性呼叫
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 6. 重構 `SettingsSyncPanel.getWebviewContent()`
  - 匯入新的 `App` 組件（`webview/src/app.tsx`）
  - 組裝 `IAppProps`，包含 `ideList`、`unavailableIDEs`、`languageConfig`、`supportedLanguages`、`currentLanguage`、`cssContent`、`cspSource`、`webviewScriptUri`、`initialState`
  - 使用 `panel.webview.asWebviewUri(...)` 解析 `dist/webview/index.js` 的 URI；若解析失敗則 log error 並省略 script 標籤
  - 呼叫 `renderJsxToString(App, props)` 產生完整 HTML，取代現有 template literal
  - 確保 `getWebviewContent()` 不再包含超過單行的 template literal HTML 字串
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 10.5_

- [x] 7. 移除舊的 inline script 渲染
  - [x] 7.1 移除 `IDEListSection` 中的 `<IDEListScript />` 渲染
    - 從 `IDEListSection` 的 JSX 中移除 `<IDEListScript />` 元素（JS 邏輯已移至 `webview/src/scripts/ide.ts`）
    - 保留 `IDEListScript` 函數定義（或標記為 deprecated），避免破壞現有測試
    - _Requirements: 10.3_
  - [x] 7.2 移除 `ExportImportPanel` 中的 `<ExportImportScript />` 渲染
    - 從 `ExportImportPanel` 的 JSX 中移除 `<ExportImportScript />` 元素（JS 邏輯已移至 `webview/src/scripts/export-import.ts`）
    - 保留 `ExportImportScript` 函數定義（或標記為 deprecated），避免破壞現有測試
    - _Requirements: 10.3_

- [x] 8. Checkpoint — 確認建置與測試通過
  - 執行 `npx ts-node esbuild.config.ts`，確認 `dist/extension.js` 與 `dist/webview/index.js` 均成功產生
  - 執行 `npm test`，確認所有現有測試通過，無回歸
  - 確認 `webview/tsconfig.json` 編譯零錯誤（`tsc --noEmit -p webview/tsconfig.json`）
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. 撰寫屬性測試（fast-check）
  - [ ]* 9.1 撰寫 Property 2 屬性測試：初始狀態 JSON 序列化往返
    - **Property 2: 初始狀態 JSON 序列化的完整性**
    - 使用 `fc.record` 產生任意 `IWebviewInitialState`，序列化後反序列化，驗證與原始物件等價
    - **Validates: Requirements 2.4, 3.5**
  - [ ]* 9.2 撰寫 Property 5 屬性測試：IDE data-* 屬性保留
    - **Property 5: IDE 資料的 data-* 屬性保留**
    - 使用 `fc.array(arbitraryIDEInfo(), { minLength: 1, maxLength: 10 })` 產生任意 IDE 列表
    - 驗證 `IDEListSection` 渲染的 HTML 中每個 IDE 包含正確的 `data-uuid`、`data-name`、`data-index`
    - **Validates: Requirements 7.4**
  - [ ]* 9.3 撰寫 Property 6 屬性測試：Webview 腳本函數的 null 安全性
    - **Property 6: Webview 腳本函數的 null 安全性**
    - 使用 jsdom 模擬空 DOM 環境（不含預期元素）
    - 呼叫 `searchSettings`、`displayAllSettings`、`syncSettings`、`displaySelectedSettingsList` 等函數，驗證不拋出 TypeError
    - **Validates: Requirements 6.5**

- [x] 10. Final Checkpoint — 確認所有測試通過
  - 執行完整測試套件 `npm test`
  - 確認 `dist/webview/index.js` 存在且非空（整合測試）
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- 標記 `*` 的子任務為選用，可跳過以加速 MVP 開發
- 每個任務均引用具體需求條款以確保可追溯性
- Checkpoint 任務確保增量驗證
- 屬性測試驗證跨任意輸入的普遍正確性；單元測試驗證具體範例與邊界條件
- `webview/` 使用 `jsxImportSource: "preact"`（automatic JSX），`src/` 保留 classic `h`/`Fragment`，兩者不混用
- 所有 DOM 查詢必須使用 optional chaining，避免 `null` 相關 TypeError
- `IDEListScript` 與 `ExportImportScript` 的 JS 字串邏輯遷移後，原函數保留以避免破壞現有測試
