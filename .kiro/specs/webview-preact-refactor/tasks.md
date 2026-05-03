# Implementation Plan: webview-preact-refactor

## Overview

將 `webview/src/` 中所有殘留的 HTML 字串事件屬性（`onclick="..."` / `onchange="..."` / `onkeyup="..."`）與直接 DOM 操作，全面遷移至 Preact JSX 事件處理（`onClick={handler}`）與 `@preact/signals` 狀態管理。完成後 `window-this.ts` 大幅精簡，`scripts/` 中的 DOM 操作函數轉為純邏輯函數。

**重要限制**：`app.tsx`（SSR 根組件）不在修改範圍內。

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

- [x] 3. 建立 SSR 組件（已完成）
  - [x] 3.1 建立 `webview/src/components/LanguageConfiguration.tsx`（SSR 版本）
  - [x] 3.2 建立 Tab 組件：`SyncTab.tsx`、`AllSettingsTab.tsx`、`SelectedTab.tsx`（SSR 版本）
  - [x] 3.3 建立 `webview/src/app.tsx` — SSR 根組件
  - _Requirements: 3.1–3.6, 4.1–4.5, 5.1–5.5_

- [x] 4. 遷移 client-side 腳本至 `webview/src/scripts/`（已完成）
  - [x] 4.1 建立 `messages.ts`、`tabs.ts`、`language.ts`、`memory.ts`、`settings.ts`、`sync.ts`、`ide.ts`、`export-import.ts`
  - _Requirements: 6.1–6.5, 7.1–7.4_

- [x] 5. 建立 Webview 前端入口 `webview/src/index.tsx`（已完成）
  - _Requirements: 2.1–2.6_

- [x] 6. 重構 `SettingsSyncPanel.getWebviewContent()`（已完成）
  - _Requirements: 3.1–3.6, 10.5_

- [x] 7. 移除舊的 inline script 渲染（已完成）
  - _Requirements: 10.3_

- [x] 8. Checkpoint — 確認建置與測試通過（已完成）

- [x] 9. 新增 `store.ts` signals 支援 Tab 狀態管理
  - [x] 9.1 在 `webview/src/store.ts` 新增 `activeTab` signal
    - 新增 `export const activeTab = signal<'sync' | 'values' | 'selected' | 'export-import'>('sync')`
    - 定義 `type TabName = 'sync' | 'values' | 'selected' | 'export-import'` 並匯出
    - 在 `initStore()` 中初始化 `activeTab.value = 'sync'`（或從 state 讀取若有儲存）
    - _Requirements: 9.1, 9.2_
  - [x] 9.2 在 `webview/src/store.ts` 新增 `exportPath` 與 `importPath` signals
    - 新增 `export const exportPath = signal<string>('')`
    - 新增 `export const importPath = signal<string>('')`
    - 這兩個 signal 將由 `initExportImportMessageHandler` 在收到 `exportPathSelected`/`importPathSelected` 訊息時更新
    - _Requirements: 9.1, 9.2_
  - [ ]* 9.3 撰寫 `activeTab` signal 的屬性測試
    - **Property 1: Tab 切換完整性**
    - 對任意合法 `TabName`，設定 `activeTab.value` 後其值等於輸入值
    - **Validates: Requirements 9.1**

- [x] 10. 重構 `SettingsNavigation.tsx` 為完整 Preact 組件
  - [x] 10.1 修改 `webview/src/components/settings/SettingsNavigation.tsx`
    - 從 `../../store` import `activeTab`
    - 移除所有 `onclick="switchTab('...')"` 字串屬性與 `// @ts-ignore`
    - 改用 `onClick={() => { activeTab.value = 'sync'; }}` 等 JSX handler
    - 使用 `activeTab.value === 'sync' ? 'tab active' : 'tab'` 動態決定 className
    - _Requirements: 9.1, 9.4_
  - [x] 10.2 在 `webview/src/index.tsx` 新增 `SettingsNavigation` 的 hydration
    - 查詢 `.tabs` 容器元素
    - 呼叫 `hydrate(<SettingsNavigation />, tabsEl)`
    - _Requirements: 2.2_
  - [ ]* 10.3 撰寫 `SettingsNavigation` 的屬性測試
    - **Property 1: Tab 切換完整性（UI 層）**
    - 對任意合法 `TabName`，設定 `activeTab.value` 後，`SettingsNavigation` 渲染中對應按鈕具有 `active` class，其餘三個不具有
    - **Validates: Requirements 9.1**

- [x] 11. 重構 Tab 內容組件（SyncTab / AllSettingsTab / SelectedTab）
  - [x] 11.1 重構 `webview/src/components/tabs/SyncTab.tsx`
    - 從 `../../store` import `activeTab`、`searchQuery`
    - 從 `../../scripts/settings` import `clearSearch`、`refreshSettings`、`addSelectedSettingsListOnSearchPanel`
    - 從 `../../scripts/sync` import `syncSettings`、`deleteSettings`
    - 從 `../../scripts/memory` import `saveSearchHistory`
    - 移除所有 `onclick`/`onkeyup` 字串屬性與 `// @ts-ignore`
    - 搜尋輸入框改用 `onInput={(e) => { searchQuery.value = e.currentTarget.value; saveSearchHistory(); }}`
    - 操作按鈕改用 `onClick={() => clearSearch()}`、`onClick={() => refreshSettings()}` 等 JSX handler
    - 根據 `activeTab.value === 'sync'` 決定是否顯示（`display: none` 或 conditional render）
    - _Requirements: 5.1, 5.4, 9.2_
  - [x] 11.2 重構 `webview/src/components/tabs/AllSettingsTab.tsx`
    - 從 `../../store` import `activeTab`
    - 從 `../../scripts/settings` import `refreshSettings`、`addSelectedSettingsListOnAllPanel`
    - 從 `../../scripts/sync` import `syncSettings`、`deleteSettings`
    - 移除所有 `onclick` 字串屬性與 `// @ts-ignore`
    - 操作按鈕改用 JSX handler
    - 根據 `activeTab.value === 'values'` 決定是否顯示
    - _Requirements: 5.2, 5.4, 9.2_
  - [x] 11.3 重構 `webview/src/components/tabs/SelectedTab.tsx`
    - 從 `../../store` import `activeTab`
    - 從 `../../scripts/settings` import `refreshSettings`、`clearAllSelectedSettings`
    - 從 `../../scripts/sync` import `syncSettings`、`deleteSettings`
    - 移除所有 `onclick` 字串屬性與 `// @ts-ignore`
    - 操作按鈕改用 JSX handler
    - 根據 `activeTab.value === 'selected'` 決定是否顯示
    - _Requirements: 5.3, 5.4, 9.2_
  - [x] 11.4 在 `webview/src/index.tsx` 新增三個 Tab 組件的 hydration
    - 查詢 `#sync`、`#values`、`#selected` 容器元素
    - 分別呼叫 `hydrate(<SyncTab />, el)`、`hydrate(<AllSettingsTab />, el)`、`hydrate(<SelectedTab />, el)`
    - 移除 `index.tsx` 中手動綁定 `searchInput.addEventListener('input', ...)` 的程式碼（已由 SyncTab 組件處理）
    - 移除 `document.querySelectorAll('.ide-checkbox').forEach(...)` 手動綁定（改由組件處理）
    - _Requirements: 2.2_
  - [ ]* 11.5 撰寫 Tab 組件的屬性測試
    - **Property 1: Tab 切換完整性（內容層）**
    - 對任意合法 `TabName`，設定 `activeTab.value` 後，對應 Tab 組件可見，其餘隱藏
    - **Validates: Requirements 9.1**

- [x] 12. 重構 `IDEList.tsx` 移除 onclick 字串屬性
  - [x] 12.1 重構 `BtnRemoveCustomIDE`、`BtnOpenIDEFolder`、`BtnOpenSettingsJson`
    - 從 `../../scripts/ide` import `removeCustomIDE`、`openIDEFolder`、`openSettingsJson`
    - `BtnRemoveCustomIDE`：移除 `onclick={`removeCustomIDE(...)`}` 字串，改用 `onClick={() => removeCustomIDE(params)}`
    - `BtnOpenIDEFolder`：移除 `onclick={`openIDEFolder(...)`}` 字串，改用 `onClick={() => openIDEFolder(props.path)}`
    - `BtnOpenSettingsJson`：移除 `onclick={`openSettingsJson(...)`}` 字串，改用 `onClick={() => openSettingsJson(props.idePath, props.ideName)}`
    - 移除所有 `// @ts-ignore`
    - _Requirements: 9.2, 9.4_
  - [x] 12.2 重構 `IDEListSection` 的 Add / Refresh 按鈕
    - 從 `../../scripts/ide` import `addCustomIDE`、`refreshIDEs`
    - 移除 `onclick="addCustomIDE()"` 與 `onclick="refreshIDEs()"` 字串屬性
    - 改用 `onClick={() => addCustomIDE()}` 與 `onClick={() => refreshIDEs()}`
    - 移除 `// @ts-ignore`
    - _Requirements: 9.2, 9.4_
  - [x] 12.3 在 `webview/src/index.tsx` 新增 `IDEListSection` 的 hydration（或保留 SSR）
    - 評估是否需要 hydrate `IDEListSection`（目前 `.ide-list` 仍為 SSR 靜態 HTML）
    - 若 hydrate：查詢 `.section` 中包含 `#ide-list` 的容器，呼叫 `hydrate(<IDEListSection />, el)`
    - 若保留 SSR：確認 `effect()` 仍可正確切換 `.source-ide` class
    - _Requirements: 2.2_
  - [ ]* 12.4 撰寫 `IDEList` 的屬性測試
    - **Property 5: IDE 資料的 data-* 屬性保留**
    - 使用 `fc.array` 產生任意 IDE 列表，驗證渲染後每個 IDE 包含正確的 `data-uuid`、`data-name`、`data-index`
    - 驗證 `onClick` handler 為函數型別（非字串）
    - **Validates: Requirements 7.4, 9.4**

- [x] 13. 重構 `LanguageConfiguration.tsx` 為完整 Preact 組件
  - [x] 13.1 修改 `webview/src/components/LanguageConfiguration.tsx`
    - 從 `../scripts/language` import `changePrimaryLanguage`、`openLanguageConfig`
    - 移除 `onchange="changePrimaryLanguage()"` 字串屬性與 `// @ts-ignore`
    - `<select>` 改用 `onChange={(e) => changePrimaryLanguage(e.currentTarget.value)}`
    - 移除 `onclick="openLanguageConfig()"` 字串屬性
    - `<button>` 改用 `onClick={() => openLanguageConfig()}`
    - _Requirements: 4.4, 9.2, 9.4_
  - [x] 13.2 在 `webview/src/index.tsx` 新增 `LanguageConfiguration` 的 hydration
    - 查詢語言設定區塊的容器元素（`.section` 中含 `#primaryLang` 的那個）
    - 呼叫 `hydrate(<LanguageConfiguration {...props} />, el)`，props 從 `__INITIAL_STATE__` 讀取
    - _Requirements: 2.2_
  - [ ]* 13.3 撰寫 `LanguageConfiguration` 的屬性測試
    - **Property 3: LanguageConfiguration 組件的渲染正確性**
    - 使用 `fc.array` 產生任意 `supportedLanguages`，驗證 `<option>` 數量與陣列長度相同
    - 驗證 `onChange` handler 為函數型別（非字串）
    - **Validates: Requirements 4.3, 9.4**

- [x] 14. 重構 `language.ts` 函數簽名
  - [x] 14.1 修改 `webview/src/scripts/language.ts` 中的 `changePrimaryLanguage`
    - 將函數簽名從 `changePrimaryLanguage(): void` 改為 `changePrimaryLanguage(value: string): void`
    - 移除 `document.getElementById('primaryLang')` 的 DOM 讀取
    - 直接使用傳入的 `value` 參數呼叫 `vscode.postMessage`
    - 移除 `document.querySelector('.tab.active')` 的 DOM 讀取
    - 改用 `import { activeTab } from '../store'`，根據 `activeTab.value === 'values'` 決定後續行為
    - _Requirements: 6.5, 9.2_
  - [ ]* 14.2 撰寫 `changePrimaryLanguage` 的屬性測試
    - **Property 2: 事件處理無 window 依賴**
    - 對任意合法語言代碼字串，呼叫 `changePrimaryLanguage(value)` 後 `vscode.postMessage` 收到正確 payload
    - 驗證函數不讀取任何 DOM 元素（mock `document.getElementById` 驗證未被呼叫）
    - **Validates: Requirements 6.5, 9.2**

- [x] 15. 重構 `ExportImportPanel.tsx` 及子組件
  - [x] 15.1 修改 `webview/src/components/export-import/ActionButton.tsx`
    - 將 `onClick` prop 型別從 `string` 改為 `() => void`
    - 移除 `// @ts-ignore` 與 `onclick={onClick}` 字串屬性
    - 改用 `onClick={onClick}` JSX handler
    - _Requirements: 9.1, 9.4_
  - [x] 15.2 修改 `webview/src/components/export-import/PathInput.tsx`
    - 將 `onBrowse` prop 型別從 `string` 改為 `() => void`
    - 新增 `inputRef?: Ref<HTMLInputElement>` prop（從 `preact/hooks` import `Ref`）
    - 移除 `// @ts-ignore` 與 `onclick={onBrowse}` 字串屬性
    - 改用 `onClick={onBrowse}` JSX handler
    - 在 `<input>` 上套用 `ref={inputRef}`
    - _Requirements: 9.1, 9.4_
  - [x] 15.3 修改 `webview/src/components/export-import/ExportSection.tsx`
    - 將 `actionOnClick: string` prop 改為 `onAction: () => void`
    - 新增 `onBrowse: () => void` prop（取代 `PathInput` 內部的字串）
    - 新增 `pathRef?: Ref<HTMLInputElement>` prop，傳入 `PathInput`
    - 更新 `ActionButton` 的 `onClick` 傳入方式
    - _Requirements: 9.1, 9.4_
  - [x] 15.4 修改 `webview/src/components/export-import/ImportSection.tsx`
    - 將 `actionOnClick: string` prop 改為 `onAction: () => void`
    - 新增 `onBrowse: () => void` prop
    - 新增 `pathRef?: Ref<HTMLInputElement>` prop，傳入 `PathInput`
    - 更新 `ActionButton` 的 `onClick` 傳入方式
    - _Requirements: 9.1, 9.4_
  - [x] 15.5 重構 `webview/src/components/ExportImportPanel.tsx`
    - 從 `preact/hooks` import `useRef`
    - 從 `../scripts/export-import` import `handleExportCustomIDEs`、`handleExportSelectedSettings`、`handleExportAll`、`handleImport`、`handleBrowseExportPath`、`handleBrowseImportPath`
    - 建立各 input 的 `useRef`：`exportCustomPathRef`、`exportSelectedPathRef`、`exportAllPathRef`、`importPathRef`
    - 建立 checkbox 的 `useRef`：`exportIncludeKnownRef`、`exportAllIncludeKnownRef`
    - 將 `ExportSection` 的 `actionOnClick` 字串改為 `onAction` 函數，讀取對應 ref 值後呼叫 export-import.ts 函數
    - 將 `ImportSection` 的 `actionOnClick` 字串改為 `onAction` 函數
    - 傳入 `pathRef` 至各子組件
    - _Requirements: 9.1, 9.4_
  - [x] 15.6 在 `webview/src/index.tsx` 新增 `ExportImportPanel` 的 hydration
    - 查詢 `#export-import` 容器元素
    - 呼叫 `hydrate(<ExportImportPanel />, el)`
    - _Requirements: 2.2_
  - [ ]* 15.7 撰寫 `ExportImportPanel` 的屬性測試
    - **Property 3: Export/Import 路徑讀取**
    - 對任意路徑字串，模擬 ref.current.value 後呼叫 `handleExportCustomIDEs`，驗證 `vscode.postMessage` 收到正確 payload
    - 驗證不使用 `document.getElementById` 讀取路徑
    - **Validates: Requirements 9.3**

- [x] 16. 重構 `export-import.ts` 函數簽名
  - [x] 16.1 修改 `webview/src/scripts/export-import.ts` 中的四個 handle 函數
    - `handleExportCustomIDEs(customPath: string | undefined, includeKnownIDEs: boolean): void`
    - `handleExportSelectedSettings(customPath: string | undefined): void`
    - `handleExportAll(customPath: string | undefined, includeKnownIDEs: boolean): void`
    - `handleImport(customPath: string | undefined): void`
    - 移除所有 `document.getElementById(...)` 的 DOM 讀取（路徑由呼叫方從 ref 讀取後傳入）
    - _Requirements: 6.5, 9.2_
  - [x] 16.2 修改 `initExportImportMessageHandler()` 改用 signals
    - 收到 `exportPathSelected` 時：更新 `exportPath.value = message.path`（而非直接操作 DOM）
    - 收到 `importPathSelected` 時：更新 `importPath.value = message.path`
    - 從 `../store` import `exportPath`、`importPath`
    - _Requirements: 6.5, 9.2_
  - [ ]* 16.3 撰寫 `export-import.ts` 的屬性測試
    - **Property 3: Export/Import 路徑讀取**
    - 對任意路徑字串與 boolean 組合，呼叫各 handle 函數後 `vscode.postMessage` 收到正確 payload
    - 驗證函數不讀取任何 DOM 元素
    - **Validates: Requirements 6.5, 9.2**

- [x] 17. Checkpoint — 確認組件重構後建置通過
  - 執行 `npx ts-node esbuild.config.ts`，確認兩個 bundle 均成功產生
  - 執行 `tsc --noEmit -p webview/tsconfig.json`，確認零 TypeScript 錯誤
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. 精簡 `window-this.ts`
  - [x] 18.1 移除不再需要掛載至 `window` 的函數
    - 移除所有僅供 `onclick` 字串呼叫的函數掛載（`switchTab`、`changePrimaryLanguage`、`openLanguageConfig`、`clearSearch`、`refreshSettings`、`syncSettings`、`deleteSettings`、`addCustomIDE`、`refreshIDEs`、`openIDEFolder`、`openSettingsJson`、`removeCustomIDE`、`handleExportCustomIDEs`、`handleExportSelectedSettings`、`handleExportAll`、`handleImport`、`handleBrowseExportPath`、`handleBrowseImportPath` 等）
    - 保留仍需跨模組存取的函數（如 `removeFromSelectedSettings`，被 `SettingItem` 組件呼叫）
    - 保留 `displayAllSettings`、`searchSettings`、`displaySelectedSettingsList`（若仍有 `window.xxx?.()` 形式呼叫）
    - _Requirements: 9.2_
  - [x] 18.2 更新 `IWebviewWindow` 型別定義
    - 移除 `IWebviewWindowApi` 型別中已不再掛載的函數
    - 確保 `IWebviewWindow` 型別與實際掛載的函數一致
    - _Requirements: 9.1, 9.2_
  - [x] 18.3 從 `index.tsx` 移除不再需要的 import 與初始化程式碼
    - 移除 `initIDEEventListeners()` 呼叫（radio 事件改由 Preact 組件處理，若已 hydrate）
    - 移除 `searchInput.addEventListener('input', ...)` 手動綁定（已由 SyncTab 組件處理）
    - 移除 `document.querySelectorAll('.ide-checkbox').forEach(...)` 手動綁定
    - 清理不再使用的 import 語句
    - _Requirements: 9.2_

- [x] 19. 清理 `types.ts`
  - [x] 19.1 移除 `webview/src/types.ts` 中不必要的 import
    - 移除 `import { saveSearchHistory } from './scripts/memory'`（未使用）
    - 移除 `import { displayAllSettings, displaySelectedSettingsList, removeFromSelectedSettings, searchSettings } from './scripts/settings'`（未使用）
    - 移除 `IWebviewWindowApi` 型別定義（已移至 `window-this.ts`，或直接刪除）
    - _Requirements: 9.1, 9.3_

- [x] 20. 清理 `tabs.ts`（可選）
  - [x] 20.1 評估 `switchTab()` 函數的保留策略
    - 若所有呼叫方已改用 `activeTab.value = tabName`，可移除 `switchTab()` 或保留為向後相容 wrapper
    - 若保留：改寫為 `export function switchTab(tabName: TabName): void { activeTab.value = tabName; }`
    - 若移除：確認 `window-this.ts` 中已移除對應掛載
    - _Requirements: 9.2_

- [x] 21. Final Checkpoint — 確認所有測試通過
  - 執行完整測試套件 `npm test`
  - 執行 `tsc --noEmit -p webview/tsconfig.json`，確認零 TypeScript 錯誤
  - 確認 `dist/webview/index.js` 存在且非空
  - 在 VS Code 中手動驗證 Tab 切換、IDE 操作、語言設定、Export/Import 功能正常
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- 標記 `*` 的子任務為選用，可跳過以加速 MVP 開發
- 每個任務均引用具體需求條款以確保可追溯性
- Checkpoint 任務確保增量驗證
- **`app.tsx`（SSR 根組件）不在修改範圍內**，SSR 輸出的 HTML 結構不變，hydration 可正常接管
- 屬性測試驗證跨任意輸入的普遍正確性；單元測試驗證具體範例與邊界條件
- `IDEList` 是否 hydrate 需評估：若 hydrate 則可移除 `effect()` 橋接；若保留 SSR 則 `effect()` 仍需保留
- 重構後 `window-this.ts` 應只保留真正需要跨模組 `window.xxx?.()` 存取的函數
- 所有 `// @ts-ignore` 應在對應組件重構後一併移除
