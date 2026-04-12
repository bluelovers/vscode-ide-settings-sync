/**
 * 匯出匯入基本測試
 * Export/Import Basic Tests
 *
 * 測試匯出匯入功能的基本邏輯，不依賴 VSCode API
 * Tests basic logic of export/import functionality without VSCode API dependencies
 */

import { ExportImportType, IExportImportData, IImportOptions } from '../src/types';

// Mock the known IDEs for testing
const mockKnownIDEs = [
	{ name: 'Visual Studio Code', appFolderNames: ['Code'] },
	{ name: 'Windsurf', appFolderNames: ['Windsurf'] },
];

describe('Export/Import Basic Logic', () =>
{
	describe('Export Data Structure', () =>
	{
		it('should create valid export data structure', () =>
		{
			const exportData: IExportImportData = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				exportedBy: 'Test Suite',
				type: ExportImportType.both,
				customIDEs: [
					{
						name: 'Test IDE',
						path: '/test/path',
						exportedAt: new Date().toISOString(),
						detected: false,
					},
				],
				selectedSettings: [
					{
						key: 'test.setting',
						display: 'Test Setting',
						description: 'A test setting',
						values: {},
						exportedAt: new Date().toISOString(),
					},
				],
				metadata: {
					totalCustomIDEs: 1,
					totalSelectedSettings: 1,
					knownIDEsExcluded: mockKnownIDEs.map(ide => ide.name),
				},
			};

			expect(exportData.version).toBe('1.0.0');
			expect(exportData.type).toBe(ExportImportType.both);
			expect(exportData.customIDEs).toHaveLength(1);
			expect(exportData.selectedSettings).toHaveLength(1);
			expect(exportData.metadata?.totalCustomIDEs).toBe(1);
			expect(exportData.metadata?.knownIDEsExcluded).toContain('Visual Studio Code');
		});

		it('should validate JSON serialization', () =>
		{
			const exportData: IExportImportData = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				exportedBy: 'Test Suite',
				type: ExportImportType.customIDEs,
				customIDEs: [
					{
						name: 'Test IDE',
						path: '/test/path',
						exportedAt: new Date().toISOString(),
						detected: true,
					},
				],
			};

			const jsonString = JSON.stringify(exportData);
			const parsedData = JSON.parse(jsonString) as IExportImportData;

			expect(parsedData.version).toBe(exportData.version);
			expect(parsedData.type).toBe(exportData.type);
			expect(parsedData.customIDEs).toHaveLength(1);
			expect(parsedData.customIDEs![0].name).toBe('Test IDE');
		});
	});

	describe('Import Options Validation', () =>
	{
		it('should create valid import options', () =>
		{
			const options: IImportOptions = {
				includeCustomIDEs: true,
				includeSelectedSettings: true,
				excludeKnownIDEs: true,
				overwriteExisting: false,
				selectedSettingKeys: ['setting1', 'setting2'],
			};

			expect(options.includeCustomIDEs).toBe(true);
			expect(options.includeSelectedSettings).toBe(true);
			expect(options.excludeKnownIDEs).toBe(true);
			expect(options.overwriteExisting).toBe(false);
			expect(options.selectedSettingKeys).toHaveLength(2);
		});

		it('should handle minimal import options', () =>
		{
			const options: IImportOptions = {
				includeCustomIDEs: false,
				includeSelectedSettings: false,
				excludeKnownIDEs: false,
				overwriteExisting: true,
			};

			expect(options.selectedSettingKeys).toBeUndefined();
		});
	});

	describe('Known IDE Filtering Logic', () =>
	{
		it('should identify known IDEs', () =>
		{
			const knownIDENames = new Set(mockKnownIDEs.map(ide => ide.name));

			expect(knownIDENames.has('Visual Studio Code')).toBe(true);
			expect(knownIDENames.has('Windsurf')).toBe(true);
			expect(knownIDENames.has('Unknown IDE')).toBe(false);
		});

		it('should filter out known IDEs from custom IDE list', () =>
		{
			const customIDEs = [
				{ name: 'Visual Studio Code', path: '/vscode' },
				{ name: 'Custom IDE 1', path: '/custom1' },
				{ name: 'Windsurf', path: '/windsurf' },
				{ name: 'Custom IDE 2', path: '/custom2' },
			];

			const knownIDENames = new Set(mockKnownIDEs.map(ide => ide.name));
			const filteredIDEs = customIDEs.filter(ide => !knownIDENames.has(ide.name));

			expect(filteredIDEs).toHaveLength(2);
			expect(filteredIDEs[0].name).toBe('Custom IDE 1');
			expect(filteredIDEs[1].name).toBe('Custom IDE 2');
		});
	});

	describe('Import Result Structure', () =>
	{
		it('should create successful import result', () =>
		{
			const result = {
				success: true,
				importedCustomIDEs: 2,
				importedSelectedSettings: 5,
				skippedCustomIDEs: 1,
				skippedSelectedSettings: 0,
				errors: [],
				warnings: ['Skipped known IDE: Visual Studio Code'],
			};

			expect(result.success).toBe(true);
			expect(result.importedCustomIDEs).toBe(2);
			expect(result.importedSelectedSettings).toBe(5);
			expect(result.errors).toHaveLength(0);
			expect(result.warnings).toHaveLength(1);
		});

		it('should create failed import result', () =>
		{
			const result = {
				success: false,
				importedCustomIDEs: 0,
				importedSelectedSettings: 0,
				skippedCustomIDEs: 0,
				skippedSelectedSettings: 0,
				errors: ['Invalid JSON format', 'Version not supported'],
				warnings: [],
			};

			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(2);
			expect(result.warnings).toHaveLength(0);
		});
	});

	describe('Setting Selection Logic', () =>
	{
		it('should filter settings by selected keys', () =>
		{
			const allSettings = [
				{ key: 'setting1', display: 'Setting 1' },
				{ key: 'setting2', display: 'Setting 2' },
				{ key: 'setting3', display: 'Setting 3' },
			];

			const selectedKeys = ['setting1', 'setting3'];
			const filteredSettings = allSettings.filter(setting =>
				selectedKeys.includes(setting.key),
			);

			expect(filteredSettings).toHaveLength(2);
			expect(filteredSettings[0].key).toBe('setting1');
			expect(filteredSettings[1].key).toBe('setting3');
		});

		it('should handle empty selection', () =>
		{
			const allSettings = [
				{ key: 'setting1', display: 'Setting 1' },
				{ key: 'setting2', display: 'Setting 2' },
			];

			const selectedKeys: string[] = [];
			const filteredSettings = allSettings.filter(setting =>
				selectedKeys.includes(setting.key),
			);

			expect(filteredSettings).toHaveLength(0);
		});
	});

	describe('Version Compatibility', () =>
	{
		it('should accept compatible versions', () =>
		{
			const supportedVersions = ['1.0.0'];
			const version = '1.0.0';

			const isCompatible = supportedVersions.includes(version);
			expect(isCompatible).toBe(true);
		});

		it('should reject incompatible versions', () =>
		{
			const supportedVersions = ['1.0.0'];
			const version = '2.0.0';

			const isCompatible = supportedVersions.includes(version);
			expect(isCompatible).toBe(false);
		});
	});

	describe('Conflict Detection', () =>
	{
		it('should detect existing custom IDEs', () =>
		{
			const existingCustomIDEs = [
				{ name: 'Existing IDE', path: '/existing/path' },
			];

			const newCustomIDEs = [
				{ name: 'Existing IDE', path: '/new/path' },
				{ name: 'New IDE', path: '/new/path' },
			];

			const existingNames = new Set(existingCustomIDEs.map(ide => ide.name));
			const conflicts = newCustomIDEs.filter(ide => existingNames.has(ide.name));

			expect(conflicts).toHaveLength(1);
			expect(conflicts[0].name).toBe('Existing IDE');
		});

		it('should detect existing settings', () =>
		{
			const existingSettings = {
				'setting1': true,
				'setting2': false,
			};

			const newSettings = ['setting1', 'setting3'];

			const conflicts = newSettings.filter(key => key in existingSettings);
			expect(conflicts).toHaveLength(1);
			expect(conflicts[0]).toBe('setting1');
		});
	});

	describe('Data Transformation', () =>
	{
		it('should transform custom IDEs for export', () =>
		{
			const customIDEs = [
				{ name: 'Test IDE', path: '/test/path' },
			];

			const exportIDEs = customIDEs.map(ide => ({
				name: ide.name,
				path: ide.path,
				exportedAt: new Date().toISOString(),
				detected: false,
			}));

			expect(exportIDEs).toHaveLength(1);
			expect(exportIDEs[0].name).toBe('Test IDE');
			expect(exportIDEs[0].path).toBe('/test/path');
			expect(exportIDEs[0].exportedAt).toBeDefined();
		});

		it('should transform selected settings for export', () =>
		{
			const selectedSettings = {
				'setting1': true,
				'setting2': true,
				'setting3': false,
			};

			const exportSettings = Object.entries(selectedSettings)
				.filter(([_, selected]) => selected)
				.map(([key, _]) => ({
					key,
					display: key.split('.').map(part =>
						part.charAt(0).toUpperCase() + part.slice(1),
					).join(' '),
					description: `Setting for ${key}`,
					values: {},
					exportedAt: new Date().toISOString(),
				}));

			expect(exportSettings).toHaveLength(2);
			expect(exportSettings[0].key).toBe('setting1');
			expect(exportSettings[0].display).toBe('Setting1');
		});
	});
});
