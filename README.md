# VSCode IDE Settings Sync

A Visual Studio Code extension that synchronizes IDE settings across multiple VS Code-based IDEs.

## 功能特色

- **多 IDE 支援**：可同步設定至 Visual Studio Code、VS Code Insiders、Antigravity、CodeBuddy CN 或自訂 IDE 路徑
- **搜尋與探索**：輕鬆搜尋設定並檢視所有偵測到的 IDE 中的目前值
- **同步前預覽**：在同步前查看每個 IDE 中的設定值
- **精選同步**：選擇要同步的設定和目標 IDE
- **刪除設定**：從特定 IDE 移除設定
- **自訂 IDE**：新增自訂 IDE 路徑以支援不受支援的 IDE

## 安裝

1. 開啟 VS Code
2. 開啟擴充功能 Marketplace
3. 搜尋 "IDE Settings Sync"
4. 點擊安裝

或從命令列安裝：

```bash
code --install-extension bluelovers.vscode-ide-settings-sync
```

## 使用方法

1. 開啟命令選擇區（`Ctrl+Shift+P` / `Cmd+Shift+P`）

2. 搜尋並執行 **"Open IDE Settings Sync Panel"**

3. 在面板中：
   - 選擇要同步的 IDE（可多選）
   - 搜尋特定設定或瀏覽所有設定
   - 選擇要同步的設定
   - 選擇來源 IDE（第一個選擇的 IDE）
   - 點擊 **"Sync Selected"** 執行同步

## 新增自訂 IDE

1. 在 IDE 選擇區點擊 **"Add Custom IDE Path"**
2. 輸入 IDE 使用者資料資料夾的路徑（包含 `settings.json`）
3. 為 IDE 設定顯示名稱
4. IDE 會被新增至同步清單

## 移除自訂 IDE

點擊自訂 IDE 項目旁的 **"Remove"** 按鈕

## 常見問題

### Q: 為什麼有些設定無法同步？
A: 某些設定可能因為使用特殊字元或位於巢狀物件中而無法顯示。此外，只有使用者設定會被同步（工作區特定設定不會同步）。

### Q: 可以跨不同類型的 IDE 同步設定嗎？
A: 可以，但某些 IDE 特有的設定可能不相容。擴充功能會嘗試同步所有選取的設定。

### Q: settings.json 中的註解會被保留嗎？
A: 是的，會被保留。擴充功能使用 `jsonc-parser` 可支援保留 JSON 檔案中的註解。

### Q: 如何回報問題或請求功能？
A: 請在 GitHub 存放庫中開啟 Issue。

## 疑難排解

- **設定無法同步**：確保目標 IDE 的 `settings.json` 檔案可寫入
- **IDE 未偵測到**：嘗試新增自訂路徑或檢查 IDE 的安裝位置
- **設定沒有出現**：某些設定可能因為使用特殊字元或位於巢狀物件中而無法顯示

## 已知限制

- `settings.json` 中的註解在同步時會被保留
- 不會同步工作區特定設定（僅同步使用者設定）
- 某些 IDE 特有的設定可能無法跨不同 IDE 類型相容

## 支援

如需問題回報和功能請求，請在 GitHub 存放庫中開啟 Issue。

## 文件目標讀者分組

| 檔案                            | 目標讀者                      | 內容焦點                                             |
| ------------------------------- | ----------------------------- | ---------------------------------------------------- |
| README.md                       | 使用者 (End Users)            | 功能介紹、安裝說明、使用方法、常見問題、疑難排解     |
| QUICKSTART.md                   | 開發者 (Extension Developers) | 開發環境設定、建置指令、測試方式、發布流程、專案結構 |
| .github/copilot-instructions.md | AI Agent                      | 技術棧、專案結構、開發規範、測試與建置命令           |
