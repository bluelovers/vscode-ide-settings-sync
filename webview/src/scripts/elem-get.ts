
/**
 * Webview 元素選擇器列舉（單一事實來源）
 * Webview element selector enum (Single Source of Truth)
 *
 * 所有 DOM ID 選擇器應統一定義於此，避免各處硬編碼造成的維護困難。
 * All DOM ID selectors should be defined here to avoid maintenance issues from hardcoded strings.
 */
export const enum EnumWebviewElemId
{
	/** 搜尋結果容器 / Search results container */
	searchResults = 'searchResults',
	/** 所有設定列表 / All settings list */
	allSettings = 'allSettings',
	/** 已選設定列表 / Selected settings list */
	selectedSettingsList = 'selectedSettingsList',
	/** 搜尋輸入框 / Search input field */
	searchInput = 'searchInput',
	/** 訊息顯示容器 / Message display container */
	message = 'message',
	/** 匯出自訂路徑輸入框 / Export custom path input */
	exportCustomPath = 'exportCustomPath',
	/** 匯出包含已知 IDE 勾選框 / Export include known IDEs checkbox */
	exportIncludeKnownIDEs = 'exportIncludeKnownIDEs',
	/** 匯出已選設定路徑輸入框 / Export selected settings path input */
	exportSelectedPath = 'exportSelectedPath',
	/** 匯出全部包含已知 IDE 勾選框 / Export all include known IDEs checkbox */
	exportAllIncludeKnownIDEs = 'exportAllIncludeKnownIDEs',
	/** 匯出全部路徑輸入框 / Export all path input */
	exportAllPath = 'exportAllPath',
	/** 匯入路徑輸入框 / Import path input */
	importPath = 'importPath',
	/** 主語言選擇下拉選單 / Primary language select dropdown */
	primaryLang = 'primaryLang',
}

/**
 * 將 EnumWebviewElemId 轉換為 CSS ID 選擇器字串（帶 # 前綴）
 * Convert EnumWebviewElemId to CSS ID selector string (with # prefix)
 * @param id - 元素 ID 列舉值 / Element ID enum value
 * @returns CSS ID 選擇器字串 / CSS ID selector string
 */
export function getElemIdSelector(id: EnumWebviewElemId): string
{
	return `#${id}`;
}

/**
 * CSS 類別選擇器列舉（單一事實來源）
 * CSS class selector enum (Single Source of Truth)
 *
 * 所有 CSS 類別選擇器應統一定義於此，避免各處硬編碼。
 * All CSS class selectors should be defined here to avoid hardcoded strings.
 */
export const enum EnumCssClassSelector
{
	/** 來源 IDE 指示器容器 / Source IDE indicator container */
	sourceIdeIndicator = 'source-ide-indicator',
	/** 分頁導航容器 / Tab navigation container */
	tabs = 'tabs',
	/** IDE 項目元素 / IDE item element */
	ideItem = 'ide-item',
	/** IDE 勾選框 / IDE checkbox */
	ideCheckbox = 'ide-checkbox',
	/** IDE 來源單選按鈕 / IDE source radio button */
	ideSourceRadio = 'ide-source-radio',
}

/**
 * 將 EnumCssClassSelector 轉換為 CSS 類別選擇器字串（帶 . 前綴）
 * Convert EnumCssClassSelector to CSS class selector string (with . prefix)
 * @param className - CSS 類別列舉值 / CSS class enum value
 * @returns CSS 類別選擇器字串 / CSS class selector string
 */
export function getClassSelector(className: EnumCssClassSelector): string
{
	return `.${className}`;
}

/**
 * 網頁元素 ID 選擇器列舉（保留舊版相容）
 * Webview element selector enum (Legacy compatibility)
 *
 * @deprecated 請使用 EnumWebviewElemId 與 getElemIdSelector()
 */
export const enum EnumWebviewElemSelector
{
	'searchResults' = '#searchResults',
}

/**
 * 透過 EnumWebviewElemId 查詢單一元素
 * Query single element by EnumWebviewElemId
 * @param id - 元素 ID 列舉值 / Element ID enum value
 * @returns 查詢到的元素或 null / Queried element or null
 */
export function queryWebviewElemById<T extends HTMLElement>(id: EnumWebviewElemId): T | null
{
	return document.getElementById(id) as T | null;
}

/**
 * 透過 EnumCssClassSelector 查詢單一元素
 * Query single element by EnumCssClassSelector
 * @param classSelector - CSS 類別列舉值 / CSS class enum value
 * @returns 查詢到的元素或 null / Queried element or null
 */
export function queryWebviewElemByClass<T extends HTMLElement>(classSelector: EnumCssClassSelector): T | null
{
	return document.querySelector<T>(getClassSelector(classSelector));
}

/**
 * 透過 EnumCssClassSelector 查詢所有匹配元素
 * Query all elements by EnumCssClassSelector
 * @param classSelector - CSS 類別列舉值 / CSS class enum value
 * @returns 查詢到的元素列表 / Queried elements NodeList
 */
export function queryWebviewElemAllByClass<T extends HTMLElement>(classSelector: EnumCssClassSelector): NodeListOf<T>
{
	return document.querySelectorAll<T>(getClassSelector(classSelector));
}

/**
 * 保留舊版函式（相容性）
 * Legacy function (backward compatibility)
 *
 * @deprecated 請使用 queryWebviewElemById 或 queryWebviewElemByClass
 */
export function queryWebviewElem<T extends HTMLElement>(selector: EnumWebviewElemSelector): T | null
{
	return document.querySelector<T>(selector);
}

/**
 * 保留舊版函式（相容性）
 * Legacy function (backward compatibility)
 *
 * @deprecated 請使用 queryWebviewElemAllByClass
 */
export function queryWebviewElemAll<T extends HTMLElement>(selector: EnumWebviewElemSelector): NodeListOf<T>
{
	return document.querySelectorAll<T>(selector);
}
