/**
 * 設定同步核心測試
 * Settings Sync Core Tests
 *
 * 僅測試 _performSyncCore 函數
 * Only tests _performSyncCore function
 */

//@noUnusedParameters:false
/// <reference types="node" />
/// <reference types="jest" />

import * as fs from 'fs';
import { getVolumeFromFs } from 'memfs-extra';
import { IdeSettingProvider } from '../src/providers/ideSettingProvider';
import { _performSyncCore, _handleIDEListByIndexList } from '../src/utils/settingsSync';
import { IDEProvider } from '../src/providers/ideProvider';

// Mock fs module using Volume API
// jest.mock('fs', () => require('memfs-extra/fs-extra'));
jest.mock('fs');

describe('Settings Sync Core', () =>
{
	const sourceSettingsJsonPath = '/mock/source/settings.json';
	const sourceSettingsPath = '/mock/source';
	const targetSettingsJsonPath = '/mock/target/settings.json';
	const targetSettingsPath = '/mock/target';

	let mockIdeProvider: IDEProvider;
	let sourceProvider: IdeSettingProvider;
	let targetProvider: IdeSettingProvider;

	// 建立 source IDE 和 target IDE
	function setupProviders(initialContent: string = '{}')
	{
		const vol = getVolumeFromFs(fs);
		// vol.reset();

		// 寫入初始設定檔
		vol.mkdirSync(sourceSettingsPath, { recursive: true });
		vol.mkdirSync(targetSettingsPath, { recursive: true });
		vol.writeFileSync(sourceSettingsJsonPath, initialContent);
		vol.writeFileSync(targetSettingsJsonPath, initialContent);

		sourceProvider = new IdeSettingProvider(sourceSettingsJsonPath, sourceSettingsPath);
		targetProvider = new IdeSettingProvider(targetSettingsJsonPath, targetSettingsPath);

		sourceProvider.load();
		targetProvider.load();

		return { sourceProvider, targetProvider };
	}

	// 建立 mock IDEProvider
	function createMockIdeProvider(sourceIdx: number, targetIdxs: number[])
	{
		const ides = [
			{
				name: 'Source IDE',
				uuid: 'source-uuid',
				settingProvider: sourceProvider,
			},
			{
				name: 'Target IDE 1',
				uuid: 'target-1-uuid',
				settingProvider: targetProvider,
			},
			{
				name: 'Target IDE 2',
				uuid: 'target-2-uuid',
				settingProvider: null as unknown as IdeSettingProvider,
			},
		];

		return {
			getIdeByIndex: jest.fn((index: number) => ides[index]),
			saveSync: jest.fn(),
		} as unknown as IDEProvider;
	}

	beforeEach(() =>
	{
		setupProviders('{}');
	});

	// 測試資料
	const testCases: Array<{ title: string; key: string; expected: unknown }> = [
		// string
		{ title: '空字串', key: 'emptyString', expected: '' },
		{ title: 'string with quotes', key: 'quoted', expected: 'He said "hello"' },
		{ title: 'string with braces', key: 'braces', expected: '{}' },
		{ title: 'editor.renderWhitespace', key: 'editor.renderWhitespace', expected: 'all' },
		// number
		{ title: 'negative number', key: 'negative', expected: -1 },
		{ title: 'zero', key: 'zero', expected: 0 },
		{ title: 'positive number', key: 'positive', expected: 42 },
		// boolean
		{ title: 'true', key: 'isEnabled', expected: true },
		{ title: 'false', key: 'isDisabled', expected: false },
		// object
		{ title: 'empty object', key: 'emptyObj', expected: {} },
		{ title: 'nested object', key: 'nested', expected: { a: { b: { c: 1 } } } },
		// array
		{ title: 'empty array', key: 'emptyArray', expected: [] },
		{ title: 'array with strings', key: 'stringArray', expected: ['a', 'b', 'c'] },
		{ title: 'array with objects', key: 'objectArray', expected: [{ name: 'IDEA' }, { name: 'WebStorm' }] },
		// IDE configurations
		{ title: 'editorjumper.ideConfigurations', key: 'editorjumper.ideConfigurations', expected: [{ name: 'IDEA', isCustom: false }] },
		{ title: 'terminal.integrated.commandsToSkipShell', key: 'terminal.integrated.commandsToSkipShell', expected: ['command1', 'command2'] },
	];

	// ==================== _performSyncCore 測試 ====================
	describe('_performSyncCore', () =>
	{
		test.each(testCases)(
			'should sync $title from source to target',
			async (testCase) =>
			{
				// 重新建立 providers
				setupProviders('{}');

				// 在 source IDE 中設置值
				sourceProvider.set([testCase.key], testCase.expected);

				// 建立 mock IDEProvider
				mockIdeProvider = createMockIdeProvider(0, [0, 1]);

				// 執行同步（使用 _performSyncCore）
				await _performSyncCore(
					mockIdeProvider,
					0, // source index
					[0, 1], // target indices
					[testCase.key],
				);

				// 驗證：target IDE 的值與 source IDE 相同
				const result = targetProvider.get([testCase.key]);
				expect(result).toEqual(testCase.expected);
			},
		);

		// ==================== 覆蓋同步測試 ====================
		test('should overwrite existing value in target IDE', async () =>
		{
			// target IDE 已有舊值
			setupProviders(JSON.stringify({ editor: { renderWhitespace: 'none' } }));

			// 在 source IDE 中設置新值
			const newValue = 'all';
			sourceProvider.set(['editor.renderWhitespace'], newValue);

			// 建立 mock IDEProvider
			mockIdeProvider = createMockIdeProvider(0, [0, 1]);

			// 執行同步
			await _performSyncCore(
				mockIdeProvider,
				0,
				[0, 1],
				['editor.renderWhitespace'],
			);

			// 驗證：同步後的值為 'all'
			const result = targetProvider.get(['editor.renderWhitespace']);
			expect(result).toBe('all');
		});

		// ==================== null 和 undefined 同步測試 ====================
		test('should sync null value', async () =>
		{
			setupProviders('{}');

			sourceProvider.set(['nullValue'], null);

			mockIdeProvider = createMockIdeProvider(0, [0, 1]);

			await _performSyncCore(
				mockIdeProvider,
				0,
				[0, 1],
				['nullValue'],
			);

			expect(targetProvider.get(['nullValue'])).toBe(null);
		});

		test('should sync undefined value', async () =>
		{
			setupProviders('{}');

			sourceProvider.set(['undefinedValue'], undefined);

			mockIdeProvider = createMockIdeProvider(0, [0, 1]);

			await _performSyncCore(
				mockIdeProvider,
				0,
				[0, 1],
				['undefinedValue'],
			);

			// 注意：當 value 為 undefined 時，不會寫入
			expect(targetProvider.get(['undefinedValue'])).toBeUndefined();
		});

		// ==================== 多個設定鍵同步測試 ====================
		test('should sync multiple settings at once', async () =>
		{
			setupProviders('{}');

			// 設置多個設定
			sourceProvider.set(['key1'], 'value1');
			sourceProvider.set(['key2'], 'value2');
			sourceProvider.set(['key3'], { nested: 'object' });

			mockIdeProvider = createMockIdeProvider(0, [0, 1]);

			// 執行同步多個設定
			await _performSyncCore(
				mockIdeProvider,
				0,
				[0, 1],
				['key1', 'key2', 'key3'],
			);

			// 驗證每個設定都正確同步
			expect(targetProvider.get(['key1'])).toBe('value1');
			expect(targetProvider.get(['key2'])).toBe('value2');
			expect(targetProvider.get(['key3'])).toEqual({ nested: 'object' });
		});

		// ==================== saveSync 呼叫測試 ====================
		test('should call saveSync on ideProvider', async () =>
		{
			setupProviders('{}');

			sourceProvider.set(['key'], 'value');

			mockIdeProvider = createMockIdeProvider(0, [0, 1]);

			await _performSyncCore(
				mockIdeProvider,
				0,
				[0, 1],
				['key'],
			);

			// 驗證 saveSync 被呼叫
			expect(mockIdeProvider.saveSync).toHaveBeenCalledWith(0, [0, 1]);
		});
	});

	// ==================== _handleIDEListByIndexList 測試 ====================
	describe('_handleIDEListByIndexList', () =>
	{
		it('should filter out source IDE from targets', () =>
		{
			// 建立 mock IDEProvider
			const mockIde0 = {
				name: 'IDE 0',
				settingProvider: {} as IdeSettingProvider,
			};
			const mockIde1 = {
				name: 'IDE 1',
				settingProvider: {} as IdeSettingProvider,
			};
			const mockIde2 = {
				name: 'IDE 2',
				settingProvider: {} as IdeSettingProvider,
			};

			const mockIdeProvider = {
				getIdeByIndex: jest.fn((index: number) =>
				{
					switch (index)
					{
						case 0: return mockIde0;
						case 1: return mockIde1;
						case 2: return mockIde2;
						default: return undefined;
					}
				}),
			} as unknown as IDEProvider;

			// 從 index 0 同步到 index 0, 1, 2
			// 預期結果：source = IDE 0, targets = [IDE 1, IDE 2]
			const result = _handleIDEListByIndexList(mockIdeProvider, 0, [0, 1, 2], (info) => info.settingProvider);

			expect(result.sourceIDE).toBe(mockIde0.settingProvider);
			expect(result.targetIDEs).toHaveLength(2);
			expect(result.targetIDEs).toContain(mockIde1.settingProvider);
			expect(result.targetIDEs).toContain(mockIde2.settingProvider);
		});

		it('should return empty target array when only source is selected', () =>
		{
			const mockIde0 = {
				name: 'IDE 0',
				settingProvider: {} as IdeSettingProvider,
			};

			const mockIdeProvider = {
				getIdeByIndex: jest.fn((index: number) =>
				{
					if (index === 0) return mockIde0;
					return undefined;
				}),
			} as unknown as IDEProvider;

			// 只選擇 source (index 0)，沒有 targets
			const result = _handleIDEListByIndexList(mockIdeProvider, 0, [0], (info) => info.settingProvider);

			expect(result.sourceIDE).toBe(mockIde0.settingProvider);
			expect(result.targetIDEs).toHaveLength(0);
		});
	});
});
