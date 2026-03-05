/**
 * 匯出匯入服務測試
 * Export/Import Service Tests
 */

import { ExportImportService } from '../../src/services/exportImportService';
import { ExportImportType, IExportImportData } from '../../src/types';

// Mock vscode module
const mockVscode = {
	window: {
		showSaveDialog: jest.fn(),
		showOpenDialog: jest.fn(),
		showInformationMessage: jest.fn(),
		showErrorMessage: jest.fn(),
		showWarningMessage: jest.fn(),
		showQuickPick: jest.fn(),
	},
	Uri: {
		file: jest.fn(),
	},
	workspace: {
		rootPath: '/test/workspace',
	},
};

// Mock fs module
const mockFs = {
	writeFileSync: jest.fn(),
	readFileSync: jest.fn(),
};

// Setup mocks before importing
jest.mock('vscode', () => mockVscode);
jest.mock('fs', () => mockFs);

describe('ExportImportService', () => {
	let service: ExportImportService;
	let mockContext: any;

	beforeEach(() => {
		mockContext = {
			globalState: {
				get: jest.fn(),
				update: jest.fn(),
			},
		};
		service = new ExportImportService(mockContext);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('Export Custom IDEs', () => {
		it('should export custom IDEs successfully', async () => {
			const customIDEs = [
				{ name: 'Custom IDE 1', path: '/path/to/custom1' },
				{ name: 'Custom IDE 2', path: '/path/to/custom2' },
			];

			mockContext.globalState.get.mockReturnValue(customIDEs);

			const result = await service.exportCustomIDEs();
			const data: IExportImportData = JSON.parse(result);

			expect(data.version).toBe('1.0.0');
			expect(data.type).toBe(ExportImportType.customIDEs);
			expect(data.customIDEs).toHaveLength(2);
			expect(data.customIDEs![0].name).toBe('Custom IDE 1');
			expect(data.customIDEs![0].path).toBe('/path/to/custom1');
			expect(data.metadata?.totalCustomIDEs).toBe(2);
		});

		it('should export empty custom IDEs list', async () => {
			mockContext.globalState.get.mockReturnValue([]);

			const result = await service.exportCustomIDEs();
			const data: IExportImportData = JSON.parse(result);

			expect(data.customIDEs).toHaveLength(0);
			expect(data.metadata?.totalCustomIDEs).toBe(0);
		});
	});

	describe('Export Selected Settings', () => {
		it('should export selected settings successfully', async () => {
			const selectedSettings = {
				'setting1': true,
				'setting2': true,
				'setting3': false,
			};

			mockContext.globalState.get.mockReturnValue(selectedSettings);

			const result = await service.exportSelectedSettings();
			const data: IExportImportData = JSON.parse(result);

			expect(data.type).toBe(ExportImportType.selectedSettings);
			expect(data.selectedSettings).toHaveLength(2);
			expect(data.selectedSettings![0].key).toBe('setting1');
			expect(data.selectedSettings![1].key).toBe('setting2');
			expect(data.metadata?.totalSelectedSettings).toBe(2);
		});

		it('should export empty selected settings', async () => {
			mockContext.globalState.get.mockReturnValue({});

			const result = await service.exportSelectedSettings();
			const data: IExportImportData = JSON.parse(result);

			expect(data.selectedSettings).toHaveLength(0);
			expect(data.metadata?.totalSelectedSettings).toBe(0);
		});
	});

	describe('Export All', () => {
		it('should export both custom IDEs and selected settings', async () => {
			const customIDEs = [
				{ name: 'Custom IDE 1', path: '/path/to/custom1' },
			];
			const selectedSettings = {
				'setting1': true,
				'setting2': false,
			};

			mockContext.globalState.get
				.mockReturnValueOnce(customIDEs)
				.mockReturnValueOnce(selectedSettings);

			const result = await service.exportAll();
			const data: IExportImportData = JSON.parse(result);

			expect(data.type).toBe(ExportImportType.both);
			expect(data.customIDEs).toHaveLength(1);
			expect(data.selectedSettings).toHaveLength(1);
			expect(data.metadata?.totalCustomIDEs).toBe(1);
			expect(data.metadata?.totalSelectedSettings).toBe(1);
		});
	});

	describe('Import Data', () => {
		it('should import custom IDEs successfully', async () => {
			const importData: IExportImportData = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				exportedBy: 'Test',
				type: ExportImportType.customIDEs,
				customIDEs: [
					{ name: 'Import IDE 1', path: '/import/path1', exportedAt: new Date().toISOString() },
				],
			};

			const jsonData = JSON.stringify(importData);
			const options = {
				includeCustomIDEs: true,
				includeSelectedSettings: false,
				excludeKnownIDEs: true,
				overwriteExisting: true,
			};

			mockContext.globalState.get.mockReturnValue([]);

			const result = await service.importData(jsonData, options);

			expect(result.success).toBe(true);
			expect(result.importedCustomIDEs).toBe(1);
			expect(result.importedSelectedSettings).toBe(0);
			expect(mockContext.globalState.update).toHaveBeenCalledWith(
				'customIDEs',
				[{ name: 'Import IDE 1', path: '/import/path1' }]
			);
		});

		it('should skip known IDEs when excludeKnownIDEs is true', async () => {
			const importData: IExportImportData = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				exportedBy: 'Test',
				type: ExportImportType.customIDEs,
				customIDEs: [
					{ name: 'Visual Studio Code', path: '/vscode/path', exportedAt: new Date().toISOString() },
					{ name: 'Custom IDE', path: '/custom/path', exportedAt: new Date().toISOString() },
				],
			};

			const jsonData = JSON.stringify(importData);
			const options = {
				includeCustomIDEs: true,
				includeSelectedSettings: false,
				excludeKnownIDEs: true,
				overwriteExisting: true,
			};

			mockContext.globalState.get.mockReturnValue([]);

			const result = await service.importData(jsonData, options);

			expect(result.success).toBe(true);
			expect(result.importedCustomIDEs).toBe(1);
			expect(result.skippedCustomIDEs).toBe(1);
			expect(result.warnings).toContain('跳過已知 IDE: Visual Studio Code');
		});

		it('should skip existing custom IDEs when overwriteExisting is false', async () => {
			const importData: IExportImportData = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				exportedBy: 'Test',
				type: ExportImportType.customIDEs,
				customIDEs: [
					{ name: 'Existing IDE', path: '/existing/path', exportedAt: new Date().toISOString() },
				],
			};

			const jsonData = JSON.stringify(importData);
			const options = {
				includeCustomIDEs: true,
				includeSelectedSettings: false,
				excludeKnownIDEs: false,
				overwriteExisting: false,
			};

			mockContext.globalState.get.mockReturnValue([
				{ name: 'Existing IDE', path: '/old/path' },
			]);

			const result = await service.importData(jsonData, options);

			expect(result.success).toBe(true);
			expect(result.importedCustomIDEs).toBe(0);
			expect(result.skippedCustomIDEs).toBe(1);
			expect(result.warnings).toContain('跳過已存在的自訂 IDE: Existing IDE');
		});

		it('should import selected settings successfully', async () => {
			const importData: IExportImportData = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				exportedBy: 'Test',
				type: ExportImportType.selectedSettings,
				selectedSettings: [
					{
						key: 'setting1',
						display: 'Setting 1',
						description: 'Description 1',
						values: {},
						exportedAt: new Date().toISOString(),
					},
				],
			};

			const jsonData = JSON.stringify(importData);
			const options = {
				includeCustomIDEs: false,
				includeSelectedSettings: true,
				excludeKnownIDEs: false,
				overwriteExisting: true,
			};

			mockContext.globalState.get.mockReturnValue({});

			const result = await service.importData(jsonData, options);

			expect(result.success).toBe(true);
			expect(result.importedCustomIDEs).toBe(0);
			expect(result.importedSelectedSettings).toBe(1);
			expect(mockContext.globalState.update).toHaveBeenCalledWith(
				'selectedSettings',
				{ setting1: true }
			);
		});

		it('should handle invalid JSON', async () => {
			const invalidJson = '{ invalid json }';
			const options = {
				includeCustomIDEs: true,
				includeSelectedSettings: false,
				excludeKnownIDEs: false,
				overwriteExisting: true,
			};

			const result = await service.importData(invalidJson, options);

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should handle incompatible version', async () => {
			const importData: IExportImportData = {
				version: '2.0.0',
				exportedAt: new Date().toISOString(),
				exportedBy: 'Test',
				type: ExportImportType.customIDEs,
			};

			const jsonData = JSON.stringify(importData);
			const options = {
				includeCustomIDEs: true,
				includeSelectedSettings: false,
				excludeKnownIDEs: false,
				overwriteExisting: true,
			};

			const result = await service.importData(jsonData, options);

			expect(result.success).toBe(false);
			expect(result.errors).toContain('不支援的版本: 2.0.0');
		});
	});

	describe('File Operations', () => {
		it('should save export file successfully', async () => {
			const mockUri = { fsPath: '/test/export.json' };
			mockVscode.window.showSaveDialog.mockResolvedValue(mockUri);

			const content = 'test content';
			const result = await service.saveExportFile(content, 'test.json');

			expect(result).toBe('/test/export.json');
			expect(mockFs.writeFileSync).toHaveBeenCalledWith('/test/export.json', content, 'utf8');
			expect(mockVscode.window.showInformationMessage).toHaveBeenCalledWith('匯出成功: /test/export.json');
		});

		it('should handle save dialog cancellation', async () => {
			mockVscode.window.showSaveDialog.mockResolvedValue(undefined);

			const content = 'test content';
			const result = await service.saveExportFile(content, 'test.json');

			expect(result).toBeUndefined();
			expect(mockFs.writeFileSync).not.toHaveBeenCalled();
		});

		it('should read import file successfully', async () => {
			const mockUri = { fsPath: '/test/import.json' };
			mockVscode.window.showOpenDialog.mockResolvedValue([mockUri]);
			mockFs.readFileSync.mockReturnValue('{"test": "data"}');

			const result = await service.readImportFile();

			expect(result).toBe('{"test": "data"}');
			expect(mockVscode.window.showOpenDialog).toHaveBeenCalled();
			expect(mockFs.readFileSync).toHaveBeenCalledWith('/test/import.json', 'utf8');
		});

		it('should handle read dialog cancellation', async () => {
			mockVscode.window.showOpenDialog.mockResolvedValue(undefined);

			const result = await service.readImportFile();

			expect(result).toBeUndefined();
			expect(mockFs.readFileSync).not.toHaveBeenCalled();
		});
	});

	describe('Helper Methods', () => {
		it('should get setting display name', () => {
			const display = service['getSettingDisplay']('editor.fontSize');
			expect(display).toBe('Editor Font Size');
		});

		it('should get setting description', () => {
			const description = service['getSettingDescription']('editor.fontSize');
			expect(description).toBe('Setting for editor.fontSize');
		});

		it('should check version compatibility', () => {
			expect(service['isVersionCompatible']('1.0.0')).toBe(true);
			expect(service['isVersionCompatible']('2.0.0')).toBe(false);
		});
	});
});
