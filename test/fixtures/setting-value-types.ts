/**
 * 設定值類型測試資料集與工具函數
 * Setting Value Types Test Fixtures and Utilities
 *
 * 可重複使用的測試資料與工具函數
 * Reusable test data and utilities
 */

import { IdeSettingProvider } from '../../src/providers/ideSettingProvider';

// ==================== 測試資料集 ====================

export interface ISettingValueTestCase
{
	/** 測試標題 */
	title: string;
	/** 設定 key（陣列格式，如 ['editor.renderWhitespace']） */
	key: string[];
	/** 預期值 */
	expected: any;
	/** 描述（可選） */
	description?: string;
}

export interface ISettingValueTestGroup
{
	/** 分組名稱 */
	name: string;
	/** 分組描述 */
	description: string;
	/** 測試用例陣列 */
	testCases: ISettingValueTestCase[];
}

export const settingValueTestGroups: ISettingValueTestGroup[] = [
	{
		name: 'string-values',
		description: '字串值類型測試',
		testCases: [
			{ title: '空字串', key: ['emptyString'], expected: '' },
			{ title: 'string with special characters: > <', key: ['specialChars'], expected: 'a > b && b < c' },
			{ title: 'string with quotes: " and \'', key: ['quoted'], expected: 'He said "hello" and she said \'hi\'' },
			{ title: 'string with braces: { }', key: ['braces'], expected: '{}' },
			{ title: 'string with colon: :', key: ['key:value'], expected: 'http://example.com:8080' },
			{ title: 'string with hyphen: -', key: ['hyphen'], expected: 'some-value-123' },
		],
	},
	{
		name: 'number-values',
		description: '數字值類型測試',
		testCases: [
			{ title: 'negative number', key: ['negative'], expected: -1 },
			{ title: 'zero', key: ['zero'], expected: 0 },
			{ title: 'positive number', key: ['positive'], expected: 42 },
		],
	},
	{
		name: 'null-undefined',
		description: 'null 和 undefined 測試',
		testCases: [
			{ title: 'null value', key: ['nullValue'], expected: null },
			{ title: 'undefined value', key: ['undefinedValue'], expected: undefined },
		],
	},
	{
		name: 'boolean-values',
		description: '布林值類型測試',
		testCases: [
			{ title: 'true', key: ['isEnabled'], expected: true },
			{ title: 'false', key: ['isDisabled'], expected: false },
		],
	},
	{
		name: 'object-values',
		description: '物件值類型測試',
		testCases: [
			{ title: 'empty object', key: ['emptyObj'], expected: {} },
			{ title: 'nested object', key: ['nested'], expected: { a: { b: { c: 1 } } } },
			{
				title: 'object with various value types',
				key: ['complex'],
				expected: { string: 'hello', number: 42, boolean: true, null: null, array: [1, 2, 3], nested: { a: 1 } },
			},
		],
	},
	{
		name: 'array-values',
		description: '陣列值類型測試',
		testCases: [
			{ title: 'empty array', key: ['emptyArray'], expected: [] },
			{ title: 'array with strings', key: ['stringArray'], expected: ['a', 'b', 'c'] },
			{
				title: 'array with objects',
				key: ['objectArray'],
				expected: [
					{ name: 'IDEA', isCustom: false },
					{ name: 'WebStorm', isCustom: false },
				],
			},
			{ title: 'array with mixed types', key: ['mixedArray'], expected: [1, 'two', true, null, { a: 1 }] },
		],
	},
	{
		name: 'ide-configurations',
		description: 'IDE 設定同步範例',
		testCases: [
			{
				title: 'editorjumper.ideConfigurations style array',
				key: ['editorjumper.ideConfigurations'],
				expected: [
					{ name: 'IDEA', isCustom: false, hidden: false, commandPath: null },
					{ name: 'WebStorm', isCustom: false, hidden: false, commandPath: null },
				],
			},
			{
				title: 'terminal.integrated.commandsToSkipShell style array',
				key: ['terminal.integrated.commandsToSkipShell'],
				expected: [
					'kilo-code.new.agentManagerOpen',
					'kilo-code.new.agentManager.showTerminal',
				],
			},
			{ title: 'editor.renderWhitespace string', key: ['editor.renderWhitespace'], expected: 'all' },
		],
	},
];

// ==================== 工具函數 ====================

export interface IIdeSettingProviderTestOptions
{
	settingsJsonPath: string;
	settingsPath?: string;
	initialContent?: string;
}

/**
 * 建立測試用的 IdeSettingProvider
 * Create test IdeSettingProvider
 *
 * @param options - 測試選項
 * @returns 已載入的 IdeSettingProvider 實例
 */
export function createTestProvider(options: IIdeSettingProviderTestOptions): IdeSettingProvider
{
	const { settingsJsonPath, settingsPath, initialContent = '{}' } = options;

	// Mock fs existsSync
	jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
	// Mock fs readFileSync
	jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(initialContent);
	// Mock fs writeFileSync
	jest.spyOn(require('fs'), 'writeFileSync').mockImplementation(() => {});

	const provider = new IdeSettingProvider(settingsJsonPath, settingsPath);
	provider.load();

	return provider;
}

/**
 * 測試設定值的同步（從 IDE A 到 IDE B）
 * Test setting value sync (from IDE A to IDE B)
 *
 * 這個測試模擬真實的同步場景：
 * 1. 從 IDE A 讀取設定值
 * 2. 同步到 IDE B
 * 3. 驗證 IDE B 的值是否與 IDE A 相同
 * 4. 檢查值是否有變化
 *
 * @param sourceProvider - 來源 IDE (IDE A)
 * @param targetProvider - 目標 IDE (IDE B)
 * @param testCase - 測試案例
 */
export function testSettingSync(
	sourceProvider: IdeSettingProvider,
	targetProvider: IdeSettingProvider,
	testCase: ISettingValueTestCase,
): void
{
	// 步驟 1：從 IDE A 讀取設定值
	const sourceValue = sourceProvider.get(testCase.key);

	// 步驟 2：模擬同步過程 - 將值寫入 IDE B
	// 這裡不應該直接用 set，而是模擬同步邏輯
	targetProvider.set(testCase.key, sourceValue);

	// 步驟 3：從 IDE B 讀取設定值
	const targetValue = targetProvider.get(testCase.key);

	// 步驟 4：驗證值是否正確同步（沒有變化）
	expect(targetValue).toEqual(sourceValue);

	// 步驟 5：驗證值是否與預期相同
	expect(targetValue).toEqual(testCase.expected);
}

/**
 * 產生所有測試分組的 describe 區塊（同步測試）
 * Generate describe blocks for all test groups (sync test)
 *
 * @param sourceOptions - 來源 IDE 測試選項
 * @param targetOptions - 目標 IDE 測試選項
 * @param testFn - 測試函數
 */
export function describeSettingValueTests(
	sourceOptions: IIdeSettingProviderTestOptions,
	targetOptions: IIdeSettingProviderTestOptions,
	testFn: (
		sourceProvider: IdeSettingProvider,
		targetProvider: IdeSettingProvider,
		testCase: ISettingValueTestCase,
	) => void,
): void
{
	for (const group of settingValueTestGroups)
	{
		describe(group.name, () =>
		{
			it.each(group.testCases)(
				'should sync $title from IDE A to IDE B',
				(testCase: ISettingValueTestCase) =>
				{
					// 建立來源 IDE (IDE A) 和目標 IDE (IDE B)
					const sourceProvider = createTestProvider(sourceOptions);
					const targetProvider = createTestProvider(targetOptions);

					// 先在來源 IDE 設定值
					sourceProvider.set(testCase.key, testCase.expected);

					// 執行同步測試
					testFn(sourceProvider, targetProvider, testCase);
				},
			);
		});
	}
}
