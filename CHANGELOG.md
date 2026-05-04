# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.1.2](https://github.com/bluelovers/vscode-ide-settings-sync/compare/vscode-ide-settings-sync@0.1.1...vscode-ide-settings-sync@0.1.2) (2026-05-04)

**Note:** Version bump only for package vscode-ide-settings-sync





## [0.1.1](https://github.com/bluelovers/vscode-ide-settings-sync/compare/vscode-ide-settings-sync@0.0.6...vscode-ide-settings-sync@0.1.1) (2026-05-04)


### BREAKING CHANGES

* **vscode:** 抽象化全域狀態管理
* **webview:** 移除了 createSettingHTML 和 displayAllSettings 函數。
這些函數之前被導出供其他模組使用，若外部代碼依賴這些函數，需要更新為新的渲染方式。
* **webview:** 迁移至枚举 CSS 选择器
* **types:** 将语言代码从 string union 迁移至 EnumLanguageCode 枚举，
TabName 迁移至 EnumTabName 枚举。所有相关类型和函数签章已更新，
需同步更新调用端代码。
* **webview:** migrate HTML string events to Preact JSX handlers and signals



### 🐛　Bug Fixes

* **webview:** 迁移至枚举 CSS 选择器 ([f1b606f](https://github.com/bluelovers/vscode-ide-settings-sync/commit/f1b606f1d06e73d4c8d5775e8ec674908a53cb8b))
* **webview:** fix comment formatting ([18dd21a](https://github.com/bluelovers/vscode-ide-settings-sync/commit/18dd21a4bc6913c69bb908efd2df39974088824c))


### ✨　Features

* **ide:** 添加 kiro IDE 到已知 IDE 列表 ([a8635e1](https://github.com/bluelovers/vscode-ide-settings-sync/commit/a8635e16641e4ff4c398a4d2be511de691fb8fca))
* **webview:** Preact hydration for settings lists and source IDE indicator ([1112f5b](https://github.com/bluelovers/vscode-ide-settings-sync/commit/1112f5ba631f485ad29681b30b16aa1a3033b936))
* **webview:** use @preact/signals to reactively update source IDE indicator and settings list ([ee8d147](https://github.com/bluelovers/vscode-ide-settings-sync/commit/ee8d1474ffd68345ed2f0a62285ae97dbcd164bb))


### 📦　Code Refactoring

* **ideDetector:** 使用可配置的 path 函式庫提升跨平台相容性 ([e38f428](https://github.com/bluelovers/vscode-ide-settings-sync/commit/e38f428256a53f834ddb4791fe8bc6f162556982))
* **settings:** 提取設定同步邏輯到共用工具模組提高可測試性 ([b5876c0](https://github.com/bluelovers/vscode-ide-settings-sync/commit/b5876c0b5b39a35673650c8c25131009aea8fb29))
* **types:** 迁移至枚举类型并建立单一事实来源 ([a78fc7f](https://github.com/bluelovers/vscode-ide-settings-sync/commit/a78fc7f4a23aa2ef9fbe22346882f7128211728f))
* **types:** 以 EnumShowMessageType 列舉值取代字串字面值 ([ec1f6ef](https://github.com/bluelovers/vscode-ide-settings-sync/commit/ec1f6ef1ed5fe2075b721947f7c3c3e186d60359))
* **vscode:** 弃用 VSCode 导出导入服务适配器 ([9a871a5](https://github.com/bluelovers/vscode-ide-settings-sync/commit/9a871a557a2da9120c47f617a0383a7f2a0a23a2))
* **vscode:** 抽象化全域狀態管理 ([5add493](https://github.com/bluelovers/vscode-ide-settings-sync/commit/5add493b745e2aee67cc3b41a4e024ca2660522f))
* **vscode:** 迁移至枚举命令标识符 ([12dea93](https://github.com/bluelovers/vscode-ide-settings-sync/commit/12dea9306a90d3e7a838dde7345847fbe5011b58))
* **webview:** 合併 window-types 至 window-this 並更新所有導入路徑 ([9b187df](https://github.com/bluelovers/vscode-ide-settings-sync/commit/9b187df0f5dbeada1af136b55dac76d44ab9cae7))
* **webview:** 移除設定 HTML 生成與顯示函數 ([90d8456](https://github.com/bluelovers/vscode-ide-settings-sync/commit/90d8456f50655a446046bd2b5ecf70c3c172fdbb))
* **webview:** 集中管理枚举定义和元素选择器 ([e52b789](https://github.com/bluelovers/vscode-ide-settings-sync/commit/e52b789f2cd62c52023edb3d5db85395b561ab3b))
* **webview:** migrate hardcoded selectors to enums ([135f452](https://github.com/bluelovers/vscode-ide-settings-sync/commit/135f45238fa7b8ccd922e4011cd4fbdd831347d9))
* **webview:** migrate HTML string events to Preact JSX handlers and signals ([3984999](https://github.com/bluelovers/vscode-ide-settings-sync/commit/39849999fc645079e50ca1bbb3a464874ba71826))
* **webview:** rename components for improved clarity and consistency ([cc9ec13](https://github.com/bluelovers/vscode-ide-settings-sync/commit/cc9ec1376d7d0f4d90edcc004922dc5be0b2434f))
* **webview:** 重構全域類型與 API 至獨立模組 ([9852c8e](https://github.com/bluelovers/vscode-ide-settings-sync/commit/9852c8efaecda79434b443e77a67a5befc39c851))
* **webview:** 重構設定列表操作為添加模式並提升類型安全 ([9303eab](https://github.com/bluelovers/vscode-ide-settings-sync/commit/9303eaba3c5850b8a978860a05905f4af5d3b9d0))
* **webview:** 重命名 ideList 為 availableIDEs 並將 sourceIDEUuid 設為可選 ([c55902b](https://github.com/bluelovers/vscode-ide-settings-sync/commit/c55902bc4e0eb5066dbd2b3970ba8cc691c2baac))
* **webview:** improve type safety with IWebviewState and IWebviewWindow interfaces ([f6762ee](https://github.com/bluelovers/vscode-ide-settings-sync/commit/f6762ee7f78e32ae69f240191f72836615edca53))
* **webview:** 重命名命令列舉以遵循命名規範 ([3b2cbc6](https://github.com/bluelovers/vscode-ide-settings-sync/commit/3b2cbc6890c05f92e5227711ca62790084661c76))
* **webview:** unified message protocol with WebviewCommand/HostCommand enums ([937d290](https://github.com/bluelovers/vscode-ide-settings-sync/commit/937d2903f0e53f4193e4a9aa1b5f04ca0d5a0669))
* **webview:** remove legacy SSR components after migration to webview/src ([0fe0538](https://github.com/bluelovers/vscode-ide-settings-sync/commit/0fe05382ee1df80ca2f14a9b2d52dfc2a3e9dcd7))
* **webview:** replace updateWebview with pushDataRefresh for sync/delete/refresh ([05dec34](https://github.com/bluelovers/vscode-ide-settings-sync/commit/05dec3414bb7896e6d2d601c085ecd44b18a5d03))
* **webview:** migrate to Preact JSX with dedicated webview/ bundle ([35680b0](https://github.com/bluelovers/vscode-ide-settings-sync/commit/35680b02c6c63be133a6a8eec2a533559e52f539))


### 📚　Documentation

* 更新 Marketplace 安裝說明和關鍵字 ([7808e7a](https://github.com/bluelovers/vscode-ide-settings-sync/commit/7808e7acff0d451d5320cf8025fb0ab13ea1f063))
* 新增 VSCode Marketplace 安裝連結 ([f1795d8](https://github.com/bluelovers/vscode-ide-settings-sync/commit/f1795d8f1871aab07beb40af8d258f0940944a0f))
* **ide:** add documentation for new IDE detection workflow ([cacbff5](https://github.com/bluelovers/vscode-ide-settings-sync/commit/cacbff556cbae59d3a2a70d3c767b02034685780))
* **standards:** 實施嚴格的程式碼文檔與可維護性規範 ([496cb6c](https://github.com/bluelovers/vscode-ide-settings-sync/commit/496cb6c9ced57c01bc7c4e9691f8e9e76ef0e015))
* **webview:** add bilingual comments to WebviewCommand/HostCommand enums, interfaces, and switch-cases ([075cb32](https://github.com/bluelovers/vscode-ide-settings-sync/commit/075cb325be0f5f819665834933404ae5b4b45307))


### 🚨　Tests

* 重構測試框架使用 fixture 資料並簡化 mock 依賴 ([1a2abbf](https://github.com/bluelovers/vscode-ide-settings-sync/commit/1a2abbf3a54afea7cdbbf986668c6733f3071ebb))
* **infrastructure:** 添加測試模擬設施工具並重構測試框架 ([2b8b0ba](https://github.com/bluelovers/vscode-ide-settings-sync/commit/2b8b0ba1abcf2bd743bf2712016e469928f674c8))


### 🛠　Build System

* **config:** 更新 TypeScript 模組目標為 ES2022 ([0619c92](https://github.com/bluelovers/vscode-ide-settings-sync/commit/0619c9249c1c843b6f5871301e959f6356445463))


### 📌　Dependencies

* update deps ([34be698](https://github.com/bluelovers/vscode-ide-settings-sync/commit/34be6988b68b054a309ecb32e30d3a47b720fcf9))


### 🔖　Miscellaneous

* . ([017b5c7](https://github.com/bluelovers/vscode-ide-settings-sync/commit/017b5c7a579417e1423f6af7c73812a66700c5c2))
* . ([634893b](https://github.com/bluelovers/vscode-ide-settings-sync/commit/634893b37ecb22a5ff867c37a02d4a4d933eadd6))



## [0.0.6](https://github.com/bluelovers/vscode-ide-settings-sync/compare/vscode-ide-settings-sync@0.0.5...vscode-ide-settings-sync@0.0.6) (2026-04-12)



### 🐛　Bug Fixes

* **ui:** 修正同步設定的來源 IDE。提取來源 IDE 指示器與設定導航元件並改用 UUID 識別 ([218d072](https://github.com/bluelovers/vscode-ide-settings-sync/commit/218d072ea9331c531270ab76482230370272ba10))


### ✨　Features

* **ide:** 新增來源 IDE 選擇器與檔案快取持久化 ([6bdc9fc](https://github.com/bluelovers/vscode-ide-settings-sync/commit/6bdc9fc7679f1d89ff1116d69c3f3bc63731f0bc))
* **openspec:** 新增 OpenSpec 工作流程設定檔與技能定義 ([ad58e0a](https://github.com/bluelovers/vscode-ide-settings-sync/commit/ad58e0a04356c2cac4ff2290003440a630b1f3dc))


### 📦　Code Refactoring

* **lang:** 提取語言配置邏輯至共用工具模組 ([59479a1](https://github.com/bluelovers/vscode-ide-settings-sync/commit/59479a1efde9872626c7d7ca61d4422f41f40f9b))


### 💎　Styles

* 统一代码格式，增强可读性 ([7ea3d1e](https://github.com/bluelovers/vscode-ide-settings-sync/commit/7ea3d1e2d45edf3cbf2363f1e190eb4e133f647b))



## 0.0.5 (2026-04-12)


### BREAKING CHANGES

* **ide:** 將 IDE 列表轉換邏輯提取至公用程式模組
* **ide:** 新增獨立 IDE 偵測工具並重構 Provider
* **settings:** 新增三個 globalState 鍵值 (searchHistory, selectedSettings, selectedIDEs)



### 🐛　Bug Fixes

* **settings:** add fallback language reordering and multilingual descriptions ([af8a8cd](https://github.com/bluelovers/vscode-ide-settings-sync/commit/af8a8cd0a38d17537b3e2ee8ab0d5f5ae457a8e0))


### ✨　Features

* 增強 IDE 偵測功能並新增資料夾開啟能力 ([d9f3df1](https://github.com/bluelovers/vscode-ide-settings-sync/commit/d9f3df1f7839829ae7abec96f7deb83371be8d95))
* 初始化 VSCode IDE Settings Sync 擴充功能 ([98798e8](https://github.com/bluelovers/vscode-ide-settings-sync/commit/98798e8bc8f82029d6cec638576e7c80f8f7554b))
* **custom-ide:** 新增 UUID 支援以穩定識別自訂 IDE，並簡化移除流程 ([6bd41eb](https://github.com/bluelovers/vscode-ide-settings-sync/commit/6bd41eb34707af3d1593661d629e060a4280b414))
* **export-import:** 新增設定與自訂 IDE 的匯出匯入功能 ([fd2844d](https://github.com/bluelovers/vscode-ide-settings-sync/commit/fd2844d45de1edb997a448e44b549109a8fa0396))
* **ide:** 新增獨立 IDE 偵測文件、CLI 工具與範例 ([39b6d4c](https://github.com/bluelovers/vscode-ide-settings-sync/commit/39b6d4c821aeeb3d6c60b5e6aaa02c7d7ee3b011))
* **ide:** 新增 Windsurf IDE 支援 ([1bf8c25](https://github.com/bluelovers/vscode-ide-settings-sync/commit/1bf8c250ae092082f843ee7b713276052eae18f3))
* **ide:** add duplicate detection and validation for custom IDE paths ([a06b579](https://github.com/bluelovers/vscode-ide-settings-sync/commit/a06b579532569235f1ed8bc088b715dc6612b636))
* **ide:** add saveSync to persist settings across IDEs after sync operations ([5e928d0](https://github.com/bluelovers/vscode-ide-settings-sync/commit/5e928d06568ef2948d084103216a1f64d3e8c042))
* **settings:** update save button text for clarity ([0ccf5d2](https://github.com/bluelovers/vscode-ide-settings-sync/commit/0ccf5d22d6a0515e93bf54ec29e2297c1568a0bf))
* **settings:** 新增設定重新整理功能及錯誤處理優化 ([38200ff](https://github.com/bluelovers/vscode-ide-settings-sync/commit/38200ffdf961d9839bd55a4cb15168dd65482696))
* **settings:** 新增搜尋歷史與已選取設定的狀態保存功能 ([d72dcfb](https://github.com/bluelovers/vscode-ide-settings-sync/commit/d72dcfb93e9c2f01e628647ea8986127d957e202))
* **ui:** highlight current IDE in settings sync panel with visual styling ([5870d5e](https://github.com/bluelovers/vscode-ide-settings-sync/commit/5870d5efbbb29c504b17b625c79c9b5797e546b6))
* **utils:** 新增 JSX 渲染工具函數與完整型別支援 ([a22cf11](https://github.com/bluelovers/vscode-ide-settings-sync/commit/a22cf11779b2d1d0a52622972f95fdbc9d948fd9))


### 📦　Code Refactoring

* **css:** extract inline CSS to SCSS file and refactor esbuild config with TypeScript ([7a8f95d](https://github.com/bluelovers/vscode-ide-settings-sync/commit/7a8f95dc487c920fd86b810f6365955d2c3967bc))
* **ide:** 將 IDE 列表轉換邏輯提取至公用程式模組 ([e3e4f2f](https://github.com/bluelovers/vscode-ide-settings-sync/commit/e3e4f2f59dc336e09102650b26c6dea74564fc3e))
* **ide:** 新增獨立 IDE 偵測工具並重構 Provider ([65ba1b5](https://github.com/bluelovers/vscode-ide-settings-sync/commit/65ba1b529f8655bfe6bd3daef38aa8e9743cea0d))
* **ide:** 重構 IdeSettingProvider 參數順序並新增暫存功能 ([8a4dbca](https://github.com/bluelovers/vscode-ide-settings-sync/commit/8a4dbcaa7071a15038a452e2cd45ce7216997ae5))
* **ide:** replace JsonHandler with IdeSettingProvider abstraction ([a271a14](https://github.com/bluelovers/vscode-ide-settings-sync/commit/a271a14b3991fcea200c1211b020c6501c105b64))
* **ide:** 新增 IdeSettingProvider 並重構 JsonHandler 工具類 ([b48443a](https://github.com/bluelovers/vscode-ide-settings-sync/commit/b48443a69d1a8877e550b95a964afaf137a28898))
* **ide:** 使用 JsonHandler 與 TypeScript enum 重構 IDE 設定管理 ([92d0af5](https://github.com/bluelovers/vscode-ide-settings-sync/commit/92d0af5a41de85f2f82067617e8df0809ecf4065))
* **style:** 統一設定描述檔格式並優化縮排規範 ([b35773a](https://github.com/bluelovers/vscode-ide-settings-sync/commit/b35773ae714e8d81866a827ec9a9f64f7aeddc16))
* **types:** 重新命名介面以符合 TypeScript 命名規範 ([a6fdf34](https://github.com/bluelovers/vscode-ide-settings-sync/commit/a6fdf341ba780ef5079e6138c9f7506ece48cdd7))
* **ui:** optimize settingsSyncPanel SCSS with variables and mixins ([3ae90b3](https://github.com/bluelovers/vscode-ide-settings-sync/commit/3ae90b35d2bf21e8e32a199eb8d06bc85b3f9db9))
* **webview:** 重構 IDE 列表為獨立組件並新增路徑工具函數 ([6fb4d73](https://github.com/bluelovers/vscode-ide-settings-sync/commit/6fb4d73e019c9fe088f81849a5e787d109bd5ccf))
* **webview:** 新增 Preact JSX 渲染支援至設定同步面板 ([eb3ec01](https://github.com/bluelovers/vscode-ide-settings-sync/commit/eb3ec01a1983bae19fef0b8a633f2b29a8ab5328))


### 📚　Documentation

* 移除 README 中的 WebView 開發注意事項，將其移至 QUICKSTART.md ([179bd3d](https://github.com/bluelovers/vscode-ide-settings-sync/commit/179bd3d8510235ad989544b9643c6d9f4a0da2f8))
* 更新文檔加入測試說明與快捷鍵配置 ([ba747e5](https://github.com/bluelovers/vscode-ide-settings-sync/commit/ba747e501bfc935607c686457c629007dc85d059))
* **export-import:** 新增匯出匯入功能文件與範例程式 ([e069e81](https://github.com/bluelovers/vscode-ide-settings-sync/commit/e069e81de09652db3b06deb980b3ca9f387c52c5))
* **refactor:** 將專案文檔轉換為繁體中文 ([630c6bd](https://github.com/bluelovers/vscode-ide-settings-sync/commit/630c6bd08e27dba3ef951c17c0515d56e92038a9))


### 💎　Styles

* **webview:** 移動 ts-ignore 註解位置並調整屬性縮排 ([cd7190b](https://github.com/bluelovers/vscode-ide-settings-sync/commit/cd7190b2fa35b3876bb512b19b19c53f6aa4a231))


### 🚨　Tests

* **ide:** 新增 ideListToWebviewContent 測試與 WebView 開發指南 ([f762e9d](https://github.com/bluelovers/vscode-ide-settings-sync/commit/f762e9d31e4640393c5dc04b58e188507664d742))
* **ide:** 新增 Custom IDE 功能的全面測試 ([7f00eda](https://github.com/bluelovers/vscode-ide-settings-sync/commit/7f00eda242db5f2ea4c1a2ccfacdff1a310712ab))
* **webview:** 新增 @testing-library/preact 與 renderToString 快照測試 ([3a86165](https://github.com/bluelovers/vscode-ide-settings-sync/commit/3a86165241edfca7e24f4a81fb70ca9435e066e8))


### 🛠　Build System

* content security policy ([05b04ad](https://github.com/bluelovers/vscode-ide-settings-sync/commit/05b04ad7d46e4c7954e7d2e3305d827f0aede974))
* migrate to pnpm and add Jest testing framework ([d8e8082](https://github.com/bluelovers/vscode-ide-settings-sync/commit/d8e8082247534691684f5c4c8202942d51488e27))
* update TypeScript configuration for modern module handling ([0a655fd](https://github.com/bluelovers/vscode-ide-settings-sync/commit/0a655fdf09b63ccd4c743da1bb8e2a6d6b6a0ecc))
* **deps:** 遷移專案從 npm 到 pnpm 套件管理器 ([6bf1641](https://github.com/bluelovers/vscode-ide-settings-sync/commit/6bf1641a0198c53a4387b667c2a4950845aecc8a))


### ♻️　Chores

* **build:** 優化建置配置與 Webview 安全性 ([561756e](https://github.com/bluelovers/vscode-ide-settings-sync/commit/561756ec119306749d347253e13178f76b259b0e))
* **ui:** suppress TypeScript error for scss import ([262fa00](https://github.com/bluelovers/vscode-ide-settings-sync/commit/262fa00f94ce0dbefb9b8ee5bb6cb78336bfe70b))


### 🔖　Miscellaneous

* . ([1ee8aa6](https://github.com/bluelovers/vscode-ide-settings-sync/commit/1ee8aa6f4e8a6d203824c37207a7fe2a574f8e2f))
