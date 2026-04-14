/**
 * 設定值類型測試資料集與工具函數
 * Setting Value Types Test Fixtures and Utilities
 *
 * 可重複使用的測試資料與工具函數
 * Reusable test data and utilities
 */

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
			{ title: 'string with underscore: _', key: ['underscore'], expected: '__some_value_123__' },
			{ title: 'string with files.eol', key: ['files.eol'], expected: '\n' },
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

