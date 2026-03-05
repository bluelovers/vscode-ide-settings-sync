# WebView 開發代碼注意事項

## 🔴 關鍵規則：`<script>` 標籤內只能使用純 JavaScript

### ❌ 禁止的 TypeScript 語法

在 `<script>` 標籤內**絕對不能**使用以下 TypeScript 語法：

```typescript
// ❌ 類型斷言 (Type Assertions)
(pathInput as HTMLInputElement).value = message.path;
(element as HTMLElement).style.display = 'block';
(array as string[]).forEach(item => ...);

// ❌ 類型註解 (Type Annotations)
const name: string = 'test';
function func(param: number): boolean { ... }
let config: IConfig = { ... };

// ❌ 泛型 (Generics)
const result = array.map<string>(item => item.toString());
const promise = new Promise<string>((resolve) => ...);

// ❌ 接口定義 (Interface Definitions)
interface ISettings { ... }
type ConfigType = { ... };

// ❌ 枚舉 (Enums)
enum Status { Active, Inactive }
```

### ✅ 正確的 JavaScript 語法

```javascript
// ✅ 直接使用屬性（瀏覽器會自動推斷類型）
pathInput.value = message.path;
element.style.display = 'block';
array.forEach(item => ...);

// ✅ 使用 JSDoc 註解（可選，用於 IDE 支援）
/** @type {string} */
const name = 'test';

/**
 * @param {number} param
 * @returns {boolean}
 */
function func(param) { ... }

// ✅ 使用原生 JavaScript 方法
const result = array.map(item => item.toString());
const promise = new Promise((resolve) => ...);
```

## 🎯 實際案例對比

### 案例 1：DOM 元素操作

```typescript
// ❌ 錯誤 - TypeScript 語法
const input = document.querySelector('#myInput') as HTMLInputElement;
input.value = 'test';

// ✅ 正確 - 純 JavaScript
const input = document.querySelector('#myInput');
if (input) {
  input.value = 'test';
}
```

### 案例 2：類型檢查

```typescript
// ❌ 錯誤 - TypeScript 語法
if (typeof data === 'string' as string) { ... }

// ✅ 正確 - 純 JavaScript
if (typeof data === 'string') { ... }
```

### 案例 3：數組操作

```typescript
// ❌ 錯誤 - TypeScript 語法
const strings = (array as string[]).filter(s => s.length > 0);

// ✅ 正確 - 純 JavaScript
const strings = array.filter(item => typeof item === 'string' && item.length > 0);
```

## 🛠️ 最佳實踐

### 1. 模板字面量轉義

```typescript
// 在 TypeScript 文件中，模板字面量需要正確轉義
const html = `
  <script>
    const message = ${JSON.stringify(data)};
    console.log(message);
  </script>
`;
```

### 2. 事件處理器

```typescript
// ✅ 正確的事件處理器定義
const handlers = `
  function handleClick(event) {
    // 使用原生 JavaScript
    const target = event.target;
    if (target && target.tagName === 'BUTTON') {
      target.disabled = true;
    }
  }
`;
```

### 3. 錯誤處理

```javascript
// ✅ 正確的錯誤處理
try {
  const result = JSON.parse(data);
  console.log('Success:', result);
} catch (error) {
  console.error('Parse error:', error.message);
  // 使用 error.message 而不是 TypeScript 的 error handling
}
```

## 🔍 除錯技巧

### 1. 檢查語法錯誤

如果選項卡或功能突然失效，檢查瀏覽器控制台是否有：
- `Uncaught SyntaxError: Unexpected identifier`
- `Uncaught ReferenceError: switchTab is not defined`
- `Unexpected token 'as'`

### 2. 分離測試

```typescript
// 將複雜邏輯分離到 TypeScript 函數
function generateWebviewScript(): string {
  const data = prepareData(); // TypeScript 處理
  
  return `
    // 純 JavaScript 部分
    const config = ${JSON.stringify(data)};
    function init() {
      console.log(config);
    }
    window.init = init;
  `;
}
```

### 3. 驗證 JSON

```typescript
// 確保 JSON 字符串安全
function safeJSONStringify(obj: any): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}
```

## 📋 檢查清單

在提交 WebView 代碼前，檢查：

- [ ] 沒有使用 `as` 關鍵字
- [ ] 沒有類型註解 (`: string`, `: number` 等)
- [ ] 沒有泛型語法 (`<T>`)
- [ ] 沒有接口或類型定義
- [ ] 沒有枚舉使用
- [ ] 所有模板字面量正確轉義
- [ ] JSON 字符串安全處理
- [ ] 在瀏覽器控制台測試過

## 🚨 常見錯誤症狀

如果出現以下情況，很可能是 TypeScript 語法問題：

1. **選項卡無響應** - `switchTab is not defined`
2. **按鈕點擊無效** - 事件處理器未正確定義
3. **數據未顯示** - 變數賦值失敗
4. **整個功能失效** - 腳本執行中斷

## 💡 記住這個規則

> **任何在 `<script>` 標籤內的代碼都必須是 100% 的純 JavaScript，瀏覽器不認識 TypeScript 語法！**

這是最常見且最難發現的錯誤來源，因為 TypeScript 編譯器不會檢查模板字面量內的代碼。
