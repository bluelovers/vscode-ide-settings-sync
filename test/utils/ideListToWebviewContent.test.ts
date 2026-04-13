import {
	transformIDEListForWebview,
	validateWebviewContent,
	sanitizeForWebview,
} from '../../src/utils/ideListToWebviewContent';
import { IIDEInfo, EnumIDEInfoType } from '../../src/types';
import { IdeSettingProvider } from '../../src/providers/ideSettingProvider';

// Mock IdeSettingProvider
jest.mock('../../src/providers/ideSettingProvider');

describe('ideListToWebviewContent', () =>
{
	let mockSettingProvider: jest.Mocked<IdeSettingProvider>;
	let mockIDEList: IIDEInfo[];

	beforeEach(() =>
	{
		// Reset all mocks
		jest.clearAllMocks();

		// Create mock setting provider
		mockSettingProvider = new IdeSettingProvider('test/path', 'test/native') as jest.Mocked<IdeSettingProvider>;

		// Mock the load method to return a mock settings object
		const mockSettings = {
			valueOf: jest.fn().mockReturnValue({
				'editor.fontFamily': 'Consolas, monospace',
				'editor.fontSize': 14,
				'editor.tabSize': 4,
				'workbench.colorTheme': 'Dark+ (default dark)',
				'terminal.integrated.shell.windows': 'C:\\Windows\\System32\\cmd.exe',
				'editor.wordWrap': 'on',
				'files.autoSave': 'afterDelay',
				'git.enableSmartCommit': true,
				'editor.rulers': [80, 120],
				'editor.suggestSelection': 'first',
			}),
		};

		// Mock the IdeSettingProvider's load method to return the mock settings
		mockSettingProvider.load = jest.fn().mockReturnValue(mockSettings);

		// Create mock IDE list
		mockIDEList = [
			{
				name: 'Visual Studio Code',
				type: EnumIDEInfoType.known,
				available: true,
				nativePath: 'C:\\Users\\Test\\AppData\\Roaming\\Code\\User',
				settingProvider: mockSettingProvider,
				languageId: 'en',
				i18nPath: 'C:\\Users\\Test\\AppData\\Roaming\\Code\\i18n',
			},
			{
				name: 'Visual Studio Code - Insiders',
				type: EnumIDEInfoType.known,
				available: true,
				nativePath: 'C:\\Users\\Test\\AppData\\Roaming\\Code - Insiders\\User',
				settingProvider: mockSettingProvider,
			},
			{
				name: 'Custom IDE',
				type: EnumIDEInfoType.custom,
				available: true,
				nativePath: 'D:\\CustomIDE\\settings',
				settingProvider: mockSettingProvider,
				languageId: 'zh-tw',
			},
		] as any;
	});

	describe('transformIDEListForWebview', () =>
	{
		it('should transform IDE list correctly', () =>
		{
			// Create a simpler test with direct mock
			const mockIDE: IIDEInfo = {
				name: 'Test IDE',
				type: EnumIDEInfoType.known,
				available: true,
				nativePath: '/test/path',
				settingProvider: {
					load: jest.fn().mockReturnValue({
						valueOf: jest.fn().mockReturnValue({
							'editor.fontFamily': 'Consolas, monospace',
							'editor.fontSize': 14,
						}),
					}),
				},
			} as any;

			const result = transformIDEListForWebview([mockIDE]);

			expect(result).toHaveLength(1);
			expect(result[0]).toHaveProperty('name', 'Test IDE');
			expect(result[0]).toHaveProperty('type', EnumIDEInfoType.known);
			expect(result[0]).toHaveProperty('available', true);
			expect(result[0]).toHaveProperty('settings');

			// Check that settings is an object with the expected properties
			const settings = result[0].settings;
			expect(settings).toEqual(expect.any(Object));

			// Try different assertion approaches
			expect(settings['editor.fontFamily']).toBe('Consolas, monospace');
			expect(settings['editor.fontSize']).toBe(14);

			// Also check with Object.hasOwnProperty
			expect(settings.hasOwnProperty('editor.fontFamily')).toBe(true);
			expect(settings.hasOwnProperty('editor.fontSize')).toBe(true);
		});

		it('should call load() on each IDE setting provider', () =>
		{
			transformIDEListForWebview(mockIDEList);

			expect(mockSettingProvider.load).toHaveBeenCalledTimes(3);
		});

		it('should handle empty IDE list', () =>
		{
			const result = transformIDEListForWebview([]);
			expect(result).toEqual([]);
		});

		it('should preserve all IDE properties and add settings', () =>
		{
			const result = transformIDEListForWebview(mockIDEList);

			// Check first IDE (has all properties)
			const firstIDE = result[0];
			expect(firstIDE).toHaveProperty('name', 'Visual Studio Code');
			expect(firstIDE).toHaveProperty('type', EnumIDEInfoType.known);
			expect(firstIDE).toHaveProperty('available', true);
			expect(firstIDE).toHaveProperty('nativePath');
			expect(firstIDE).toHaveProperty('languageId', 'en');
			expect(firstIDE).toHaveProperty('i18nPath');
			expect(firstIDE).toHaveProperty('settings');

			// Check second IDE (missing optional properties)
			const secondIDE = result[1];
			expect(secondIDE).toHaveProperty('name', 'Visual Studio Code - Insiders');
			expect(secondIDE).toHaveProperty('type', EnumIDEInfoType.known);
			expect(secondIDE).toHaveProperty('available', true);
			expect(secondIDE).toHaveProperty('nativePath');
			expect(secondIDE).toHaveProperty('settings');
			expect(secondIDE).not.toHaveProperty('languageId');
			expect(secondIDE).not.toHaveProperty('i18nPath');
		});
	});

	describe('validateWebviewContent', () =>
	{
		it('should validate correct webview content', () =>
		{
			const content = transformIDEListForWebview(mockIDEList);
			const result = validateWebviewContent(content);

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should detect non-array input', () =>
		{
			const result = validateWebviewContent({} as any);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Content must be an array');
		});

		it('should detect missing required fields', () =>
		{
			const invalidContent = [
				{ name: 'Test IDE' }, // missing other required fields
				{ type: 'known', available: true, nativePath: '/test', settings: {} }, // missing name
			];
			const result = validateWebviewContent(invalidContent);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('IDE at index 0 missing required field: type');
			expect(result.errors).toContain('IDE at index 0 missing required field: available');
			expect(result.errors).toContain('IDE at index 0 missing required field: nativePath');
			expect(result.errors).toContain('IDE at index 0 missing required field: settings');
			expect(result.errors).toContain('IDE at index 1 missing required field: name');
		});

		it('should detect invalid settings type', () =>
		{
			const invalidContent = [
				{
					name: 'Test IDE',
					type: 'known',
					available: true,
					nativePath: '/test',
					settings: 'invalid settings', // should be object
				},
			];
			const result = validateWebviewContent(invalidContent);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('IDE at index 0 settings must be an object');
		});

		it('should detect non-serializable settings', () =>
		{
			const circularObject: any = { prop: 'value' };
			circularObject.self = circularObject; // Create circular reference

			const invalidContent = [
				{
					name: 'Test IDE',
					type: 'known',
					available: true,
					nativePath: '/test',
					settings: circularObject,
				},
			];
			const result = validateWebviewContent(invalidContent);

			expect(result.isValid).toBe(false);
			expect(result.errors.some(error => error.includes('circular references'))).toBe(true);
		});

		it('should warn about HTML characters in names', () =>
		{
			const contentWithHTML = [
				{
					name: 'IDE <script>alert("xss")</script>',
					type: 'known',
					available: true,
					nativePath: '/test',
					settings: {},
				},
				{
					name: 'Normal IDE',
					type: 'known',
					available: true,
					nativePath: '/test',
					settings: {},
				},
			];
			const result = validateWebviewContent(contentWithHTML);

			expect(result.isValid).toBe(true); // Still valid, just warning
			expect(result.warnings)
				.toContain('IDE at index 0 name contains HTML characters: IDE <script>alert("xss")</script>');
		});

		it('should handle null/undefined IDE objects', () =>
		{
			const invalidContent = [
				null,
				undefined,
				{
					name: 'Valid IDE',
					type: 'known',
					available: true,
					nativePath: '/test',
					settings: {},
				},
			];
			const result = validateWebviewContent(invalidContent);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('IDE at index 0 must be an object');
			expect(result.errors).toContain('IDE at index 1 must be an object');
		});
	});

	describe('sanitizeForWebview', () =>
	{
		it('should sanitize HTML characters correctly', () =>
		{
			const content = [
				{
					name: 'Test <script>alert("xss")</script>',
					type: 'known',
					available: true,
					nativePath: '/test',
					settings: {
						'value with <html>': 'test & more',
						'normalValue': 'normal',
					},
				},
			];

			const result = sanitizeForWebview(content);

			expect(result).not.toContain('<script>');
			expect(result).toContain('\\u003cscript\\u003e');
			expect(result).toContain('\\u003e');
			expect(result).toContain('\\u0026');
			// JSON.stringify already handles quotes, so we expect escaped quotes
			expect(result).toContain('\\"');
		});

		it('should handle quotes correctly', () =>
		{
			const content = {
				name: "Test IDE's \"quoted\" name",
				type: 'known',
				available: true,
				nativePath: '/test',
				settings: {},
			};

			const result = sanitizeForWebview(content);

			// JSON.stringify already handles quotes properly
			expect(result).toContain('\\"');
			// Single quotes are not escaped by JSON.stringify but we handle them
			expect(result).toContain("\\u0027");
		});

		it('should handle complex nested objects', () =>
		{
			const content = {
				name: 'Test IDE',
				type: 'known',
				available: true,
				nativePath: '/test',
				settings: {
					nested: {
						'value with <tags>': 'test & "quotes"',
						array: ['item1', 'item2 with <html>', 'item3'],
					},
				},
			};

			const result = sanitizeForWebview(content);

			expect(result).toContain('\\u003ctags\\u003e');
			expect(result).toContain('\\u0026');
			expect(result).toContain('\\"');
		});

		it('should produce valid JSON that can be parsed back', () =>
		{
			const content = transformIDEListForWebview(mockIDEList);
			const sanitized = sanitizeForWebview(content);

			expect(() =>
			{
				// Remove the extra escaping for quotes to make it valid JSON
				const jsonForParsing = sanitized.replace(/\\"/g, '"').replace(/\\'/g, "'");
				JSON.parse(jsonForParsing);
			}).not.toThrow();
		});
	});

	describe('Integration Tests', () =>
	{
		it('should work end-to-end: transform -> validate -> sanitize', () =>
		{
			// Transform
			const transformed = transformIDEListForWebview(mockIDEList);
			expect(transformed).toHaveLength(3);

			// Validate
			const validation = validateWebviewContent(transformed);
			expect(validation.isValid).toBe(true);
			expect(validation.errors).toHaveLength(0);

			// Sanitize
			const sanitized = sanitizeForWebview(transformed);
			expect(sanitized).not.toContain('<');
			expect(sanitized).not.toContain('>');
			expect(sanitized).not.toContain('&');

			// Verify the sanitized content can be used in JavaScript context
			const jsTemplate = `let ideList = ${sanitized};`;
			expect(jsTemplate).toMatch(/^let ideList = \[.*\];$/);
		});

		it('should handle real-world IDE settings data', () =>
		{
			// Simulate real VS Code settings
			const realSettings = {
				'editor.fontFamily': "'Fira Code', 'Courier New', monospace",
				'editor.fontSize': 14,
				'editor.lineHeight': 1.5,
				'editor.tabSize': 4,
				'editor.insertSpaces': true,
				'editor.wordWrap': 'on',
				'editor.rulers': [80, 120, 160],
				'editor.cursorBlinking': 'smooth',
				'editor.cursorStyle': 'line',
				'editor.minimap.enabled': true,
				'editor.minimap.renderCharacters': true,
				'editor.minimap.maxColumn': 100,
				'workbench.colorTheme': 'Dark+ (default dark)',
				'workbench.iconTheme': 'vs-seti',
				'workbench.startupEditor': 'newUntitledFile',
				'terminal.integrated.shell.windows': 'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
				'terminal.integrated.shell.osx': '/bin/zsh',
				'terminal.integrated.shell.linux': '/bin/bash',
				'git.enableSmartCommit': true,
				'git.autofetch': true,
				'git.confirmSync': false,
				'extensions.autoUpdate': false,
				'sync.enable': false,
				'telemetry.enableTelemetry': false,
				'update.enableWindowsBackgroundUpdates': false,
			};

			mockSettingProvider.load = jest.fn().mockReturnValue({
				valueOf: () => realSettings,
			}) as any;

			const transformed = transformIDEListForWebview(mockIDEList);
			const validation = validateWebviewContent(transformed);

			expect(validation.isValid).toBe(true);
			expect(transformed[0].settings).toEqual(realSettings);

			// Test JSON serialization
			expect(() => JSON.stringify(transformed)).not.toThrow();
			expect(() => JSON.parse(JSON.stringify(transformed))).not.toThrow();
		});

		it('should handle problematic characters in IDE names and paths', () =>
		{
			const problematicIDEs: IIDEInfo[] = [
				{
					name: 'IDE with "quotes" & <brackets>',
					type: EnumIDEInfoType.custom,
					available: true,
					nativePath: 'C:\\Path\\With "Quotes" & Brackets <test>',
					settingProvider: mockSettingProvider,
				},
				{
					name: "IDE with 'single quotes'",
					type: EnumIDEInfoType.custom,
					available: true,
					nativePath: "D:\\Path\\With 'Single' Quotes",
					settingProvider: mockSettingProvider,
				},
			] as any;

			const transformed = transformIDEListForWebview(problematicIDEs);
			const validation = validateWebviewContent(transformed);

			expect(validation.isValid).toBe(true);
			expect(validation.warnings.length).toBeGreaterThan(0); // Should warn about HTML characters

			const sanitized = sanitizeForWebview(transformed);
			expect(sanitized).not.toContain('<');
			expect(sanitized).not.toContain('>');
			expect(sanitized).not.toContain('&');

			expect({
				transformed,
				validation,
				sanitized,
				stringify: JSON.stringify(transformed),
			}).toMatchSnapshot();

		});
	});
});
