/**
 * Settings descriptions mapping with multi-language support
 * Maps VS Code setting keys to descriptions in multiple languages
 * With fallback mechanism
 */

import { EnumLanguageCode } from '../types';

/**
 * 英文設定描述
 * English Setting Descriptions
 */
const enDescriptions: Record<string, string> = {
	/** ==================== Editor Settings ==================== */

	'editor.fontFamily': 'The font family to use in the editor',
	'editor.fontSize': 'The font size in pixels',
	'editor.fontWeight': 'The font weight to use in the editor (normal, bold, or number 100-900)',
	'editor.lineHeight': 'The line height to use in the editor',
	'editor.lineNumbers': 'Render line numbers in the editor (on, off, or relative)',
	'editor.rulers': 'Columns at which to show a vertical line',
	'editor.wordWrap': 'Controls how lines should be wrapped',
	'editor.wordWrapColumn': 'Controls the wrapping column in the editor',
	'editor.tabSize': 'The number of spaces a tab represents',
	'editor.insertSpaces': 'Insert spaces instead of tabs',
	'editor.useTabStops': 'Use tab stops for indentation',
	'editor.detectIndentation': 'Detect indentation automatically',
	'editor.trimAutoWhitespace': 'Remove trailing whitespace when saving',
	'editor.theme': 'The color theme for the editor',
	'editor.autoSave': 'Enable auto save (off, afterDelay, onFocusChange, onWindowChange)',
	'editor.autoSaveDelay': 'Delay in milliseconds after which the auto save is triggered',
	'editor.formatOnSave': 'Format document on save',
	'editor.formatOnPaste': 'Format document on paste',
	'editor.defaultFormatter': 'The default code formatter',
	'editor.codeActionsOnSave': 'Code actions to execute on save',
	'editor.codeLens': 'Enable/disable code lenses',
	'editor.minimap.enabled': 'Enable minimap',
	'editor.minimap.size': 'Minimap size (proportional or fill)',
	'editor.minimap.side': 'Minimap side placement (left or right)',
	'editor.smoothScrolling': 'Enable smooth scrolling',
	'editor.cursorStyle': 'Cursor style (block, block-outline, line, line-thin, underline, underline-thin)',
	'editor.cursorBlinking': 'Cursor blinking animation (blink, smooth, phase, expand, solid)',
	'editor.highlightActiveIndentGuide': 'Highlight the active indent guide',
	'editor.renderIndentGuides': 'Render indent guides',
	'editor.renderControlCharacters': 'Render control characters in the editor',
	'editor.renderWhitespace': 'Render whitespace in the editor (none, boundary, selection, all)',
	'editor.matchBrackets': 'Highlight matching brackets',
	'editor.mouseStyle': 'When the cursor is moved manually, it shows the cursor style (text or default)',
	'editor.selectionClipboard': 'Enable selection clipboard',
	'editor.selectionHighlight': 'Enable highlight of matches from Find widget',

	/** ==================== Files Settings ==================== */

	'files.autoSave': 'Enable auto save (off, afterDelay, onFocusChange, onWindowChange)',
	'files.autoSaveDelay': 'Delay in milliseconds after which the auto save is triggered',
	'files.exclude': 'Configure glob patterns for excluding files/folders from workspace',
	'files.encoding': 'The default character encoding for files',
	'files.trimTrailingWhitespace': 'Remove trailing whitespace when saving',
	'files.trimFinalNewlines': 'Remove trailing newlines when saving',
	'files.insertFinalNewline': 'Insert a final newline when saving',
	'files.eol': 'The default line ending (LF or CRLF)',
	'files.maxMemoryForLargeFilesMB': 'Maximum memory for large files (MB)',
	'files.hotExit': 'Restore windows/editors without reading their contents',

	/** ==================== Search Settings ==================== */

	'search.exclude': 'Configure glob patterns for excluding files/folders from search',
	'search.location': 'Search panel location (sideBar or panel)',
	'search.followSymlinks': 'Follow symbolic links when searching',

	/** ==================== Extensions Settings ==================== */
	
	'extensions.showRecommendationsOnInstall': 'Show recommended extensions when installing',
	'extensions.autoCheckUpdates': 'Check for extension updates automatically',
	'extensions.autoUpdate': 'Update extensions automatically',

	// Terminal Settings
	'terminal.integrated.fontSize': 'The font size for the terminal',
	'terminal.integrated.fontFamily': 'The font family for the terminal',
	'terminal.integrated.fontWeight': 'The font weight for the terminal',
	'terminal.integrated.copyOnSelection': 'Copy selected text to clipboard on selection',
	'terminal.integrated.scrollback': 'The number of lines to keep in the terminal buffer',

	// Workbench Settings
	'workbench.sideBar.location': 'Side bar location (left or right)',
	'workbench.statusBar.visible': 'Visibility of the status bar',
	'workbench.activityBar.visible': 'Visibility of the activity bar',
	'workbench.colorTheme': 'The color theme to use',
	'workbench.iconTheme': 'The icon theme to use',
	'workbench.fontAliasing': 'Font aliasing method (none, antialiased, subpixel-antialiased)',
	'workbench.useExperimentalGridLayout': 'Use the new grid layout for windows',
	'workbench.editorAssociations': 'Associate editor with file type',
	'workbench.editor.tabSizing': 'Tab sizing (fixed or shrink)',
	'workbench.editor.showTabs': 'Show editor tabs',
	'workbench.editor.enablePreview': 'Enable preview editors',
	'workbench.editor.enablePreviewFromQuickOpen': 'Enable preview when opening from quick open',
	'workbench.editor.revealIfOpen': 'Show opened editors when opening a file',
	'workbench.editor.labelFormat': 'Format for editor labels (short, medium, long)',
	'workbench.editor.decorations.badges': 'Show number of problems on editor tabs',
	'workbench.editor.decorations.colors': 'Show colors on editor tab background',
	'workbench.experimental.layoutControl.enabled': 'Enable layout control',

	// Git Settings
	'git.enabled': 'Is GIT enabled',
	'git.path': 'Path to the git executable',
	'git.autoRepository': 'Automatically open Git repositories',
	'git.autorefresh': 'Auto refresh GIT status',
	'git.alwaysSignOff': 'Always sign off commits',
	'git.confirmSync': 'Confirm before syncing repositories',

	// Debug Settings
	'debug.console.fontSize': 'Font size for the debug console',
	'debug.console.fontFamily': 'Font family for the debug console',
	'debug.onTaskErrors': 'How to behave when task errors occur',
	'debug.showBreakpointsInOverviewRuler': 'Show breakpoints in the overview ruler',

	// Telemetry Settings
	'telemetry.telemetryLevel': 'Telemetry level (off, crash, error, all)',

	// Window Settings
	'window.title': 'The window title',
	'window.zoomLevel': 'Adjust the zoom level',
	'window.newWindowProfile': 'The profile to use when creating a new window',
	'window.restoreWindows': 'Restore the windows and tabs from the last session',
	'window.menuBarVisibility': 'Menu bar visibility (default, visible, hidden, toggle)',
	'window.enableMenuBarMnemonics': 'Enable menu bar mnemonics',
	'window.clickThroughInactive': 'If enabled, clicking on the window title bar will pass through',

	// Keyboard Settings
	'keyboard.dispatch': 'Keyboard dispatch method (code, keyCode)',

	// Update Settings
	'update.mode': 'Update mode (none, manual, start, default)',
	'update.showReleaseNotes': 'Show release notes after update',

	// Security Settings
	'security.workspace.trust.enabled': 'Enable workspace trust',
	'security.workspace.trust.banner': 'Control the display of the workspace trust banner',

	// Markdown Preview Settings
	'markdown.preview.fontSize': 'Font size for markdown preview',
	'markdown.preview.fontFamily': 'Font family for markdown preview',
	'markdown.preview.scrollPreviewWithEditor': 'Scroll preview with editor',
	'markdown.preview.scrollEditorWithPreview': 'Scroll editor with preview',
	'markdown.preview.breaks': 'Enable breaks in markdown preview',
	'markdown.preview.linkify': 'Enable linkify in markdown preview',
	'markdown.preview.typographer': 'Enable typographer in markdown preview',

	// REST Client Settings
	'rest-client.defaultHeaders': 'Default headers for REST requests',
	'rest-client.previewOption': 'Preview option for REST responses',
	'rest-client.excludeHostsForProxy': 'Exclude hosts from proxy',
	'rest-client.timeoutinmilliseconds': 'Timeout in milliseconds',
	'rest-client.showResponseInDifferentTab': 'Show response in different tab',
	'rest-client.certificates': 'Certificates for SSL',
	'rest-client.environmentVariables': 'Environment variables',
};

/** 繁體中文設定描述 / Traditional Chinese setting descriptions */
const zhTwDescriptions: Record<string, string> = {
	'editor.fontFamily': '編輯器中要使用的字體系列',
	'editor.fontSize': '以像素為單位的字體大小',
	'editor.fontWeight': '編輯器中要使用的字體粗細',
	'editor.lineHeight': '編輯器中的行高',
	'editor.lineNumbers': '在編輯器中呈現行號',
	'editor.rulers': '要顯示垂直線的列',
	'editor.wordWrap': '控制行應如何換行',
	'editor.wordWrapColumn': '控制編輯器中的換行列',
	'editor.tabSize': '一個制表符代表的空格數',
	'editor.insertSpaces': '插入空格而不是制表符',
	'editor.useTabStops': '用制表符停止位進行縮進',
	'editor.detectIndentation': '自動檢測縮進',
	'editor.trimAutoWhitespace': '儲存時移除尾隨空白符',
	'editor.theme': '編輯器的色彩佈景主題',
	'editor.autoSave': '啟用自動儲存',
	'editor.autoSaveDelay': '自動儲存觸發的延遲時間',
	'editor.formatOnSave': '儲存時格式化文件',
	'editor.formatOnPaste': '貼上時格式化文件',
	'editor.defaultFormatter': '預設程式碼格式化工具',
	'editor.codeActionsOnSave': '儲存時執行的程式碼操作',
	'editor.codeLens': '啟用/停用程式碼透鏡',
	'editor.minimap.enabled': '啟用小地圖',
	'editor.minimap.size': '小地圖大小',
	'editor.minimap.side': '小地圖側邊放置',
	'editor.smoothScrolling': '啟用平滑捲動',
	'editor.cursorStyle': '游標樣式',
	'editor.cursorBlinking': '游標閃爍動畫',
	'editor.highlightActiveIndentGuide': '突出顯示活動縮進參考線',
	'editor.renderIndentGuides': '呈現縮進參考線',
	'editor.renderControlCharacters': '在編輯器中呈現控制字元',
	'editor.renderWhitespace': '在編輯器中呈現空白符',
	'editor.matchBrackets': '突出顯示相符的括號',
	'editor.mouseStyle': '游標樣式',
	'editor.selectionClipboard': '啟用選取範圍剪貼簿',
	'editor.selectionHighlight': '突出顯示尋找視窗相符項目',

	'files.autoSave': '啟用自動儲存',
	'files.autoSaveDelay': '自動儲存觸發的延遲時間',
	'files.exclude': '設定排除檔案/資料夾的萬用字元模式',
	'files.encoding': '檔案的預設字元編碼',
	'files.trimTrailingWhitespace': '儲存時移除尾隨空白符',
	'files.trimFinalNewlines': '儲存時移除尾隨換行符',
	'files.insertFinalNewline': '儲存時插入最終換行符',
	'files.eol': '預設行尾字元',
	'files.maxMemoryForLargeFilesMB': '大型檔案的最大記憶體',
	'files.hotExit': '不讀取內容即還原',

	'search.exclude': '設定排除檔案/資料夾的萬用字元模式',
	'search.location': '搜尋面板位置',
	'search.followSymlinks': '搜尋時遵循符號連結',

	'extensions.showRecommendationsOnInstall': '安裝時顯示建議的延伸模組',
	'extensions.autoCheckUpdates': '自動檢查延伸模組更新',
	'extensions.autoUpdate': '自動更新延伸模組',

	'terminal.integrated.fontSize': '終端機的字體大小',
	'terminal.integrated.fontFamily': '終端機的字體系列',
	'terminal.integrated.fontWeight': '終端機的字體粗細',
	'terminal.integrated.copyOnSelection': '選取時複製文字',
	'terminal.integrated.scrollback': '終端機緩衝區的行數',

	'workbench.sideBar.location': '側邊欄位置',
	'workbench.statusBar.visible': '狀態列的可見性',
	'workbench.activityBar.visible': '活動列的可見性',
	'workbench.colorTheme': '色彩佈景主題',
	'workbench.iconTheme': '圖示主題',
	'workbench.fontAliasing': '字體平滑化方法',
	'workbench.useExperimentalGridLayout': '為視窗使用新的網格配置',
	'workbench.editorAssociations': '將編輯器與檔案類型相關聯',
	'workbench.editor.tabSizing': '標籤大小',
	'workbench.editor.showTabs': '顯示編輯器標籤',
	'workbench.editor.enablePreview': '啟用預覽編輯器',
	'workbench.editor.enablePreviewFromQuickOpen': '從快速開啟時啟用預覽',
	'workbench.editor.revealIfOpen': '已開啟編輯器時顯示',
	'workbench.editor.labelFormat': '編輯器標籤格式',
	'workbench.editor.decorations.badges': '在編輯器標籤上顯示問題數',
	'workbench.editor.decorations.colors': '在編輯器標籤背景上顯示顏色',
	'workbench.experimental.layoutControl.enabled': '啟用配置控制',

	'git.enabled': '是否啟用GIT',
	'git.path': 'git執行檔的路徑',
	'git.autoRepository': '自動開啟Git存放庫',
	'git.autorefresh': '自動重新整理GIT狀態',
	'git.alwaysSignOff': '始終簽署提交',
	'git.confirmSync': '同步存放庫前確認',

	'debug.console.fontSize': '偵錯主控台的字體大小',
	'debug.console.fontFamily': '偵錯主控台的字體系列',
	'debug.onTaskErrors': '發生工作錯誤時的行為',
	'debug.showBreakpointsInOverviewRuler': '在概觀尺標中顯示中斷點',

	'telemetry.telemetryLevel': '遙測層級',

	'window.title': '視窗標題',
	'window.zoomLevel': '調整縮放等級',
	'window.newWindowProfile': '建立新視窗時要使用的設定檔',
	'window.restoreWindows': '還原先前工作階段中的視窗和標籤',
	'window.menuBarVisibility': '功能表列可見性',
	'window.enableMenuBarMnemonics': '啟用功能表列助憶鍵',
	'window.clickThroughInactive': '點擊視窗標題列時呈現在下',

	'keyboard.dispatch': '鍵盤分派方法',

	'update.mode': '更新模式',
	'update.showReleaseNotes': '更新後顯示版本資訊',

	'security.workspace.trust.enabled': '啟用工作區信任',
	'security.workspace.trust.banner': '控制工作區信任橫幅的顯示',

	'markdown.preview.fontSize': 'Markdown預覽的字體大小',
	'markdown.preview.fontFamily': 'Markdown預覽的字體系列',
	'markdown.preview.scrollPreviewWithEditor': '與編輯器一起捲動預覽',
	'markdown.preview.scrollEditorWithPreview': '與預覽一起捲動編輯器',
	'markdown.preview.breaks': '在Markdown預覽中啟用分隔符',
	'markdown.preview.linkify': '在Markdown預覽中啟用linkify',
	'markdown.preview.typographer': '在Markdown預覽中啟用typographer',

	'rest-client.defaultHeaders': 'REST請求的預設標頭',
	'rest-client.previewOption': 'REST回應的預覽選項',
	'rest-client.excludeHostsForProxy': '從代理伺服器中排除的主機',
	'rest-client.timeoutinmilliseconds': '逾時',
	'rest-client.showResponseInDifferentTab': '在不同標籤中顯示回應',
	'rest-client.certificates': 'SSL憑證',
	'rest-client.environmentVariables': '環境變數',
};

/**
 * 語言映射 — 將各語言代碼對應到其描述表
 * Language mapping — maps language codes to their description tables
 */
const languageDescriptions: Record<EnumLanguageCode, Record<string, string>> = {
	[EnumLanguageCode.en]: enDescriptions,
	[EnumLanguageCode.zhTw]: zhTwDescriptions,
	[EnumLanguageCode.zhCn]: zhTwDescriptions,
	[EnumLanguageCode.ja]: enDescriptions,
	[EnumLanguageCode.de]: enDescriptions,
	[EnumLanguageCode.fr]: enDescriptions,
};

// 語言優先順序
const languageFallbacks: Record<EnumLanguageCode, EnumLanguageCode[]> = {
	[EnumLanguageCode.en]: [EnumLanguageCode.en],
	[EnumLanguageCode.zhTw]: [EnumLanguageCode.zhTw, EnumLanguageCode.zhCn, EnumLanguageCode.en],
	[EnumLanguageCode.zhCn]: [EnumLanguageCode.zhCn, EnumLanguageCode.zhTw, EnumLanguageCode.en],
	[EnumLanguageCode.ja]: [EnumLanguageCode.ja, EnumLanguageCode.en],
	[EnumLanguageCode.de]: [EnumLanguageCode.de, EnumLanguageCode.en],
	[EnumLanguageCode.fr]: [EnumLanguageCode.fr, EnumLanguageCode.en],
};

/**
 * 獲取設定描述（使用系統預設回退順序）
 * @param {string} key - 設定鍵值，例如 `editor.fontSize`
 * @param {EnumLanguageCode} [language='en'] - 首選語言代碼
 * @returns {string} 對應的設定描述，若無則回傳 `'No description available'`
 */
export function getSettingDescription(key: string, language: EnumLanguageCode = EnumLanguageCode.en): string
{
	const fallbacks = languageFallbacks[language] || languageFallbacks[EnumLanguageCode.en];

	for (const lang of fallbacks)
	{
		const descriptions = languageDescriptions[lang];
		const description = descriptions[key];
		if (description)
		{
			return description;
		}
	}

	return 'No description available';
}

/**
 * 獲取設定描述 - 使用自訂 Fallback 清單
 * @param key 設定鍵值
 * @param primaryLanguage 主顯示語言
 * @param fallbackList 自訂 Fallback 語言清單
 * @returns 設定描述
 */
export function getSettingDescriptionWithCustomFallback(
	key: string,
	primaryLanguage: EnumLanguageCode = EnumLanguageCode.en,
	fallbackList: EnumLanguageCode[] = [],
): string
{
	// 建構完整的語言清單：主語言 + 自訂 Fallback + 系統 Fallback
	const languageChain = [primaryLanguage];

	// 添加自訂 Fallback 清單中的語言
	for (const lang of fallbackList)
	{
		if (!languageChain.includes(lang))
		{
			languageChain.push(lang);
		}
	}

	// 添加系統 Fallback
	const systemFallbacks = languageFallbacks[primaryLanguage] || [];
	for (const lang of systemFallbacks)
	{
		if (!languageChain.includes(lang))
		{
			languageChain.push(lang);
		}
	}

	// 依序尋找翻譯
	for (const lang of languageChain)
	{
		const descriptions = languageDescriptions[lang as EnumLanguageCode];
		if (descriptions && descriptions[key])
		{
			return descriptions[key];
		}
	}

	return 'No description available';
}

/**
 * 取得設定的雙語描述 - 主語言 + 副語言
 * @param key 設定鍵值
 * @param primaryLanguage 主語言
 * @param secondaryLanguage 副語言
 * @param primaryFallbacks 主語言的Fallback清單
 * @returns { primary: string, secondary: string } 雙語描述
 */
export function getSettingDescriptionBilingual(
	key: string,
	primaryLanguage: EnumLanguageCode = EnumLanguageCode.en,
	secondaryLanguage?: EnumLanguageCode,
	primaryFallbacks: EnumLanguageCode[] = [],
): { primary: string; secondary?: string }
{
	const primary = getSettingDescriptionWithCustomFallback(key, primaryLanguage, primaryFallbacks);

	let secondary: string | undefined;
	if (secondaryLanguage && secondaryLanguage !== primaryLanguage)
	{
		// 計算副語言的 Fallback 清單
		const secondaryFallbacks = primaryFallbacks.filter(lang => lang !== secondaryLanguage);
		secondary = getSettingDescriptionWithCustomFallback(key, secondaryLanguage, secondaryFallbacks);
	}

	return { primary, secondary };
}

/**
 * 獲取所有預設（英文）設定鍵值列表
 * @returns {string[]} 所有支援的設定鍵字串陣列
 */
export function getAllSettingKeys(): string[]
{
	return Object.keys(enDescriptions);
}

/**
 * 獲取所有支援的語言清單
 * @returns {Array<{ code: EnumLanguageCode; name: string }>} 支援語言及其顯示名稱
 */
export function getSupportedLanguages(): Array<{ code: EnumLanguageCode; name: string }>
{
	return [
		{ code: EnumLanguageCode.en, name: 'English' },
		{ code: EnumLanguageCode.zhTw, name: '繁體中文 (Traditional Chinese)' },
		{ code: EnumLanguageCode.zhCn, name: '簡體中文 (Simplified Chinese)' },
		{ code: EnumLanguageCode.ja, name: '日本語 (Japanese)' },
		{ code: EnumLanguageCode.de, name: 'Deutsch (German)' },
		{ code: EnumLanguageCode.fr, name: 'Français (French)' },
	];
}

/**
 * 驗證語言代碼是否為本套件支援的代碼
 * @param {string} code - 要驗證的語言代碼
 * @returns {code is EnumLanguageCode} 若有效則回傳 true
 */
export function isValidLanguageCode(code: string): code is EnumLanguageCode
{
	const validCodes: string[] = [
		EnumLanguageCode.en,
		EnumLanguageCode.zhTw,
		EnumLanguageCode.zhCn,
		EnumLanguageCode.ja,
		EnumLanguageCode.de,
		EnumLanguageCode.fr,
	];
	return validCodes.includes(code);
}

export function getDefaultFallbackList(language: EnumLanguageCode): EnumLanguageCode[]
{
	return languageFallbacks[language] || [EnumLanguageCode.en];
}

// 向後相容性
export const settingsDescriptionMap = new Map<string, string>(
	Object.entries(enDescriptions),
);
