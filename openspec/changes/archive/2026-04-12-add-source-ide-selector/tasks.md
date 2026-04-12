## 1. UI 元件修改

- [x] 1.1 在 AvailableIDEItem 組件中添加 Radio 選擇器（來源 IDE 選擇）
- [x] 1.2 在 UnavailableIDEItem 組件中禁用 Radio 選擇器
- [x] 1.3 為來源 IDE 添加 CSS 類別 `.source-ide` 以實現高亮顯示
- [x] 1.4 在 IDEListSection 下方添加來源 IDE 顯示指示器

## 2. 狀態管理

- [x] 2.1 在 IIDEListProps 中新增 sourceIDEIndex 屬性
- [x] 2.2 實現來源 IDE 選擇的點擊處理函式
- [x] 2.3 實現預設選擇第一個可用 IDE 作為來源

## 3. 指令碼更新

- [x] 3.1 添加 selectSourceIDE 函式至 IDEListScript
- [x] 3.2 處理來源 IDE 變更時的消息傳遞

## 4. 樣式調整

- [x] 4.1 添加 `.source-ide` CSS 樣式（不同背景色）
- [x] 4.2 添加來源 IDE 指示器樣式
