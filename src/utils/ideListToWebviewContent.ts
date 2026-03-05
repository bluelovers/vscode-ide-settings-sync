import { IIDEInfo } from '../types';
import { IdeSettingProvider } from '../providers/ideSettingProvider';

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
export function transformIDEListForWebview(ideList: IIDEInfo[]): (Omit<IIDEInfo, 'settingProvider'> & {
	settings: Record<string, any>;
})[]
{
	return ideList.map(ide =>
	{

		let {
			settingProvider,
			...map
		} = ide;

		return {
			...map,
			settings: ide.settingProvider.load().valueOf(),
		};
	});
}

/**
 * Validates that the transformed IDE list is safe for JSON serialization
 * and Preact JSX rendering
 *
 * @param webviewContent - The transformed IDE list
 * @returns Object containing validation results
 */
export function validateWebviewContent(webviewContent: any[]): {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}
{
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check if it's an array
	if (!Array.isArray(webviewContent))
	{
		errors.push('Content must be an array');
		return { isValid: false, errors, warnings };
	}

	// Check each IDE object
	webviewContent.forEach((ide, index) =>
	{
		if (typeof ide !== 'object' || ide === null)
		{
			errors.push(`IDE at index ${index} must be an object`);
			return;
		}

		// Required fields
		const requiredFields = ['name', 'type', 'available', 'nativePath', 'settings'];
		for (const field of requiredFields)
		{
			if (!(field in ide))
			{
				errors.push(`IDE at index ${index} missing required field: ${field}`);
			}
		}

		// Check settings object
		if (ide.settings && typeof ide.settings !== 'object')
		{
			errors.push(`IDE at index ${index} settings must be an object`);
		}

		// Check for circular references in settings
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
 * Sanitizes webview content for safe embedding in HTML/JSX
 *
 * @param content - The content to sanitize
 * @returns Sanitized content safe for HTML/JSX embedding
 */
export function sanitizeForWebview(content: any): string
{
	const jsonString = JSON.stringify(content);
	return jsonString
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/'/g, '\\u0027'); // Use unicode for single quotes
}
