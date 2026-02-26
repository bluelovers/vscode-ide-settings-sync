/**
 * JsonHandler Jest Snapshot Testing
 * Test suite for JsonHandler using Jest with snapshot testing
 */

import { activate } from '../../src/extension';
import { JsonHandler, detectFormat, JsonHandlerError } from '../../src/utils/json';

// ============================================
// Test Utilities
// ============================================

/**
 * Create a JsonHandler instance
 */
function createHandler(json: string): JsonHandler
{
	return new JsonHandler(json);
}

// ============================================
// Test Cases
// ============================================

describe('JsonHandler', () =>
{
	describe('Basic parsing and reading', () =>
	{
		it('should correctly parse and read string property', () =>
		{
			const handler = createHandler('{"name": "test", "value": 123}');
			expect(handler.get(['name'])).toBe('test');
		});

		it('should correctly parse and read number property', () =>
		{
			const handler = createHandler('{"name": "test", "value": 123}');
			expect(handler.get(['value'])).toBe(123);
		});

		it('should return undefined for non-existent property', () =>
		{
			const handler = createHandler('{"name": "test"}');
			expect(handler.get(['nonexistent'])).toBeUndefined();
		});
	});

	describe('Write and staging functionality', () =>
	{
		it('should store new property in staging area', () =>
		{
			const handler = createHandler('{"a": 1}');
			handler.set(['b'], 2);
			expect(handler.get(['b'])).toBe(2);
		});

		it('should override original property and store in staging', () =>
		{
			const handler = createHandler('{"a": 1}');
			handler.set(['a'], 100);
			expect(handler.get(['a'])).toBe(100);
		});

		it('staging should not affect original data', () =>
		{
			const handler = createHandler('{"a": 1}');
			handler.set(['b'], 2);
			expect(handler.getSourceText()).toBe('{"a": 1}');
		});
	});

	describe('Stringify functionality', () =>
	{
		it('should correctly stringify JSON with new property', () =>
		{
			const handler = createHandler('{"a": 1}');
			handler.set(['b'], 2);
			expect(handler.stringify()).toMatchSnapshot();
		});

		it('should correctly stringify JSON with overridden property', () =>
		{
			const handler = createHandler('{"a": 1, "b": 2}');
			handler.set(['a'], 100);
			expect(handler.stringify()).toMatchSnapshot();
		});

		it('should preserve original formatting settings', () =>
		{
			const handler = createHandler('{\n  "a": 1\n}');
			handler.set(['b'], 2);
			expect(handler.stringify()).toMatchSnapshot();
		});
	});

	describe('Nested object handling', () =>
	{
		it('should correctly read nested property', () =>
		{
			const handler = createHandler('{"user": {"name": "John", "age": 30}}');
			expect(handler.get(['user', 'name'])).toBe('John');
			expect(handler.get(['user', 'age'])).toBe(30);
		});

		it('should correctly set nested new property', () =>
		{
			const handler = createHandler('{"user": {"name": "John"}}');
			handler.set(['user', 'email'], 'john@example.com');
			expect(handler.get(['user', 'email'])).toBe('john@example.com');
		});

		it('stringify should include nested new property', () =>
		{
			const handler = createHandler('{"user": {"name": "John"}}');
			handler.set(['user', 'age'], 30);
			expect(handler.stringify()).toMatchSnapshot();
		});
	});

	describe('Array handling', () =>
	{
		it('should correctly read array elements', () =>
		{
			const handler = createHandler('{"items": [1, 2, 3]}');
			expect(handler.get(['items', 0])).toBe(1);
			expect(handler.get(['items', 1])).toBe(2);
			expect(handler.get(['items', 2])).toBe(3);
		});

		it('should correctly modify array element', () =>
		{
			const handler = createHandler('{"items": [1, 2, 3]}');
			handler.set(['items', 1], 20);
			expect(handler.get(['items', 1])).toBe(20);
		});

		it('stringify should include array modification', () =>
		{
			const handler = createHandler('{"items": [1, 2, 3]}');
			handler.set(['items', 1], 20);
			expect(handler.stringify()).toMatchSnapshot();
		});
	});

	describe('Delete functionality', () =>
	{
		it('should correctly delete property', () =>
		{
			const handler = createHandler('{"a": 1, "b": 2, "c": 3}');
			expect(handler.has(['b'])).toBe(true);
			handler.delete(['b']);
			expect(handler.has(['b'])).toBe(false);
		});

		it('stringify after delete should not contain the property', () =>
		{
			const handler = createHandler('{"a": 1, "b": 2}');
			handler.delete(['b']);
			expect(handler.stringify()).toMatchSnapshot();
		});
	});

	describe('Format detection', () =>
	{
		it('should detect Tab indentation', () =>
		{
			const jsonWithTabs = '{\n\t"key": "value"\n}';
			const options = detectFormat(jsonWithTabs);
			expect(options).toMatchSnapshot({
				insertSpaces: false,
			});
		});

		it('should detect 2-space indentation', () =>
		{
			const jsonWith2Spaces = '{\n  "key": "value"\n}';
			const options = detectFormat(jsonWith2Spaces);
			expect(options).toMatchSnapshot({
				insertSpaces: true,
				tabSize: 2,
			});
		});

		it('should detect 4-space indentation', () =>
		{
			const jsonWith4Spaces = '{\n    "key": "value"\n}';
			const options = detectFormat(jsonWith4Spaces);
			expect(options).toMatchSnapshot({
				insertSpaces: true,
				tabSize: 4,
			});
		});
	});

	describe('Comment handling', () =>
	{
		it('should correctly parse JSON with comments', () =>
		{
			const jsonWithComments = `{
	// This is a comment
	"name": "test", /* Block comment */
	"value": 123
}`;
			const handler = createHandler(jsonWithComments);
			expect(handler.get(['name'])).toBe('test');
			expect(handler.get(['value'])).toBe(123);
		});

		it('stringify should preserve comments', () =>
		{
			const jsonWithComments = `{
	// This is a comment
	"name": "test"
}`;
			const handler = createHandler(jsonWithComments);
			handler.set(['value'], 123);
			expect(handler.stringify()).toMatchSnapshot();
		});
	});

	describe('Error handling', () =>
	{
		it('should tolerate invalid JSON with trailing comma', () =>
		{
			const invalidJson = '{"a": 1, }';
			const handler = createHandler(invalidJson);
			expect(handler.get(['a'])).toBe(1);
		});

		it('should record parse errors', () =>
		{
			const invalidJson = '{"a": 1, }';
			const handler = createHandler(invalidJson);
			// jsonc-parser with allowTrailingComma should not report errors
			expect(handler.getErrors()).toMatchSnapshot();
		});
	});

	describe('getData - get complete object', () =>
	{
		it('should return complete object including staged changes', () =>
		{
			const handler = createHandler('{"a": 1}');
			handler.set(['b'], 2);
			handler.set(['c'], { nested: true });
			expect(handler.getData()).toMatchSnapshot({
				a: 1,
				b: 2,
				c: { nested: true },
			});
		});
	});

	describe('Reset functionality', () =>
	{
		it('should clear staging and preserve original data', () =>
		{
			const handler = createHandler('{"a": 1}');
			handler.set(['b'], 2);
			expect(handler.get(['b'])).toBe(2);

			handler.reset();
			expect(handler.get(['b'])).toBeUndefined();
			expect(handler.get(['a'])).toBe(1);
		});
	});

	describe('Formatting options', () =>
	{
		it('should correctly set formatting options', () =>
		{
			const handler = createHandler('{"a":1}');
			handler.setFormattingOptions({ tabSize: 4, insertSpaces: true });

			const options = handler.getFormattingOptions();
			expect(options).toMatchSnapshot({
				tabSize: 4,
				insertSpaces: true,
			});
		});
	});

	describe('Complex JSON handling', () =>
	{
		it('should correctly handle deeply nested property', () =>
		{
			const complexJson = `{
	"terminal.integrated.profiles.windows": {
		"Git Bash": {
			"path": "G:\\\\msys64\\\\bin\\\\bash.exe"
		}
	},
	"editor.tabSize": 2,
	"editor.formatOnSave": true
}`;
			const handler = createHandler(complexJson);
			expect(handler.get(['terminal.integrated.profiles.windows', 'Git Bash', 'path'])).toMatchSnapshot();
			expect(handler).toMatchSnapshot();
		});

		it('should correctly stringify complex JSON', () =>
		{
			const complexJson = `{
	"editor.tabSize": 2,
	"editor.formatOnSave": true
}`;
			const handler = createHandler(complexJson);
			handler.set(['editor.fontSize'], 14);
			handler.set(['editor', 'fontSize'], 14);

			expect(handler.stringify()).toMatchSnapshot();

			expect(handler.getData()).toMatchSnapshot({
				"editor.fontSize": 14,
				"editor": {
					"fontSize": 14,
				},
			});

			expect(handler).toMatchSnapshot();
		});
	});

	describe('Staging area management', () =>
	{
		it('should correctly track staging changes', () =>
		{
			const handler = createHandler('{"a": 1}');
			handler.set(['b'], 2);
			handler.set(['c'], 3);

			expect(handler.getStagedChanges()).toHaveProperty('size', 2);
			expect(handler.getStagedChanges().entries()).toMatchSnapshot();
		});

		it('should correctly clear staging area', () =>
		{
			const handler = createHandler('{"a": 1}');
			handler.set(['b'], 2);

			expect(handler.get(['b'])).toBe(2);
			expect(handler.getStagedChanges()).toHaveProperty('size', 1);

			handler.clearStaging();

			expect(handler.getStagedChanges()).toHaveProperty('size', 0);
			expect(handler.get(['b'])).toBeUndefined();
		});
	});
});