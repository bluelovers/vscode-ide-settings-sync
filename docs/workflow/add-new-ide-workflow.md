# 新增 IDE 偵測支援的工作流程
# Workflow for Adding New IDE Detection Support

## 步驟 1：編輯 knownIDEs.ts
1. 開啟 `src/data/knownIDEs.ts` 檔案
2. 在 `knownIDEs` 陣列的適當位置添加新的 IDE 配置對象
3. 每個 IDE 配置必須包含：
   - `name`: IDE 的顯示名稱（字串）
   - `appFolderNames`: 可能的資料夾名稱陣列（按優先順序排序，最可能的名稱放在前面）

## 步驟 2：添加 IDE 配置範例
```typescript
{
  name: 'Your IDE Name',
  // 可能的資料夾名稱變化
  // Possible folder name variations
  appFolderNames: ['FolderName1', 'FolderName2'],
}
```

## 步驟 3：驗證變更
1. 儲存檔案後，執行偵測測試來驗證新增的 IDE 能被正確偵測：
   ```bash
   tsx test/standalone-detection-test.js
   ```
2. 檢查測試輸出以確認：
   - 新增的 IDE 被列在詳細偵測結果中
   - 偵測結果顯示為「已偵測 / Detected: true」
   - 正確找到了路徑和設定檔

## 步驟 4：提交變更
1. 確認測試通過後，將變更提交到版本控制系統
2. 更新相關文檔（如支援的 IDE 列表）

## 注意事項
- 資料夾名稱的優先順序很重要：將最常見或最可能成功的名稱放在前面
- 系統會依序嘗試各個名稱，直到找到存在的資料夾
- 每個 IDE 配置必須使用 `as const` 斷言來保證類型安全
- 添加新 IDE 後，建議更新 `docs/supported-ides.md` 文檔