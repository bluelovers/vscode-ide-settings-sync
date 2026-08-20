# 已支援的 IDE 清單

本文檔列出本擴充功能所支援的 IDE 以及各作業系統預設的設定檔路徑。

---

## 支援的 IDE 清單

| IDE 名稱 | 資料夾名稱 | 說明 |
|----------|------------|------|
| Visual Studio Code | `Code` | 標準版的 VS Code |
| Visual Studio Code - Insiders | `Code - Insiders`<br>`Code-Insiders`<br>`CodeInsiders` | VS Code 測試版 |
| Antigravity | `Antigravity` | Antigravity IDE |
| CodeBuddy CN | `CodeBuddy CN`<br>`CodeBuddy-CN`<br>`CodeBuddyCN` | CodeBuddy 中文版 |
| Windsurf | `Windsurf` | Windsurf IDE |
| kiro | `Kiro`<br>`kiro` | AI 驅動的 IDE |
| Cursor | `Cursor` | AI 程式碼編輯器 |
| Devin | `Devin` | Devin AI 工程師 |

---

## 各系統設定檔路徑

不同作業系統的預設路徑如下，並排顯示便於快速查閱：

| IDE | Windows | macOS | Linux |
|-----|---------|-------|-------|
| Visual Studio Code | `%APPDATA%\Code\User\settings.json` | `~/.config/Code/User/settings.json` | `~/.config/Code/User/settings.json` |
| Visual Studio Code - Insiders | `%APPDATA%\Code - Insiders\User\settings.json` | `~/.config/Code - Insiders/User/settings.json` | `~/.config/Code - Insiders/User/settings.json` |
| Antigravity | `%APPDATA%\Antigravity\User\settings.json` | `~/.config/Antigravity/User/settings.json` | `~/.config/Antigravity/User/settings.json` |
| CodeBuddy CN | `%APPDATA%\CodeBuddy CN\User\settings.json` | `~/.config/CodeBuddy CN/User/settings.json` | `~/.config/CodeBuddy CN/User/settings.json` |
| Windsurf | `%APPDATA%\Windsurf\User\settings.json` | `~/.config/Windsurf/User/settings.json` | `~/.config/Windsurf/User/settings.json` |
| kiro | `%APPDATA%\Kiro\User\settings.json` | `~/.config/Kiro/User/settings.json` | `~/.config/Kiro/User/settings.json` |
| Cursor | `%APPDATA%\Cursor\User\settings.json` | `~/.config/Cursor/User/settings.json` | `~/.config/Cursor/User/settings.json` |
| Devin | `%APPDATA%\Devin\User\settings.json` | `~/.config/Devin/User/settings.json` | `~/.config/Devin/User/settings.json` |

**各系統路徑格式：**

| 系統 | 路徑格式 |
|------|----------|
| Windows | `%APPDATA%\{IDEName}\User\settings.json` |
| macOS | `~/.config/{IDEName}/User/settings.json` |
| Linux | `~/.config/{IDEName}/User/settings.json` |

**常見實際路徑（Windows）：**

```
C:\Users\{UserName}\AppData\Roaming\Code\User\settings.json
C:\Users\{UserName}\AppData\Roaming\Code - Insiders\User\settings.json
```

**常見實際路徑（macOS）：**

```
~/.config/Code/User/settings.json
~/Library/Application Support/Code/User/settings.json
```

> **Note:** 在 macOS 上，部分應用程式可能將資料儲存於 `~/Library/Application Support/` 目錄。

---

## 自訂 IDE 路徑

若您安裝的 IDE 不在上述清單中，或使用了自訂的安裝路徑，您可以透過擴充功能設定來新增自訂 IDE。

### 設定方式

1. 開啟 VS Code 設定 (`Ctrl+,` 或 `Cmd+,`)
2. 搜尋 `IDE Settings Sync` 相關設定
3. 新增自訂 IDE 路徑

### 手動設定

您也可以直接修改 VS Code 的擴充功能設定 JSON：

```json
{
  "ideSettingsSync.customIDEs": [
    {
      "name": "My Custom IDE",
      "path": "/path/to/your/ide/User/settings.json"
    }
  ]
}
```

---

## 路徑偵測機制

本擴充功能會依序執行以下偵測邏輯：

1. **優先順序**：嘗試多個可能的資料夾名稱（如 `Code - Insiders` 優先於 `Code-Insiders`）
2. **驗證方式**：檢查資料夾是否存在，並確認 `settings.json` 檔案可讀取
3. **平台判斷**：根據 `process.platform` 自動選用對應的路徑格式

若偵測失敗，會記錄失敗的路徑供使用者參考。
