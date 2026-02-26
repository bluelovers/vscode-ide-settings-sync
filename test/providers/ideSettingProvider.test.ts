/**
 * IdeSettingProvider Jest Test Suite
 * 測試 IdeSettingProvider 的加載、讀寫、保存等功能
 */

import * as fs from 'fs';
import * as path from 'path';
import { IdeSettingProvider } from '../../src/providers/ideSettingProvider';
import { JsonHandler } from '../../src/utils/json';

// Mock fs module
jest.mock('fs');

describe('IdeSettingProvider', () => {
  const testSettingsPath = '/mock/settings';
  const testSettingsJsonPath = '/mock/settings/settings.json';
  const mockSettingsContent = JSON.stringify({
    editor: {
      fontSize: 14,
      fontFamily: 'Consolas',
      tabSize: 2,
    },
    workbench: {
      colorTheme: 'One Dark Pro',
    },
    files: {
      autoSave: 'off',
    },
  }, null, 2);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkExists', () => {
    it('should return true when settings.json exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      expect(provider.checkExists()).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(testSettingsJsonPath);
    });

    it('should return false when settings.json does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      expect(provider.checkExists()).toBe(false);
    });
  });

  describe('load', () => {
    it('should successfully load valid JSON settings', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockSettingsContent);

      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      const handler = provider.load();

      expect(handler).toBeInstanceOf(IdeSettingProvider);
      expect(provider.loaded()).toBe(true);
    });

    it('should throw error when settings.json does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      expect(() => provider.load()).toThrow(/沒有找到.*的設定檔案/);
    });

    it('should throw AggregateError when JSON is malformed', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{ invalid json }');

      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      expect(() => provider.load()).toThrow();
    });

    it('should reload when reload=true is passed', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockSettingsContent);

      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      // Change mock content
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ editor: { fontSize: 16 } }, null, 2)
      );

      const handler = provider.load(true);
      expect(handler).toBeInstanceOf(IdeSettingProvider);
      expect(handler.get(['editor', 'fontSize'])).toBe(16);
    });

    it('should not reload when already loaded and reload=false', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockSettingsContent);

      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      const readCallCount = (fs.readFileSync as jest.Mock).mock.calls.length;

      // Try to load again without reload flag
      provider.load(false);
      expect((fs.readFileSync as jest.Mock).mock.calls.length).toBe(readCallCount);
    });
  });

  describe('get and set operations', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockSettingsContent);
    });

    it('should get simple property value', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      const fontSize = provider.get(['editor', 'fontSize']);
      expect(fontSize).toBe(14);
    });

    it('should get nested property value', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      const fontFamily = provider.get(['editor', 'fontFamily']);
      expect(fontFamily).toBe('Consolas');
    });

    it('should return undefined for non-existent property', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      const value = provider.get(['nonexistent', 'property']);
      expect(value).toBeUndefined();
    });

    it('should set new property in staging area', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      provider.set(['new', 'property'], 'test value');

      // Verify staging has the change
      expect(provider.isStagedChanged()).toBe(true);
    });

    it('should update existing property in staging area', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      // Set new value
      provider.set(['editor', 'fontSize'], 18);

      // Get should return staged value
      expect(provider.get(['editor', 'fontSize'])).toBe(18);
    });

    it('should support method chaining for set', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      const result = provider.set(['editor', 'fontSize'], 16);
      expect(result).toBe(provider);
    });
  });

  describe('delete operations', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockSettingsContent);
    });

    it('should delete existing property', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      const deleted = provider.delete(['editor', 'fontSize']);
      expect(deleted).toBe(true);
    });

    it('should return false when deleting non-existent property', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      const deleted = provider.delete(['nonexistent', 'property']);
      expect(deleted).toBe(false);
    });

    it('should mark as staged changed after delete', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      provider.delete(['editor', 'fontSize']);
      expect(provider.isStagedChanged()).toBe(true);
    });
  });

  describe('save operations', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockSettingsContent);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    });

    it('should write changes to file system', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      provider.set(['editor', 'fontSize'], 18);
      provider.save();

      expect(fs.writeFileSync).toHaveBeenCalled();

      const callArgs = (fs.writeFileSync as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe(testSettingsJsonPath);
      expect(typeof callArgs[1]).toBe('string');
      expect(callArgs[1]).toContain('18');
      expect(callArgs[2]).toBe('utf-8');
    });

    it('should support method chaining for save', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      provider.set(['editor', 'fontSize'], 18);
      const result = provider.save();
      expect(result).toBe(provider);
    });

    it('should reload handler after save', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      provider.set(['editor', 'fontSize'], 18);
      provider.save();

      // After save, the staged changes should be applied
      expect(provider.get(['editor', 'fontSize'])).toBe(18);
    });

    it('should not write when not loaded', () => {
      (fs.readFileSync as jest.Mock).mockClear();
      (fs.writeFileSync as jest.Mock).mockClear();

      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);

      // Try to save without loading
      provider.save();

      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('data retrieval methods', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockSettingsContent);
    });

    it('should return data via valueOf', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      const data = provider.valueOf();
      expect(data).toHaveProperty('editor.fontSize');
    });

    it('should return data via getData', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      const data = provider.getData();
      expect(data).toHaveProperty('editor');
      expect(data.editor.fontSize).toBe(14);
    });

    it('should return source text', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      const sourceText = provider.getSourceText();
      expect(sourceText).toContain('fontSize');
    });

    it('should match JSON content in getData', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      const data = provider.getData();
      expect(data.editor.fontSize).toBe(14);
      expect(data.editor.fontFamily).toBe('Consolas');
      expect(data.workbench.colorTheme).toBe('One Dark Pro');
    });
  });

  describe('staging state tracking', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockSettingsContent);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    });

    it('should report no staged changes initially', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      expect(provider.isStagedChanged()).toBe(false);
    });

    it('should report staged changes after set', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      provider.set(['editor', 'fontSize'], 18);
      expect(provider.isStagedChanged()).toBe(true);
    });

    it('should report staged changes after delete', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      provider.delete(['editor', 'fontSize']);
      expect(provider.isStagedChanged()).toBe(true);
    });

    it('should clear staged changes after save', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      provider.set(['editor', 'fontSize'], 18);
      provider.save();

      // After reload, staged changes should be cleared
      expect(provider.isStagedChanged()).toBe(false);
    });
  });

  describe('loaded state tracking', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockSettingsContent);
    });

    it('should report not loaded initially', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      expect(provider.loaded()).toBe(false);
    });

    it('should report loaded after load', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();
      expect(provider.loaded()).toBe(true);
    });

    it('should maintain loaded state after multiple operations', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();
      provider.set(['editor', 'fontSize'], 18);
      expect(provider.loaded()).toBe(true);
    });
  });

  describe('complex scenarios', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockSettingsContent);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    });

    it('should handle multiple set operations and save', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      provider
        .set(['editor', 'fontSize'], 16)
        .set(['editor', 'tabSize'], 4)
        .set(['workbench', 'colorTheme'], 'GitHub Light');

      expect(provider.isStagedChanged()).toBe(true);

      provider.save();

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(provider.get(['editor', 'fontSize'])).toBe(16);
      expect(provider.get(['editor', 'tabSize'])).toBe(4);
      expect(provider.get(['workbench', 'colorTheme'])).toBe('GitHub Light');
    });

    it('should handle set and delete in sequence', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      provider.set(['editor', 'fontSize'], 18);
      provider.delete(['editor', 'fontFamily']);
      provider.save();

      expect(provider.get(['editor', 'fontSize'])).toBe(18);
      expect(provider.get(['editor', 'fontFamily'])).toBeUndefined();
    });

    it('should create new nested properties', () => {
      const provider = new IdeSettingProvider(testSettingsPath, testSettingsJsonPath);
      provider.load();

      provider.set(['new', 'nested', 'property'], 'value');

      expect(provider.get(['new', 'nested', 'property'])).toBe('value');
    });
  });
});
