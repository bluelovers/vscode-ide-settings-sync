/**
 * IDEProvider 內建備份 IDE 功能測試
 * IDEProvider built-in backup IDE feature tests
 *
 * 測試內建備份 IDE 的路徑設定（getBackupIDEPath / setBackupIDEPath）
 * 與載入行為（loadBackupIDE）。
 * Tests the built-in backup IDE path setting (getBackupIDEPath / setBackupIDEPath)
 * and loading behavior (loadBackupIDE).
 */

import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { IDEProvider } from '../../src/providers/ideProvider';
import { EnumIDEInfoType, EnumGlobalStateName } from '../../src/types';
import { BACKUP_IDE_NAME, BACKUP_IDE_NOT_CONFIGURED_REASON } from '../../src/data/backupIDE';
import { __ROOT_TEST_TEMP } from '../__root';

// Mock the vscode module: IDEProvider only uses vscode for type positions at runtime
// (the actual globalState is passed via the fake ExtensionContext below).
// virtual: true is required because only @types/vscode is installed, not the vscode package.
jest.mock('vscode', () => ({}), { virtual: true });

// nanoid v6 is ESM-only and cannot be parsed by jest's CJS runtime.
jest.mock('nanoid', () => ({ nanoid: () => 'test-backup-uuid' }));

/**
 * 建立一個 Map 支援的 globalState mock
 * Create a Map-backed globalState mock
 */
function createMockGlobalState()
{
	const store = new Map<string, any>();

	return {
		store,
		get: jest.fn((key: string, defaultValue?: any) =>
			store.has(key) ? store.get(key) : defaultValue,
		),
		update: jest.fn(async (key: string, value: any) =>
		{
			store.set(key, value);
		}),
	};
}

describe('IDEProvider backup IDE', () =>
{
	let provider: IDEProvider;
	let mockGlobalState: ReturnType<typeof createMockGlobalState>;
	const extensionPath = join(__ROOT_TEST_TEMP, 'backup-ide-test-extension');

	beforeAll(() =>
	{
		mkdirSync(extensionPath, { recursive: true });
	});

	beforeEach(() =>
	{
		/**
		 * 清理先前測試可能遺留的備份資料夾，確保每次測試的檔案狀態獨立
		 * Clean up backup folders possibly left by previous tests, keeping each test's file state independent
		 */
		[join(__ROOT_TEST_TEMP, 'nonexistent-backup-folder'), join(__ROOT_TEST_TEMP, 'auto-create-backup-folder'), join(__ROOT_TEST_TEMP, 'backup-settings')].forEach(dir =>
		{
			rmSync(dir, { recursive: true, force: true });
		});

		mockGlobalState = createMockGlobalState();
		const context = {
			extensionPath,
			globalState: mockGlobalState,
		};
		provider = new IDEProvider(context as any);
	});

	describe('getBackupIDEPath', () =>
	{
		it('should return empty string when no path is configured', () =>
		{
			expect(provider.getBackupIDEPath()).toBe('');
		});

		it('should return the configured path from globalState', () =>
		{
			const backupPath = join(__ROOT_TEST_TEMP, 'backup-settings');
			mockGlobalState.store.set(EnumGlobalStateName.backupIDEPath, backupPath);

			expect(provider.getBackupIDEPath()).toBe(backupPath);
		});
	});

	describe('loadBackupIDE', () =>
	{
		it('should add an unavailable Backup entry when path is not configured', async () =>
		{
			await provider.refreshIDEList();

			const backup = provider.getUnavailableIDEs().find(ide => ide.name === BACKUP_IDE_NAME);
			expect(backup).toBeDefined();
			expect(backup!.type).toBe(EnumIDEInfoType.backup);
			expect(backup!.expectedPath).toBe('');
			expect(backup!.reason).toContain(BACKUP_IDE_NOT_CONFIGURED_REASON);
		});

		it('should add an available Backup IDE when a path is configured even without settings.json', async () =>
		{
			const backupPath = join(__ROOT_TEST_TEMP, 'nonexistent-backup-folder');
			await provider.setBackupIDEPath(backupPath);

			const backup = provider.getIDEList().find(ide => ide.name === BACKUP_IDE_NAME);
			expect(backup).toBeDefined();
			expect(backup!.type).toBe(EnumIDEInfoType.backup);
			expect(backup!.available).toBe(true);
			expect(backup!.canBeSource).toBe(false);

			expect(provider.getUnavailableIDEs().find(ide => ide.name === BACKUP_IDE_NAME)).toBeUndefined();
		});

		it('should auto-create settings.json under the configured backup path when missing', async () =>
		{
			const backupPath = join(__ROOT_TEST_TEMP, 'auto-create-backup-folder');
			await provider.setBackupIDEPath(backupPath);

			expect(existsSync(join(backupPath, 'settings.json'))).toBe(true);
		});
	});

	describe('setBackupIDEPath', () =>
	{
		it('should throw when the path is not absolute', async () =>
		{
			await expect(provider.setBackupIDEPath('relative/path')).rejects.toThrow('路徑必須是絕對路徑');
		});

		it('should persist the absolute path to globalState', async () =>
		{
			const backupPath = join(__ROOT_TEST_TEMP, 'backup-settings');
			await provider.setBackupIDEPath(backupPath);

			expect(provider.getBackupIDEPath()).toBe(backupPath);
			expect(mockGlobalState.update).toHaveBeenCalledWith(EnumGlobalStateName.backupIDEPath, backupPath);
		});

		it('should allow clearing the path with an empty string', async () =>
		{
			await provider.setBackupIDEPath('');
			expect(provider.getBackupIDEPath()).toBe('');
			expect(mockGlobalState.update).toHaveBeenCalledWith(EnumGlobalStateName.backupIDEPath, '');
		});
	});

	describe('addCustomIDE name guard', () =>
	{
		it('should reject a custom IDE named like the built-in backup IDE', async () =>
		{
			await expect(
				provider.addCustomIDE('Backup', join(__ROOT_TEST_TEMP, 'custom-backup')),
			).rejects.toThrow('內建備份 IDE');
		});
	});
});