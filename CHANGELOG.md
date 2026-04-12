# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
