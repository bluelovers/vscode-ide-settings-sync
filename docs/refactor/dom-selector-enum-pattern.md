# DOM Selector Enum Pattern

## 概述 / Overview

本規則定義如何將分散在程式碼中的硬編碼 DOM ID 與 CSS 類別選擇器重構為統一的 Enum 管理，建立單一事實來源（Single Source of Truth）。

This rule defines how to refactor scattered hardcoded DOM IDs and CSS class selectors into unified Enum management, establishing a Single Source of Truth.

---

## 問題情境 / Problem Context

### 不良範例 / Bad Practice

```typescript
// ❌ 硬編碼 ID - 維護困難、容易出錯
const element = document.getElementById('searchResults');
const input = document.getElementById('searchInput') as HTMLInputElement;

// ❌ 硬編碼 CSS 類別選擇器
const radio = document.querySelector<HTMLInputElement>('.ide-source-radio:checked');
const checkbox = document.querySelector('.ide-checkbox');
const tabs = document.querySelector('.tabs');
```

**問題：**
- 字串分散在多處，修改時需要全局搜尋替換
- 無法在編譯期檢查錯誤，只能在執行期發現
- IDE 無法提供自動完成與重構支援
- 容易造成拼寫錯誤導致選擇器失效

---

## 解決方案 / Solution

### 1. 建立 Enum 定義 / Create Enum Definitions

```typescript
// scripts/elem-get.ts

/**
 * DOM 元素 ID 列舉（單一事實來源）
 * DOM element ID enum (Single Source of Truth)
 */
export const enum EnumWebviewElemId
{
  /** 搜尋結果容器 / Search results container */
  searchResults = 'searchResults',
  /** 搜尋輸入框 / Search input field */
  searchInput = 'searchInput',
  /** 訊息顯示容器 / Message display container */
  message = 'message',
  // ... 其他 ID
}

/**
 * CSS 類別選擇器列舉（單一事實來源）
 * CSS class selector enum (Single Source of Truth)
 */
export const enum EnumCssClassSelector
{
  /** 分頁導航容器 / Tab navigation container */
  tabs = 'tabs',
  /** IDE 項目元素 / IDE item element */
  ideItem = 'ide-item',
  /** IDE 勾選框 / IDE checkbox */
  ideCheckbox = 'ide-checkbox',
  /** IDE 來源單選按鈕 / IDE source radio button */
  ideSourceRadio = 'ide-source-radio',
}
```

### 2. 建立 Helper 函式 / Create Helper Functions

```typescript
/**
 * 將 EnumCssClassSelector 轉換為 CSS 類別選擇器字串（帶 . 前綴）
 * Convert EnumCssClassSelector to CSS class selector string (with . prefix)
 */
export function getClassSelector(className: EnumCssClassSelector): string
{
  return `.${className}`;
}

/**
 * 透過 EnumWebviewElemId 查詢單一元素
 * Query single element by EnumWebviewElemId
 */
export function queryWebviewElemById<T extends HTMLElement>(id: EnumWebviewElemId): T | null
{
  return document.getElementById(id) as T | null;
}

/**
 * 透過 EnumCssClassSelector 查詢單一元素
 * Query single element by EnumCssClassSelector
 */
export function queryWebviewElemByClass<T extends HTMLElement>(
  classSelector: EnumCssClassSelector
): T | null
{
  return document.querySelector<T>(getClassSelector(classSelector));
}

/**
 * 透過 EnumCssClassSelector 查詢所有匹配元素
 * Query all elements by EnumCssClassSelector
 */
export function queryWebviewElemAllByClass<T extends HTMLElement>(
  classSelector: EnumCssClassSelector
): NodeListOf<T>
{
  return document.querySelectorAll<T>(getClassSelector(classSelector));
}
```

### 3. 使用範例 / Usage Examples

```typescript
// ✅ 使用 Enum - 類型安全、可維護
import { EnumWebviewElemId, EnumCssClassSelector } from './scripts/elem-get';
import { getClassSelector, queryWebviewElemById } from './scripts/elem-get';

// 基本元素查詢 / Basic element query
const searchResults = queryWebviewElemById<HTMLDivElement>(
  EnumWebviewElemId.searchResults
);

// 帶偽類選擇器 / With pseudo-class selector
const checkedRadio = document.querySelector<HTMLInputElement>(
  `${getClassSelector(EnumCssClassSelector.ideSourceRadio)}:checked`
);

// 帶屬性選擇器 / With attribute selector
const radioByValue = document.querySelector<HTMLInputElement>(
  `${getClassSelector(EnumCssClassSelector.ideSourceRadio)}[value="${uuid}"]`
);

// 查詢所有匹配元素 / Query all matching elements
document.querySelectorAll(
  `${EnumCssClassSelector.ideCheckbox}:checked`
).forEach(cb => {
  // 處理勾選框
});
```

---

## 重構步驟 / Refactoring Steps

### 步驟 1：識別所有硬編碼選擇器

```bash
# 搜尋 getElementById 硬編碼
grep -r "getElementById\(['\"][^'\"]*['\"]\)" src/

# 搜尋 querySelector 硬編碼 CSS 類別
grep -r "querySelector.*['\"]\\.[^'\"]*['\"]" src/
```

### 步驟 2：建立 Enum 定義

在 `scripts/elem-get.ts`（或適當位置）建立 Enum：

```typescript
export const enum EnumWebviewElemId {
  // 收集所有 ID
  searchResults = 'searchResults',
  searchInput = 'searchInput',
  // ...
}

export const enum EnumCssClassSelector {
  // 收集所有 CSS 類別
  tabs = 'tabs',
  ideItem = 'ide-item',
  // ...
}
```

### 步驟 3：建立 Helper 函式

```typescript
export function getClassSelector(className: EnumCssClassSelector): string {
  return `.${className}`;
}

export function queryWebviewElemById<T extends HTMLElement>(
  id: EnumWebviewElemId
): T | null {
  return document.getElementById(id) as T | null;
}
```

### 特殊情況：Tab ID 重構 / Special Case: Tab ID Refactoring

Tab ID 同時作為 DOM ID 和邏輯識別符使用，應使用獨立的 Enum 管理：

```typescript
// enums.ts - 獨立於 EnumWebviewElemId
export const enum EnumTabName
{
  /** 同步設定分頁 / Sync settings tab */
  sync = 'sync',
  /** 檢視所有設定分頁 / View all settings tab */
  values = 'values',
  /** 已選設定分頁 / Selected settings tab */
  selected = 'selected',
  /** 匯出/匯入分頁 / Export/Import tab */
  exportImport = 'export-import',
}

/** 所有分頁的有序陣列 / Ordered array of all tabs */
export const ALL_TAB_NAMES: EnumTabName[] = [
  EnumTabName.sync,
  EnumTabName.values,
  EnumTabName.selected,
  EnumTabName.exportImport,
];
```

#### 使用範例 / Usage Example

```typescript
// ❌ 之前 - 硬編碼 Tab ID
<div id="sync" className="tab-content">

// ✅ 之後 - 使用 EnumTabName
import { EnumTabName } from '../../enums';

<div id={EnumTabName.sync} className="tab-content">

// Tab 切換邏輯也使用相同 Enum
import { ALL_TAB_NAMES } from '../../enums';

ALL_TAB_NAMES.forEach(tabName => {
  const el = document.getElementById(tabName);
  el?.classList.toggle('active', tabName === currentTab);
});
```

**區分原則：**
- `EnumTabName` - 用於 Tab 導航的 ID（同時是邏輯識別符）
- `EnumWebviewElemId` - 用於內容區域的容器 ID（純 DOM 元素）

---

### 步驟 4：逐步替換所有使用處

#### 替換 getElementById
```typescript
// 之前
const el = document.getElementById('searchResults');

// 之後
const el = queryWebviewElemById<HTMLDivElement>(EnumWebviewElemId.searchResults);
```

#### 替換 querySelector（基本類別）
```typescript
// 之前
const el = document.querySelector<HTMLElement>('.tabs');

// 之後
const el = queryWebviewElemByClass<HTMLElement>(EnumCssClassSelector.tabs);
```

#### 替換 querySelector（帶偽類）
```typescript
// 之前
const radio = document.querySelector<HTMLInputElement>('.ide-source-radio:checked');

// 之後
const radio = document.querySelector<HTMLInputElement>(
  `${getClassSelector(EnumCssClassSelector.ideSourceRadio)}:checked`
);
```

#### 替換 querySelector（帶屬性）
```typescript
// 之前
const radio = document.querySelector<HTMLInputElement>(`.ide-source-radio[value="${uuid}"]`);

// 之後
const radio = document.querySelector<HTMLInputElement>(
  `${getClassSelector(EnumCssClassSelector.ideSourceRadio)}[value="${uuid}"]`
);
```

#### 替換 querySelectorAll
```typescript
// 之前
document.querySelectorAll('.ide-checkbox:checked').forEach(cb => { ... });

// 之後
document.querySelectorAll(`${EnumCssClassSelector.ideCheckbox}:checked`).forEach(cb => { ... });
```

### 步驟 5：驗證無遺漏

```bash
# 確認無硬編碼殘留
grep -r "getElementById\(['\"][^'\"]*['\"]\)" src/ || echo "✓ No hardcoded IDs found"
grep -r "querySelector.*['\"]\\.[^'\"]*['\"]" src/ || echo "✓ No hardcoded class selectors found"
```

---

## 命名規範 / Naming Conventions

### Enum 名稱

| 類型 | 命名模式 | 範例 |
|------|---------|------|
| DOM ID | `Enum{Name}ElemId` | `EnumWebviewElemId` |
| CSS 類別 | `Enum{Name}ClassSelector` | `EnumCssClassSelector` |

### Enum 成員

| 原始字串 | Enum 成員名稱 |
|---------|---------------|
| `search-results` | `searchResults` |
| `ide-checkbox` | `ideCheckbox` |
| `source-ide-indicator` | `sourceIdeIndicator` |

**原則：** 使用 camelCase，移除連字符號。

---

## 檔案結構 / File Structure

```
src/
├── scripts/
│   └── elem-get.ts          # Enum 與 helper 函式定義
├── components/
│   └── tabs/
│       ├── SyncTab.tsx      # 使用 EnumWebviewElemId
│       └── SelectedTab.tsx
├── store.ts                 # 使用 EnumCssClassSelector
└── index.tsx               # 使用 enum 查詢元素
```

---

## 優點 / Benefits

1. **單一事實來源** - 所有選擇器定義集中管理
2. **編譯期安全** - TypeScript 會檢查無效的 enum 值
3. **IDE 支援** - 自動完成、重構、導航
4. **可維護性** - 修改一處，全局生效
5. **可發現性** - 新開發者可快速找到所有可用選擇器

---

## 例外情況 / Exceptions

以下情況可保留硬編碼：

1. **動態生成的選擇器** - 包含變數插值的選擇器
   ```typescript
   // 可接受：動態 index
   document.querySelector(`[data-index="${index}"]`)
   ```

2. **測試檔案** - 測試中的選擇器可使用硬編碼（但建議仍使用 enum）

3. **第三方庫整合** - 外部庫要求的特定選擇器格式

---

## 參考實作 / Reference Implementation

完整範例請參考：
- `webview/src/scripts/elem-get.ts` - Enum 定義
- `webview/src/index.tsx` - 實際使用範例
- `webview/src/store.ts` - CSS 類別選擇器使用
- `webview/src/scripts/sync.ts` - 複合選擇器使用

---

## 相關資源 / Related Resources

- [TypeScript Enum 文件](https://www.typescriptlang.org/docs/handbook/enums.html)
- [Single Source of Truth 設計模式](https://en.wikipedia.org/wiki/Single_source_of_truth)
