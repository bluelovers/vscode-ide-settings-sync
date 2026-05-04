/** 從上層類型定義導入 IDE 資訊介面 / Import IDE information interface from parent types */
import { IIDEInfo } from '../types';
/** 導入 IDE 設定提供者類別，用於載入設定資料 / Import IDE setting provider class for loading settings data */
import { IdeSettingProvider } from '../providers/ideSettingProvider';
/** 導入移除自訂 IDE 參數介面 / Import interface for remove custom IDE parameters */
import { IRemoveCustomIDEParams } from '../../webview/src/components/types';
/** 導入 Webview 使用的 IDE 資訊介面 / Import IDE information interface for webview consumption */
import { IIDEInfoWebview } from '../../webview/src/types';

/**
 * Transforms IDE list for webview content by loading settings data
 *
 * This function extracts the core logic from IDEProvider.getIDEListToWebviewContent()
 * to make it testable and reusable.
 *
 * @param ideList - Array of IDE information objects
 * @returns Array of IDE objects with settings data loaded for webview consumption
 *
 * @example
 * ```typescript
 * const ideList = ideProvider.getIDEList();
 * const webviewContent = transformIDEListForWebview(ideList);
 * const jsonContent = JSON.stringify(webviewContent);
 * ```
 */
export function transformIDEListForWebview(ideList: IIDEInfo[]): IIDEInfoWebview[]
{
	/**
	 * 解構 IDE 物件，分離設定提供者與其餘屬性
	 * Destructure IDE object to separate setting provider from other properties
	 */
	return ideList.map(ide =>
	{
		let {
			settingProvider,
			...map
		} = ide;

		return {
			...map,
			/**
			 * 載入 IDE 的設定資料並轉換為普通物件
			 * Load IDE settings and convert to plain object
			 */
			settings: ide.settingProvider.load().valueOf(),
		};
	});
}

/**
 * 驗證轉換後的 IDE 列表是否安全的用於 JSON 序列化與 Preact JSX 渲染
 * Validate that the transformed IDE list is safe for JSON serialization and Preact JSX rendering
 *
 * 此函數確保 IDE 列表資料符合 Webview 渲染與資料傳輸的要求，避免後續處理發生錯誤。
 * This function ensures IDE list data meets requirements for webview rendering and data transmission, preventing errors in subsequent processing.
 *
 * @param webviewContent - 轉換後的 IDE 列表 / The transformed IDE list
 * @returns 包含驗證結果的物件（是否有效、錯誤清單、警告清單）/ Object containing validation results (isValid, errors, warnings)
 */
export function validateWebviewContent(webviewContent: any[]): {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}
{
	const errors: string[] = [];
	const warnings: string[] = [];

	/**
	 * 檢查輸入是否為陣列，確保後續處理的正確性
	 * Check if input is an array to ensure correct subsequent processing
	 */
	if (!Array.isArray(webviewContent))
	{
		errors.push('Content must be an array');
		return { isValid: false, errors, warnings };
	}

	/**
	 * 遍歷每個 IDE 物件進行驗證，確保每個元素都是有效物件
	 * Iterate through each IDE object for validation, ensuring each element is a valid object
	 */
	webviewContent.forEach((ide, index) =>
	{
		if (typeof ide !== 'object' || ide === null)
		{
			errors.push(`IDE at index ${index} must be an object`);
			return;
		}

		/**
		 * 定義必要欄位清單，用於驗證 IDE 物件是否包含所有需要的屬性以確保資料完整性
		 * Define required fields list to validate IDE object contains all necessary properties for data integrity
		 */
		const requiredFields = ['name', 'type', 'available', 'nativePath', 'settings'];
		for (const field of requiredFields)
		{
			if (!(field in ide))
			{
				errors.push(`IDE at index ${index} missing required field: ${field}`);
			}
		}

			/**
		 * 檢查 IDE 的設定物件是否有效，避免後續處理發生錯誤
		 * Check if IDE's settings object is valid to prevent errors in subsequent processing
		 */
		if (ide.settings && typeof ide.settings !== 'object')
		{
			errors.push(`IDE at index ${index} settings must be an object`);
		}

			/**
		 * 檢查設定物件是否包含循環參考，避免 JSON 序列化時發生錯誤
		 * Check for circular references in settings to prevent errors during JSON serialization
		 */
		if (ide.settings)
		{
			try
			{
				JSON.stringify(ide.settings);
			}
			catch (error)
			{
				errors.push(`IDE at index ${index} settings contains circular references or non-serializable data`);
			}
		}

		// Warnings for potentially problematic content
		if (ide.name && typeof ide.name === 'string' && (ide.name.includes('<') || ide.name.includes('>')))
		{
			warnings.push(`IDE at index ${index} name contains HTML characters: ${ide.name}`);
		}
	});

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * 清理 Webview 內容以安全地嵌入 HTML/JSX 中，避免 XSS 或渲染錯誤
 * Sanitize webview content for safe embedding in HTML/JSX to prevent XSS or rendering errors
 *
 * 此函數將特殊字符（如 <, >, &, 單引號）轉換為 Unicode 轉義序列，確保內容在 HTML/JSX 中不會被解析為標籤或腳本
 * This function converts special characters (e.g., <, >, &, single quotes) to Unicode escape sequences,
 * ensuring content is not parsed as tags or scripts in HTML/JSX
 *
 * @param content - 需要清理的內容 / The content to sanitize
 * @returns 安全的字串，可直接用於 HTML/JSX 嵌入 / Sanitized string safe for HTML/JSX embedding
 */
export function sanitizeForWebview(content: any): string
{
	/**
	 * 將輸入內容序列化為 JSON 字串，統一資料格式並處理複雜類型（如物件、陣列）
	 * Serialize input content to JSON string to unify data format and handle complex types (objects, arrays)
	 */
	const jsonString = JSON.stringify(content);
	return jsonString
		/**
		 * 轉義小於符號，避免被解析為 HTML 標籤開頭
		 * Escape < to prevent HTML tag parsing
		 */
		.replace(/</g, '\\u003c')
		/**
		 * 轉義大於符號，避免被解析為 HTML 標籤結尾
		 * Escape > to prevent HTML tag parsing
		 */
		.replace(/>/g, '\\u003e')
		/**
		 * 轉義 & 符號，避免被解析為 HTML 實體
		 * Escape & to prevent HTML entity parsing
		 */
		.replace(/&/g, '\\u0026')
		/**
		 * 轉義單引號，避免 JSX/HTML 屬性解析錯誤，使用 Unicode 轉義更安全
		 * Escape single quotes to prevent JSX/HTML attribute parsing errors; Unicode escape is safer
		 */
		.replace(/'/g, '\\u0027');
}

/**
 * 將 IDE 資訊轉換為移除參數物件
 * Convert IDE info to remove parameters object
 *
 * 此函數用於將 IDE 物件與索引轉換為移除自訂 IDE 所需的參數物件。
 * This function converts an IDE object with index to the parameters object needed for removing a custom IDE.
 *
 * @param ide - IDE 資訊物件 / IDE info object
 * @param index - IDE 在列表中的索引 / IDE index in the list
 * @returns 移除參數物件 / Remove parameters object
 *
 * @example
 * ```typescript
 * const ideList = ideProvider.getIDEList();
 * const params = ideList.map((ide, index) => toRemoveCustomIDEParams(ide, index));
 * ```
 */
export function toRemoveCustomIDEParams(ide: IIDEInfo, index: number): IRemoveCustomIDEParams
{
	return {
		index,
		uuid: ide.uuid,
		name: ide.name,
		nativePath: ide.nativePath,
	};
}
