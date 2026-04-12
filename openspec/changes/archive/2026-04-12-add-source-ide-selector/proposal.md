## Why

當前同步 UI 允許使用者選擇多個 IDE 進行設定同步，但未提供明確的「來源 IDE」選擇機制。使用者難以辨別設定資料的同步方向（來源 → 目標），可能導致無意的設定覆蓋與資料遺失。

## What Changes

- 在每個 IDE 選項前方增加 Radio 選擇器，用於指定該 IDE 作為「來源 IDE」
- 來源 IDE 的設定將作為同步的來源資料，同步至其他目標 IDE
- 在 IDE 列表下方顯示目前被選擇的來源 IDE
- 將被選擇的來源 IDE 以不同顏色高亮顯示

## Capabilities

### New Capabilities

- `source-ide-selector`: 新增來源 IDE 選擇器功能，讓使用者明確指定同步來源

### Modified Capabilities

- (無)

## Impact

- 影響程式碼：`src/components/` - UI 元件修改
- 影響類型：`src/types/` - 新增來源 IDE 狀態類型
