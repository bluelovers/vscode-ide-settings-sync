# Requirements Document

## Introduction

本功能將 `src/webview/settingsSyncPanel.ts` 中的 Webview 渲染方式從混合式 HTML 字串注入重構為完全使用 Preact JSX 語法。目前的實作在 `getWebviewContent()` 方法中以大型 template literal 字串拼接 HTML，僅部分區塊（如 IDEList、ExportImportPanel）使用 JSX 組件，其餘（語言設定區塊、搜尋區塊、設定值顯示區塊等）仍為原始 HTML 字串。

重構目標：
- 在專案根目錄建立獨立的 `webview/` 資料夾，作為 Webview 前端程式碼的專屬目錄
- 將所有 HTML 字串注入改寫為 Preact JSX 組件
- 保留現有的 VS Code Extension 後端邏輯（訊息處理、IDE 偵測等）不變
- 確保重構後的行為與現有功能完全一致

## Glossary

- **SettingsSyncPanel**: VS Code Extension 的主要 Webview 面板類別，位於 `src/webview/settingsSyncPanel.ts`
- **Webview**: VS Code 擴充功能中嵌入的 HTML/JS 頁面，用於顯示 UI 介面
- **JSX Component**: 使用 Preact JSX 語法定義的 UI 組件，副檔名為 `.tsx`
- **HTML String Injection**: 在 TypeScript 中以 template literal 字串直接拼接 HTML 的方式
- **renderJsxToString**: 現有工具函數，將 Preact JSX 組件渲染為 HTML 字串
- **webview/ 資料夾**: 專案根目錄下新建的資料夾，存放 Webview 前端的 JSX 組件與入口點
- **Entry Point**: Webview 前端的 JavaScript 入口檔案，由 esbuild 打包後注入 Webview
- **CSP**: Content Security Policy，限制 Webview 可載入的資源來源
- **globalState**: VS Code Extension 的持久化狀態儲存，用於記憶使用者選擇
- **IDEProvider**: 提供 IDE 偵測與管理功能的服務類別

## Requirements

### Requirement 1: 建立 webview 前端資料夾結構

**User Story:** As a developer, I want a dedicated `webview/` folder at the project root for all Webview frontend code, so that frontend and backend code are clearly separated.

#### Acceptance Criteria

1. THE Webview_Folder SHALL be created at the project root as `webview/`
2. THE Webview_Folder SHALL contain a `src/` subdirectory for JSX component source files
3. THE Webview_Folder SHALL contain its own `tsconfig.json` configured for Preact JSX with `"jsxImportSource": "preact"`
4. THE Webview_Folder SHALL contain its own `package.json` or reuse the root-level build configuration via esbuild entry points
5. WHEN the esbuild build runs, THE Build_System SHALL bundle the webview entry point into `dist/webview/` as a separate output file
6. THE Webview_Folder structure SHALL mirror the existing `src/webview/components/` organisation, placing components under `webview/src/components/`

### Requirement 2: 建立 Webview 前端入口點

**User Story:** As a developer, I want a single JSX entry point for the Webview frontend, so that the entire UI can be rendered and managed as a Preact component tree.

#### Acceptance Criteria

1. THE Webview_Entry SHALL be a `.tsx` file located at `webview/src/index.tsx`
2. WHEN the Webview loads in VS Code, THE Webview_Entry SHALL call `render()` from `preact` to mount the root component into the DOM
3. THE Webview_Entry SHALL acquire the `vscode` API via `acquireVsCodeApi()` and make it available to child components
4. THE Webview_Entry SHALL receive initial state (ideList, languageConfig, savedSelectedSettings, etc.) injected as JSON by the extension host via `<script>` tags
5. THE Webview_Entry SHALL register a `window.addEventListener('message', ...)` handler to receive messages from the extension host
6. IF the DOM is not yet ready when the entry script runs, THEN THE Webview_Entry SHALL defer mounting until `DOMContentLoaded` fires

### Requirement 3: 將 SettingsSyncPanel 的 HTML 字串改為完整 JSX 渲染

**User Story:** As a developer, I want `getWebviewContent()` in `SettingsSyncPanel` to produce its HTML entirely through Preact JSX components, so that the codebase is consistent and maintainable.

#### Acceptance Criteria

1. THE SettingsSyncPanel SHALL render the complete HTML document by composing JSX components rather than template literal strings
2. THE SettingsSyncPanel SHALL use a root `<App>` JSX component that accepts all required props (ideList, languageConfig, savedState, etc.)
3. WHEN `getWebviewContent()` is called, THE SettingsSyncPanel SHALL call `renderJsxToString(App, props)` (or equivalent) to produce the final HTML string
4. THE SettingsSyncPanel SHALL inject the bundled webview JavaScript via a `<script src="...">` tag referencing the esbuild output, rather than embedding inline `<script>` blocks in the template
5. THE SettingsSyncPanel SHALL continue to inject initial state as a `<script>` block containing JSON-serialised variables (ideList, languageConfig, etc.) before the main script tag
6. IF the webview script URI cannot be resolved, THEN THE SettingsSyncPanel SHALL log an error and fall back to rendering without the script tag

### Requirement 4: 將語言設定區塊重構為 JSX 組件

**User Story:** As a developer, I want the language configuration section to be a standalone JSX component, so that it is testable and reusable.

#### Acceptance Criteria

1. THE LanguageConfig_Component SHALL be a Preact JSX component located at `webview/src/components/LanguageConfiguration.tsx`
2. THE LanguageConfig_Component SHALL accept `languageConfig`, `supportedLanguages`, and `currentLanguage` as typed props
3. WHEN rendered, THE LanguageConfig_Component SHALL produce HTML equivalent to the current language configuration section in `getWebviewContent()`
4. THE LanguageConfig_Component SHALL use `onclick` string attributes (e.g., `onclick="changePrimaryLanguage()"`) consistent with the existing pattern used in other components
5. WHERE the `showSecondary` flag is true and a secondary language is configured, THE LanguageConfig_Component SHALL render the secondary language row

### Requirement 5: 將搜尋與設定值顯示區塊重構為 JSX 組件

**User Story:** As a developer, I want the search, view-all, selected-settings, and export-import tab panels to be JSX components, so that the entire tab content area is component-based.

#### Acceptance Criteria

1. THE SyncTab_Component SHALL be a Preact JSX component at `webview/src/components/tabs/SyncTab.tsx` rendering the "Search & Sync Settings" panel
2. THE ValuesTab_Component SHALL be a Preact JSX component at `webview/src/components/tabs/AllSettingsTab.tsx` rendering the "All IDE Settings" panel
3. THE SelectedTab_Component SHALL be a Preact JSX component at `webview/src/components/tabs/SelectedTab.tsx` rendering the "Selected Settings List" panel
4. WHEN rendered server-side via `renderJsxToString`, THE Tab_Components SHALL produce HTML structurally identical to the current template literal output
5. THE Tab_Components SHALL use `dangerouslySetInnerHTML` or string `onclick` attributes for inline event handlers, consistent with the existing component pattern

### Requirement 6: 將 JavaScript 邏輯移至 webview 前端入口

**User Story:** As a developer, I want all client-side JavaScript logic (searchSettings, displayAllSettings, syncSettings, etc.) to live in the webview frontend entry point, so that it is bundled by esbuild and not embedded as raw strings.

#### Acceptance Criteria

1. THE Webview_Scripts SHALL be TypeScript functions defined in `webview/src/` files, not inline `<script>` string blocks in `settingsSyncPanel.ts`
2. THE Webview_Scripts SHALL include all existing functions: `searchSettings`, `displayAllSettings`, `displaySelectedSettingsList`, `syncSettings`, `deleteSettings`, `refreshSettings`, `showMessage`, `switchTab`, `initializeMemory`, `saveSearchHistory`, `saveSearchSelectedSettings`, `saveAllSelectedSettings`, `saveSelectedIDEs`, `changePrimaryLanguage`, `openLanguageConfig`
3. WHEN esbuild bundles the webview entry point, THE Build_System SHALL include all Webview_Scripts in the output bundle
4. THE Webview_Scripts SHALL access initial state via module-level variables populated from the injected `<script>` JSON block
5. IF a Webview_Script function references a DOM element that does not exist, THEN THE Webview_Script SHALL handle the null case gracefully without throwing

### Requirement 7: 保持與現有後端邏輯的相容性

**User Story:** As a developer, I want the refactored webview to maintain full compatibility with the existing extension message handler, so that no backend logic needs to change.

#### Acceptance Criteria

1. THE Refactored_Webview SHALL send messages with the same `command` values as the current implementation: `syncSettings`, `deleteSettings`, `refreshData`, `refreshIDEs`, `saveSearchHistory`, `saveSelectedSettings`, `saveSelectedIDEs`, `selectSourceIDE`, `requestAddCustomIDE`, `addCustomIDE`, `removeCustomIDE`, `openSettingsJson`, `openIDEFolder`, `changePrimaryLanguage`, `openLanguageConfig`, `exportCustomIDEs`, `exportSelectedSettings`, `exportAll`, `import`, `browseExportPath`, `browseImportPath`
2. THE Refactored_Webview SHALL handle incoming messages with the same `command` values: `syncComplete`, `deleteComplete`, `addCustomIDEComplete`, `exportPathSelected`, `importPathSelected`, `exportComplete`, `importComplete`
3. WHEN the extension host calls `panel.webview.postMessage(...)`, THE Refactored_Webview SHALL process the message identically to the current implementation
4. THE Refactored_Webview SHALL preserve all `data-*` attributes on DOM elements (e.g., `data-index`, `data-uuid`, `data-name`, `data-key`) that the message handler relies on

### Requirement 8: 建置系統支援 webview 前端打包

**User Story:** As a developer, I want the esbuild configuration to bundle the webview frontend separately from the extension host, so that the webview script can be loaded via a `webview.cspSource`-compliant URI.

#### Acceptance Criteria

1. THE Build_System SHALL add a second esbuild entry point for `webview/src/index.tsx` with output to `dist/webview/index.js`
2. THE Build_System SHALL configure the webview bundle with `format: 'iife'` so it executes immediately when loaded in the Webview
3. THE Build_System SHALL mark `vscode` as external for the extension bundle but NOT for the webview bundle (the webview uses `acquireVsCodeApi()` instead)
4. THE Build_System SHALL include the `sassPlugin` for the webview bundle to support SCSS imports
5. WHEN `--minify` is passed to the build script, THE Build_System SHALL minify both the extension bundle and the webview bundle
6. WHEN `--watch` is passed to the build script, THE Build_System SHALL watch both entry points for changes

### Requirement 9: 型別安全與程式碼品質

**User Story:** As a developer, I want all new JSX components and webview scripts to be fully typed in TypeScript, so that type errors are caught at compile time.

#### Acceptance Criteria

1. THE JSX_Components SHALL define explicit TypeScript interfaces for all props
2. THE Webview_Scripts SHALL use TypeScript type annotations for all function parameters and return values
3. WHEN `tsc` or esbuild compiles the webview source, THE Build_System SHALL report zero TypeScript errors
4. THE JSX_Components SHALL not use `// @ts-ignore` except where interacting with Preact's `onclick` string attribute limitation, consistent with the existing codebase pattern
5. THE JSX_Components SHALL use `className` for CSS class attributes in JSX, consistent with the existing component pattern

### Requirement 10: 現有組件遷移至 webview 資料夾

**User Story:** As a developer, I want the existing JSX components in `src/webview/components/` to be migrated or referenced from the new `webview/` folder, so that all Webview UI code is co-located.

#### Acceptance Criteria

1. THE Existing_Components (PageHead, IDEList, IDEListSection, ExportImportPanel, SettingsNavigation, SourceIdeIndicator, and all sub-components) SHALL be accessible from the new `webview/src/` entry point
2. WHERE an existing component is used only for server-side rendering (SSR via `renderJsxToString`), THE Component SHALL remain in `src/webview/components/` and be imported by `SettingsSyncPanel`
3. WHERE an existing component contains client-side JavaScript (e.g., `IDEListScript`, `ExportImportScript`), THE Script_Logic SHALL be migrated to the webview frontend bundle instead of being rendered as inline `<script>` strings
4. THE Migration SHALL not break any existing unit tests in `src/webview/`
5. WHEN the refactoring is complete, THE `getWebviewContent()` method SHALL contain no template literal HTML strings longer than a single line
