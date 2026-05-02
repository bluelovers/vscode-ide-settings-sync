# Design Document: webview-preact-refactor

## Overview

本設計將 `src/webview/settingsSyncPanel.ts` 中的混合式 HTML 字串注入重構為完全使用 Preact JSX 的架構。核心策略是建立一個獨立的 `webview/` 前端資料夾，由 esbuild 打包為 IIFE bundle，並透過 `<script src="...">` 注入 Webview。Extension host 端（`SettingsSyncPanel`）改為純 SSR 模式，只負責渲染初始 HTML 骨架與注入初始狀態 JSON；所有 client-side 互動邏輯則移至 `webview/src/` 中的 TypeScript 模組。

### 設計決策摘要

| 決策 | 選擇 | 理由 |
|------|------|------|
| JSX 模式 | `webview/` 使用 `jsxImportSource: "preact"`（automatic），`src/` 保留 classic `h`/`Fragment` | 避免大規模改動現有 SSR 組件 |
| Bundle 格式 | IIFE（立即執行函數） | Webview 不支援 ES modules，IIFE 確保全域函數可被 `onclick` 呼叫 |
| 初始狀態注入 | `<script>` 標籤內 JSON 賦值給 `window.__INITIAL_STATE__` | 最簡單可靠的 SSR → CSR 資料橋接方式 |
| 現有 SSR 組件 | 保留在 `src/webview/components/`，不遷移 | 避免破壞現有測試；SSR 組件不需要 client bundle |
| Script 邏輯遷移 | `IDEListScript`、`ExportImportScript` 的 JS 邏輯移至 `webview/src/scripts/` | 讓 JS 受 TypeScript 型別檢查，並由 esbuild 打包 |

---

## Architecture

### 整體資料流

```
Extension Host (Node.js)
  SettingsSyncPanel.getWebviewContent()
    │
    ├─ renderJsxToString(App, props)  ← SSR：產生 HTML 骨架
    │    └─ App.tsx（新）
    │         ├─ PageHead（現有，含 CSP + style）
    │         ├─ IDEListSection（現有）
    │         ├─ LanguageConfig（新）
    │         ├─ SourceIdeIndicator（現有）
    │         ├─ SettingsNav（現有）
    │         ├─ SyncTab（新）
    │         ├─ ValuesTab（新）
    │         ├─ SelectedTab（新）
    │         └─ ExportImportPanel（現有）
    │
    ├─ <script> window.__INITIAL_STATE__ = {...} </script>  ← 狀態注入
    └─ <script src="dist/webview/index.js">  ← CSR bundle

Webview (Browser context)
  dist/webview/index.js（IIFE bundle）
    │
    ├─ 讀取 window.__INITIAL_STATE__
    ├─ 初始化 vscode = acquireVsCodeApi()
    ├─ 掛載事件監聽（message handler、DOM events）
    └─ 執行 initializeMemory()（恢復已儲存狀態）
```

### 雙 Bundle 架構

```
esbuild.config.ts
  ├─ Bundle A: Extension Host
  │    entryPoints: ['src/extension.ts']
  │    outfile: 'dist/extension.js'
  │    format: 'cjs', platform: 'node'
  │    external: ['vscode']
  │    jsxFactory: 'h', jsxFragment: 'Fragment'  ← classic JSX
  │
  └─ Bundle B: Webview Frontend
       entryPoints: ['webview/src/index.tsx']
       outfile: 'dist/webview/index.js'
       format: 'iife'
       platform: 'browser'
       jsxImportSource: 'preact'  ← automatic JSX（透過 tsconfig）
       external: []  ← 不排除任何模組
```

---

## Components and Interfaces

### 新增組件（`webview/src/`）

#### `webview/src/app.tsx` — SSR 根組件

```typescript
interface IAppProps {
  // Extension host 傳入的完整渲染資料
  ideList: IIDEInfoWebview[];
  unavailableIDEs: IUnavailableIDEInfoWebview[];
  currentIDEName: string;
  sourceIDEUuid: string;
  languageConfig: ILanguageConfig;
  supportedLanguages: ILanguageSupportedItem[];
  currentLanguage: ILanguageCode;
  cssContent: string;
  cspSource: string;
  webviewScriptUri: string;  // dist/webview/index.js 的 Webview URI
}
```

`App` 組件負責組合所有 SSR 子組件，產生完整的 `<!DOCTYPE html>` 文件。它不包含任何 client-side 邏輯，純粹是 HTML 結構的組合。

#### `webview/src/components/LanguageConfig.tsx`

```typescript
interface ILanguageConfigProps {
  languageConfig: ILanguageConfig;
  supportedLanguages: ILanguageSupportedItem[];
  currentLanguage: ILanguageCode;
}
```

渲染語言設定區塊，包含 primary language 下拉選單、fallback 語言標籤列表，以及條件性的 secondary language 顯示列。使用 `onclick="changePrimaryLanguage()"` 字串屬性，與現有組件模式一致。

#### `webview/src/components/tabs/SyncTab.tsx`

```typescript
interface ISyncTabProps {
  // 無需 props，所有互動由 client-side JS 處理
}
```

渲染「Search & Sync Settings」面板的靜態 HTML 骨架，包含搜尋輸入框、`#searchResults` 容器、操作按鈕。

#### `webview/src/components/tabs/ValuesTab.tsx`

渲染「All IDE Settings」面板骨架，包含 `#allSettings` 容器與操作按鈕。

#### `webview/src/components/tabs/SelectedTab.tsx`

渲染「Selected Settings List」面板骨架，包含 `#selectedSettingsList` 容器與操作按鈕。

### 現有組件（保留於 `src/webview/components/`）

以下組件繼續用於 SSR，不遷移：

| 組件 | 保留原因 |
|------|---------|
| `PageHead.tsx` | 依賴 `SettingsSyncPanel` 實例取得 `cspSource`，純 SSR |
| `IDEList.tsx` / `IDEListSection.tsx` | 純 SSR 渲染，`IDEListScript` 的 JS 邏輯遷移至 `webview/src/scripts/` |
| `ExportImportPanel.tsx` | 純 SSR 渲染，`ExportImportScript` 的 JS 邏輯遷移至 `webview/src/scripts/` |
| `settings/SettingsPanel.tsx` | 純 SSR，只有靜態 Tab 按鈕 |
| `ide/SourceIdeIndicator.tsx` | 純 SSR |
| `export-import/` 子組件 | 純 SSR |

### Webview 前端腳本模組（`webview/src/scripts/`）

| 檔案 | 遷移自 | 包含函數 |
|------|--------|---------|
| `settings.ts` | `settingsSyncPanel.ts` inline script | `searchSettings`, `displayAllSettings`, `displaySelectedSettingsList`, `createSettingHTML`, `getSettingDescription`, `clearSearch`, `removeFromSelectedSettings`, `clearAllSelectedSettings`, `refreshSettings` |
| `sync.ts` | `settingsSyncPanel.ts` inline script | `syncSettings`, `deleteSettings` |
| `memory.ts` | `settingsSyncPanel.ts` inline script | `initializeMemory`, `saveSearchHistory`, `saveSearchSelectedSettings`, `saveAllSelectedSettings`, `saveSelectedIDEs` |
| `language.ts` | `settingsSyncPanel.ts` inline script | `changePrimaryLanguage`, `openLanguageConfig` |
| `ide.ts` | `IDEListScript` in `IDEList.tsx` | `removeCustomIDE`, `openIDEFolder`, `openSettingsJson`, `addCustomIDE`, `refreshIDEs`, `handleSourceIDEChange` |
| `export-import.ts` | `ExportImportScript` in `ExportImportPanel.tsx` | `handleExportCustomIDEs`, `handleExportSelectedSettings`, `handleExportAll`, `handleImport`, `handleBrowseExportPath`, `handleBrowseImportPath` |
| `tabs.ts` | `settingsSyncPanel.ts` inline script | `switchTab` |
| `messages.ts` | `settingsSyncPanel.ts` inline script | `showMessage`, message event handler |

---

## Data Models

### 初始狀態注入格式

Extension host 在 `<script>` 標籤中注入以下全域變數：

```typescript
// 注入到 window.__INITIAL_STATE__
interface IWebviewInitialState {
  ideList: IIDEInfoWebview[];           // IDE 列表（含 settings）
  currentLanguage: string;              // 當前語言代碼
  languageConfig: ILanguageConfig;      // 語言配置
  currentIDEName: string;               // 當前 IDE 名稱
  currentIDEUuid: string;               // 當前 IDE UUID
  savedSearchHistory: string;           // 已儲存的搜尋字串
  savedSelectedSettings: string[];      // 已儲存的選取設定 keys
  savedSelectedIDEs: number[];          // 已儲存的選取 IDE indices
  settingDescriptions: Record<string, { primary: string; secondary?: string }>;
}
```

注入方式：

```html
<script>
  window.__INITIAL_STATE__ = {
    ideList: [...],
    currentLanguage: "en",
    ...
  };
</script>
<script src="${webviewScriptUri}"></script>
```

### `IIDEInfoWebview`（現有，位於 `src/webview/components/types.ts`）

```typescript
interface IIDEInfoWebview {
  uuid: string;
  name: string;
  type: string;
  nativePath: string;
  settings?: Record<string, any>;
}
```

### `webview/src/types.ts` — Webview 前端共用型別

Webview 前端需要的型別（`ILanguageConfig`、`IIDEInfoWebview` 等）透過相對路徑從 `src/` 匯入，或在 `webview/src/types.ts` 中重新定義精簡版本，避免引入 Node.js / VS Code 相依。

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: getWebviewContent() 產生包含必要結構的 HTML

*For any* valid set of `IAppProps`（包含任意 IDE 列表、任意語言配置、任意初始狀態），`renderJsxToString(App, props)` 應回傳一個包含以下元素的 HTML 字串：
- `<!DOCTYPE html>` 宣告
- `<meta http-equiv="Content-Security-Policy">` 標籤
- `window.__INITIAL_STATE__` 賦值的 `<script>` 區塊
- 指向 webview bundle 的 `<script src="...">` 標籤
- `#sync`、`#values`、`#selected`、`#export-import` 等 tab 容器

**Validates: Requirements 3.3, 3.4, 3.5**

### Property 2: 初始狀態 JSON 序列化的完整性

*For any* 有效的 `IWebviewInitialState` 物件，將其序列化為 JSON 字串後再反序列化，應得到與原始物件等價的結果（所有欄位值相同）。

**Validates: Requirements 2.4, 3.5**

### Property 3: LanguageConfig 組件的渲染正確性

*For any* 有效的 `ILanguageConfigProps`（包含任意 `languageConfig` 和 `supportedLanguages` 陣列），`LanguageConfig` 組件渲染的 HTML 應滿足：
- `<select id="primaryLang">` 包含與 `supportedLanguages` 數量相同的 `<option>` 元素
- 對應 `languageConfig.primary` 的 `<option>` 具有 `selected` 屬性
- 當 `showSecondary === true` 且 `secondary` 有值時，HTML 包含 secondary language 顯示列
- 當 `showSecondary === false` 時，HTML 不包含 secondary language 顯示列

**Validates: Requirements 4.3, 4.5**

### Property 4: Tab 組件渲染包含必要的 DOM 元素

*For any* 有效的 props，各 Tab 組件渲染的 HTML 應包含其對應的容器 ID 和操作按鈕：
- `SyncTab`：包含 `#searchInput`、`#searchResults`、`#message`
- `ValuesTab`：包含 `#allSettings`
- `SelectedTab`：包含 `#selectedSettingsList`

**Validates: Requirements 5.4**

### Property 5: IDE 資料的 data-* 屬性保留

*For any* 有效的 `IIDEInfoWebview` 陣列，`IDEListSection` 渲染的 HTML 中，每個可用 IDE 項目應包含 `data-index`、`data-uuid`、`data-name` 屬性，且其值與輸入資料中對應的 `uuid`、`name`、`index` 完全一致。

**Validates: Requirements 7.4**

### Property 6: Webview 腳本函數的 null 安全性

*For any* webview 腳本函數（`searchSettings`、`displayAllSettings`、`syncSettings` 等），在 DOM 中缺少其預期查詢的元素時（例如 `document.getElementById(...)` 回傳 `null`），呼叫該函數不應拋出例外（`TypeError: Cannot read properties of null`）。

**Validates: Requirements 6.5**

---

## Error Handling

### Webview Script URI 無法解析

當 `SettingsSyncPanel` 無法取得 `dist/webview/index.js` 的 Webview URI 時：

```typescript
// 在 getWebviewContent() 中
const scriptUri = this.panel.webview.asWebviewUri(
  vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'index.js')
);
if (!scriptUri) {
  console.error('[SettingsSyncPanel] 無法解析 webview script URI');
  // 回退：不注入 script 標籤，Webview 仍可顯示靜態 HTML
}
```

### 初始狀態解析失敗

Webview 前端在讀取 `window.__INITIAL_STATE__` 時應有防禦性處理：

```typescript
// webview/src/index.tsx
const state = (window as any).__INITIAL_STATE__ ?? {};
const ideList: IIDEInfoWebview[] = state.ideList ?? [];
const languageConfig: ILanguageConfig = state.languageConfig ?? getDefaultLanguageConfig();
```

### DOM 元素不存在

所有 DOM 查詢使用可選鏈（optional chaining）：

```typescript
// 正確模式
const input = document.getElementById('searchInput') as HTMLInputElement | null;
input?.addEventListener('input', saveSearchHistory);

// 避免
document.getElementById('searchInput').addEventListener(...); // 可能 throw
```

### TypeScript 編譯錯誤

`webview/tsconfig.json` 設定 `"strict": true`，確保所有 null 安全問題在編譯期被捕捉。

---

## Testing Strategy

### 單元測試（Unit Tests）

使用現有的 Jest 測試框架。

**SSR 組件測試**（`src/webview/components/__tests__/`）：
- 測試 `LanguageConfig` 組件在各種 `languageConfig` 輸入下的渲染輸出
- 測試 `SyncTab`、`ValuesTab`、`SelectedTab` 的靜態 HTML 結構
- 測試 `App` 組件整合渲染（驗證 Property 1）
- 使用 `renderJsxToString` 渲染後以字串匹配或 HTML 解析驗證

**初始狀態序列化測試**（驗證 Property 2）：
- 測試 `IWebviewInitialState` 的 JSON 序列化/反序列化往返

**Webview 腳本 null 安全測試**（驗證 Property 6）：
- 使用 jsdom 模擬空 DOM 環境
- 呼叫各腳本函數，驗證不拋出例外

### 屬性測試（Property-Based Tests）

使用 **fast-check** 進行屬性測試（最少 100 次迭代）。

**Property 1 — getWebviewContent() HTML 結構**：
```typescript
// Tag: Feature: webview-preact-refactor, Property 1: getWebviewContent produces valid HTML structure
fc.assert(fc.property(
  arbitraryAppProps(),
  (props) => {
    const html = renderJsxToString(App, props);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('window.__INITIAL_STATE__');
    expect(html).toContain('id="sync"');
    expect(html).toContain('id="values"');
  }
), { numRuns: 100 });
```

**Property 2 — 初始狀態 JSON 往返**：
```typescript
// Tag: Feature: webview-preact-refactor, Property 2: initial state JSON round-trip
fc.assert(fc.property(
  arbitraryInitialState(),
  (state) => {
    const serialized = JSON.stringify(state);
    const deserialized = JSON.parse(serialized);
    expect(deserialized).toEqual(state);
  }
), { numRuns: 100 });
```

**Property 3 — LanguageConfig 渲染正確性**：
```typescript
// Tag: Feature: webview-preact-refactor, Property 3: LanguageConfig renders correct options
fc.assert(fc.property(
  arbitraryLanguageConfigProps(),
  (props) => {
    const html = renderJsxToString(LanguageConfig, props);
    const optionCount = (html.match(/<option/g) || []).length;
    expect(optionCount).toBe(props.supportedLanguages.length);
    expect(html).toContain(`value="${props.languageConfig.primary}" selected`);
  }
), { numRuns: 100 });
```

**Property 5 — data-* 屬性保留**：
```typescript
// Tag: Feature: webview-preact-refactor, Property 5: IDE data attributes preserved
fc.assert(fc.property(
  fc.array(arbitraryIDEInfo(), { minLength: 1, maxLength: 10 }),
  (ideList) => {
    const html = renderJsxToString(IDEListSection, { availableIDEs: ideList, ... });
    ideList.forEach((ide, index) => {
      expect(html).toContain(`data-uuid="${ide.uuid}"`);
      expect(html).toContain(`data-name="${ide.name}"`);
      expect(html).toContain(`data-index="${index}"`);
    });
  }
), { numRuns: 100 });
```

### 整合測試（Integration Tests）

- 執行 esbuild 建置，驗證 `dist/webview/index.js` 存在且非空
- 執行現有測試套件（`npm test`），確認無回歸

### 不適用 PBT 的部分

以下測試使用一般單元測試或 smoke test：
- 建置系統配置（esbuild config 結構）
- 檔案/資料夾存在性檢查
- TypeScript 編譯零錯誤（`tsc --noEmit`）
- 訊息協議相容性（固定的 command 字串集合）
