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

## � JSX 轉換為字串的特別注意事項

### ⚠️ 關鍵問題：事件處理器失效

當使用 `renderJsxToString` 或類似方法將 JSX 轉換為 HTML 字串時，**所有 JSX 事件處理器都會失效**：

```typescript
// ❌ JSX 事件處理器（轉換後會失效）
<button onClick={handleClick}>Click me</button>
<button onChange={(e) => setValue(e.target.value)}>Input</button>

// ❌ 轉換後的結果（事件處理器丟失）
<button>Click me</button>
<button>Input</button>
```

### ✅ 正確的解決方案：非標準 JSX 寫法

使用純 HTML/JS 方式，將事件處理器作為字串屬性：

```typescript
// ✅ 正確 - 使用 onclick 字串屬性
{/* @ts-ignore */}
<button onclick="handleClick()">Click me</button>

// ✅ 正確 - 使用 onchange 字串屬性
{/* @ts-ignore */}
<input onchange="handleInputChange(this.value)" />

// ✅ 正確 - 使用 onclick 與模板字面量
{/* @ts-ignore */}
<button onclick={`removeItem(${index}, ${JSON.stringify(name)})`}>Remove</button>
```

### 📝 完整的組件實作範例

#### 錯誤的方式（事件處理器會失效）

```typescript
function BadComponent() {
  const [value, setValue] = useState('');
  
  return (
    <div>
      <input 
        value={value} 
        onChange={(e) => setValue(e.target.value)} 
      />
      <button onClick={() => console.log(value)}>
        Submit
      </button>
    </div>
  );
}
```

#### 正確的方式（使用純 HTML/JS）

```typescript
function GoodComponent() {
  return (
    <>
      <ScriptHandler />
      <div>
        <input 
          id="myInput"
          placeholder="Enter value"
        />
        <button 
          // @ts-ignore
          onclick="handleSubmit()"
        >
          Submit
        </button>
      </div>
    </>
  );
}

function ScriptHandler() {
  const js = `
    function handleSubmit() {
      const input = document.getElementById('myInput');
      if (input) {
        console.log('Value:', input.value);
        vscode.postMessage({ 
          command: 'submit', 
          value: input.value 
        });
      }
    }
  `;
  
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
```

### 🎨 組件模式推薦

#### 模式 1：分離式組件 + Script 標籤

```typescript
// 組件結構
export function MyComponent() {
  return (
    <>
      <MyComponentScript />
      <div class="my-component">
        <PathInput id="path1" placeholder="Enter path" />
        <ActionButton onclick="handleAction()" text="Action" />
      </div>
    </>
  );
}

// 腳本處理
function MyComponentScript() {
  const js = `
    function handleAction() {
      const path = document.getElementById('path1').value;
      vscode.postMessage({ command: 'action', path });
    }
  `;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
```

#### 模式 2：可重用子組件

```typescript
// 可重用的輸入組件
function PathInput({ id, placeholder }: { id: string; placeholder: string }) {
  return (
    <div class="path-input-group">
      <input id={id} class="path-input" placeholder={placeholder} />
      {/* @ts-ignore */}
      <button class="btn" onclick="browsePath()">
        📁 Browse
      </button>
    </div>
  );
}

// 可重用的按鈕組件
function ActionButton({ onclick, children, disabled }: { 
  onclick: string; 
  children: any; 
  disabled?: boolean; 
}) {
  return (
    // @ts-ignore
    <button class="btn" onclick={onclick} disabled={disabled}>
      {children}
    </button>
  );
}
```

### 🔧 TypeScript 集成技巧

#### 1. 使用 `@ts-ignore` 忽略屬性錯誤

```typescript
// JSX 中的 HTML 屬性需要 @ts-ignore
{/* @ts-ignore */}
<button onclick="handleClick()">Click</button>

// 或者整個組件忽略
{/* @ts-ignore */}
<div onclick="handleDivClick()">
  Content
</div>
```

#### 2. 類型安全的數據傳遞

```typescript
// 在 TypeScript 中準備數據
function prepareComponentData() {
  const data = {
    items: ['item1', 'item2'],
    config: { enabled: true }
  };
  
  return JSON.stringify(data);
}

// 在組件中使用
function MyComponent() {
  const dataStr = prepareComponentData();
  
  return (
    <>
      <script>
        {`
          const config = ${dataStr};
          console.log(config.items);
        `}
      </script>
    </>
  );
}
```

#### 3. 消息處理模式

```typescript
// 組件定義消息處理器
function ComponentScript() {
  const js = `
    // 處理來自 extension 的回應
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.command) {
        case 'pathSelected':
          document.getElementById('pathInput').value = message.path;
          break;
        case 'actionComplete':
          console.log('Action completed:', message.success);
          break;
      }
    });
    
    // 發送消息到 extension
    function handleAction() {
      const value = document.getElementById('pathInput').value;
      vscode.postMessage({ 
        command: 'performAction', 
        value: value 
      });
    }
  `;
  
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
```

### ⚡ 效能考量

#### 1. 避免過度轉換

```typescript
// ❌ 錯誤 - 每次渲染都重新生成腳本
function BadComponent({ data }) {
  return (
    <script>
      {`const config = ${JSON.stringify(data)};`}
    </script>
  );
}

// ✅ 正確 - 使用 useMemo 或緩存
function GoodComponent({ data }) {
  const scriptContent = useMemo(() => {
    return `const config = ${JSON.stringify(data)};`;
  }, [data]);
  
  return <script>{scriptContent}</script>;
}
```

#### 2. 腳本執行順序

```typescript
// ✅ 確保 DOM 元素存在後再執行腳本
function ComponentWithScript() {
  return (
    <>
      <div id="target">Content</div>
      <script>
        {`
          // 等待 DOM 準備就緒
          document.addEventListener('DOMContentLoaded', () => {
            const element = document.getElementById('target');
            if (element) {
              element.textContent = 'Updated content';
            }
          });
        `}
      </script>
    </>
  );
}
```

## �🛠️ 最佳實踐

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

### JSX 轉換專項檢查

在提交包含 JSX 轉換的 WebView 代碼前，檢查：

- [ ] **事件處理器使用字串形式** (`onclick="handler()"` 而不是 `onClick={handler}`)
- [ ] **添加必要的 `@ts-ignore` 註解**
- [ ] **腳本在 `<script>` 標籤內，不是內聯**
- [ ] **DOM 元素 ID 唯一且存在**
- [ ] **消息處理器正確定義**
- [ ] **數據通過 JSON.stringify 安全傳遞**
- [ ] **測試過所有按鈕和互動功能**

### 一般 WebView 檢查

- [ ] 沒有使用 `as` 關鍵字
- [ ] 沒有類型註解 (`: string`, `: number` 等)
- [ ] 沒有泛型語法 (`<T>`)
- [ ] 沒有接口或類型定義
- [ ] 沒有枚舉使用
- [ ] 所有模板字面量正確轉義
- [ ] JSON 字符串安全處理
- [ ] 在瀏覽器控制台測試過

## 🚨 常見錯誤症狀

### JSX 轉換相關錯誤

如果出現以下情況，很可能是 JSX 轉換問題：

1. **按鈕點擊無效** - 事件處理器未正確定義為字串
2. **輸入框無響應** - onChange 事件處理器失效
3. **數據未傳遞** - 消息發送失敗
4. **組件渲染但無互動** - 所有事件處理器都失效

### TypeScript 語法相關錯誤

如果出現以下情況，很可能是 TypeScript 語法問題：

1. **選項卡無響應** - `switchTab is not defined`
2. **按鈕點擊無效** - 事件處理器未正確定義
3. **數據未顯示** - 變數賦值失敗
4. **整個功能失效** - 腳本執行中斷

## 💡 記住這個規則

> **任何在 `<script>` 標籤內的代碼都必須是 100% 的純 JavaScript，瀏覽器不認識 TypeScript 語法！**

> **JSX 事件處理器在轉換為字串時會失效，必須使用字串形式的 HTML 事件屬性！**

這是最常見且最難發現的錯誤來源，因為 TypeScript 編譯器不會檢查模板字面量內的代碼，而 JSX 轉換工具會自動移除事件處理器。

## 🎯 推薦的開發模式

1. **設計階段**：先規劃好需要哪些事件處理器
2. **組件開發**：使用非標準 JSX 寫法（字串事件屬性）
3. **腳本開發**：在 `<script>` 標籤內實現純 JavaScript 函數
4. **測試階段**：在瀏覽器控制台測試所有互動功能
5. **整合階段**：確保消息傳遞和狀態管理正常工作
