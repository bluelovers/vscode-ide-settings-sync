/**
 * 匯出匯入核心功能測試
 * Export/Import Core Functionality Tests
 */

import {
	ExportImportCore,
	IStorageProvider,
	IFileSystemProvider,
	IDialogProvider,
} from '../../src/core/exportImportCore';
import { IImportOptions, IImportResult, ExportImportType } from '../../src/types';
import { EnumShowMessageType } from '../../webview/src/types';

// Mock providers for testing
class MockStorageProvider implements IStorageProvider
{
	private storage: Map<string, any> = new Map();

	get<T>(key: string, defaultValue?: T): T
	{
		return this.storage.get(key) ?? defaultValue;
	}

	async update(key: string, value: any): Promise<void>
	{
		this.storage.set(key, value);
	}

	// Helper method for testing
	clear(): void
	{
		this.storage.clear();
	}

	// Helper method for testing
	setStorage(data: Record<string, any>): void
	{
		this.storage.clear();
		Object.entries(data).forEach(([key, value]) =>
		{
			this.storage.set(key, value);
		});
	}
}

class MockFileSystemProvider implements IFileSystemProvider
{
	private files: Map<string, string> = new Map();

	async readFile(path: string): Promise<string>
	{
		const content = this.files.get(path);
		if (!content)
		{
			throw new Error(`File not found: ${path}`);
		}
		return content;
	}

	async writeFile(path: string, content: string): Promise<void>
	{
		this.files.set(path, content);
	}

	// Helper method for testing
	setFile(path: string, content: string): void
	{
		this.files.set(path, content);
	}

	// Helper method for testing
	getFile(path: string): string | undefined
	{
		return this.files.get(path);
	}
}

class MockDialogProvider implements IDialogProvider
{
	private saveDialogResult?: string;
	private openDialogResult?: string[];
	private quickPickResult?: any[];
	private messageLog: Array<{ message: string; type: string }> = [];

	setSaveDialogResult(result?: string): void
	{
		this.saveDialogResult = result;
	}

	setOpenDialogResult(result?: string[]): void
	{
		this.openDialogResult = result;
	}

	setQuickPickResult(result?: any[]): void
	{
		this.quickPickResult = result;
	}

	getMessageLog(): Array<{ message: string; type: string }>
	{
		return [...this.messageLog];
	}

	clearMessageLog(): void
	{
		this.messageLog = [];
	}

	async showSaveDialog(options: any): Promise<string | undefined>
	{
		return this.saveDialogResult;
	}

	async showOpenDialog(options: any): Promise<string[] | undefined>
	{
		return this.openDialogResult;
	}

	async showQuickPick(items: any[], options: any): Promise<any[] | undefined>
	{
		return this.quickPickResult;
	}

	async showMessage(message: string, type: EnumShowMessageType): Promise<void>
	{
		this.messageLog.push({ message, type });
	}
}

describe('ExportImportCore', () =>
{
	let storageProvider: MockStorageProvider;
	let fileSystemProvider: MockFileSystemProvider;
	let dialogProvider: MockDialogProvider;
	let exportImportCore: ExportImportCore;

	beforeEach(() =>
	{
		storageProvider = new MockStorageProvider();
		fileSystemProvider = new MockFileSystemProvider();
		dialogProvider = new MockDialogProvider();
		exportImportCore = new ExportImportCore(storageProvider, fileSystemProvider, dialogProvider);
	});

	describe('exportCustomIDEs', () =>
	{
		it('should export custom IDEs correctly', async () =>
		{
			// Setup test data
			storageProvider.setStorage({
				'customIDEs': [
					{ name: 'Test IDE 1', path: '/path/to/ide1' },
					{ name: 'Test IDE 2', path: '/path/to/ide2' },
				],
			});

			const result = await exportImportCore.exportCustomIDEs();
			const exportData = JSON.parse(result);

			expect(exportData.version).toBe('1.0.0');
			expect(exportData.type).toBe(ExportImportType.customIDEs);
			expect(exportData.customIDEs).toHaveLength(2);
			expect(exportData.customIDEs[0].name).toBe('Test IDE 1');
			expect(exportData.customIDEs[0].path).toBe('/path/to/ide1');
			expect(exportData.metadata?.totalCustomIDEs).toBe(2);
		});

		it('should handle empty custom IDEs list', async () =>
		{
			storageProvider.setStorage({ 'customIDEs': [] });

			const result = await exportImportCore.exportCustomIDEs();
			const exportData = JSON.parse(result);

			expect(exportData.customIDEs).toHaveLength(0);
			expect(exportData.metadata?.totalCustomIDEs).toBe(0);
		});
	});

	describe('exportSelectedSettings', () =>
	{
		it('should export selected settings correctly', async () =>
		{
			storageProvider.setStorage({
				'selectedSettings': {
					'editor.fontSize': true,
					'editor.fontFamily': true,
					'workbench.colorTheme': false,
				},
			});

			const result = await exportImportCore.exportSelectedSettings();
			const exportData = JSON.parse(result);

			expect(exportData.type).toBe(ExportImportType.selectedSettings);
			expect(exportData.selectedSettings).toHaveLength(2);
			expect(exportData.selectedSettings.map((s: any) => s.key)).toContain('editor.fontSize');
			expect(exportData.selectedSettings.map((s: any) => s.key)).toContain('editor.fontFamily');
			expect(exportData.metadata?.totalSelectedSettings).toBe(2);
		});
	});

	describe('exportAll', () =>
	{
		it('should export both custom IDEs and selected settings', async () =>
		{
			storageProvider.setStorage({
				'customIDEs': [
					{ name: 'Test IDE', path: '/path/to/ide' },
				],
				'selectedSettings': {
					'editor.fontSize': true,
				},
			});

			const result = await exportImportCore.exportAll();
			const exportData = JSON.parse(result);

			expect(exportData.type).toBe(ExportImportType.both);
			expect(exportData.customIDEs).toHaveLength(1);
			expect(exportData.selectedSettings).toHaveLength(1);
			expect(exportData.metadata?.totalCustomIDEs).toBe(1);
			expect(exportData.metadata?.totalSelectedSettings).toBe(1);
		});
	});

	describe('importData', () =>
	{
		it('should import custom IDEs successfully', async () =>
		{
			const importData = {
				version: '1.0.0',
				type: ExportImportType.customIDEs,
				customIDEs: [
					{ name: 'Imported IDE', path: '/import/path', exportedAt: new Date().toISOString() },
				],
				metadata: {
					knownIDEsExcluded: ['VSCode', 'WebStorm'],
				},
			};

			const options: IImportOptions = {
				includeCustomIDEs: true,
				includeSelectedSettings: false,
				excludeKnownIDEs: true,
				overwriteExisting: false,
				knownIDEsExcluded: ['VSCode', 'WebStorm'],
			};

			const result = await exportImportCore.importData(JSON.stringify(importData), options);

			expect(result.success).toBe(true);
			expect(result.importedCustomIDEs).toBe(1);
			expect(result.importedSelectedSettings).toBe(0);

			const storedIDEs = storageProvider.get('customIDEs', []) as Array<{ name: string; path: string }>;
			expect(storedIDEs).toHaveLength(1);
			expect(storedIDEs[0].name).toBe('Imported IDE');
		});

		it('should skip existing custom IDEs when overwrite is disabled', async () =>
		{
			storageProvider.setStorage({
				'customIDEs': [
					{ name: 'Existing IDE', path: '/existing/path' },
				],
			});

			const importData = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				exportedBy: 'Test',
				type: ExportImportType.customIDEs,
				customIDEs: [
					{ name: 'Existing IDE', path: '/new/path', exportedAt: new Date().toISOString() },
				],
				metadata: {
					totalCustomIDEs: 1,
					totalSelectedSettings: 0,
				},
			};

			const options: IImportOptions = {
				includeCustomIDEs: true,
				includeSelectedSettings: false,
				excludeKnownIDEs: false,
				overwriteExisting: false,
			};

			const result = await exportImportCore.importData(JSON.stringify(importData), options);

			expect(result.success).toBe(true);
			expect(result.importedCustomIDEs).toBe(0);
			expect(result.skippedCustomIDEs).toBe(1);
			expect(result.warnings).toContain('跳過已存在的自訂 IDE: Existing IDE');
		});

		it('should handle version incompatibility', async () =>
		{
			const importData = {
				version: '2.0.0',
				exportedAt: new Date().toISOString(),
				exportedBy: 'Test',
				type: ExportImportType.customIDEs,
				customIDEs: [],
				metadata: {
					totalCustomIDEs: 0,
					totalSelectedSettings: 0,
				},
			};

			const options: IImportOptions = {
				includeCustomIDEs: true,
				includeSelectedSettings: false,
				excludeKnownIDEs: false,
				overwriteExisting: false,
			};

			const result = await exportImportCore.importData(JSON.stringify(importData), options);

			expect(result.success).toBe(false);
			expect(result.errors).toContain('不支援的版本: 2.0.0');
		});

		it('should handle invalid JSON', async () =>
		{
			const options: IImportOptions = {
				includeCustomIDEs: true,
				includeSelectedSettings: false,
				excludeKnownIDEs: false,
				overwriteExisting: false,
			};

			const result = await exportImportCore.importData('invalid json', options);

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});
	});

	describe('file operations', () =>
	{
		it('should save export file successfully', async () =>
		{
			dialogProvider.setSaveDialogResult('/test/export.json');
			const content = '{"test": "data"}';

			const filePath = await exportImportCore.saveExportFile(content, 'export.json');

			expect(filePath).toBe('/test/export.json');
			expect(fileSystemProvider.getFile('/test/export.json')).toBe(content);
		});

		it('should read import file successfully', async () =>
		{
			const testContent = '{"test": "import data"}';
			fileSystemProvider.setFile('/test/import.json', testContent);
			dialogProvider.setOpenDialogResult(['/test/import.json']);

			const content = await exportImportCore.readImportFile();

			expect(content).toBe(testContent);
		});

		it('should handle file read errors', async () =>
		{
			dialogProvider.setOpenDialogResult(['/nonexistent/file.json']);

			const content = await exportImportCore.readImportFile();

			expect(content).toBeUndefined();
			expect(dialogProvider.getMessageLog().some(log =>
				log.type === 'error' && log.message.includes('讀取失敗'),
			)).toBe(true);
		});
	});

	describe('dialog operations', () =>
	{
		it('should show import options dialog correctly', async () =>
		{
			const importData = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				exportedBy: 'Test',
				type: ExportImportType.both,
				customIDEs: [{ name: 'Test IDE', path: '/path', exportedAt: new Date().toISOString() }],
				selectedSettings: [
					{
						key: 'test.setting',
						display: 'Test Setting',
						description: 'Test',
						values: {},
						exportedAt: new Date().toISOString(),
					},
				],
				metadata: {
					totalCustomIDEs: 1,
					totalSelectedSettings: 1,
					knownIDEsExcluded: ['VSCode'],
				},
			};

			dialogProvider.setQuickPickResult([
				{ label: '📁 匯入自訂 IDE' },
				{ label: '⚙️ 匯入選擇的設定' },
			]);

			const options = await exportImportCore.showImportOptionsDialog(importData);

			expect(options).toBeDefined();
			expect(options?.includeCustomIDEs).toBe(true);
			expect(options?.includeSelectedSettings).toBe(true);
		});

		it('should return undefined when no options selected', async () =>
		{
			const importData = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				exportedBy: 'Test',
				type: ExportImportType.customIDEs,
				customIDEs: [],
				metadata: {
					totalCustomIDEs: 0,
					totalSelectedSettings: 0,
					knownIDEsExcluded: [],
				},
			};

			dialogProvider.setQuickPickResult(undefined);

			const options = await exportImportCore.showImportOptionsDialog(importData);

			expect(options).toBeUndefined();
		});
	});
});
