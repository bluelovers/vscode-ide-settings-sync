/**
 * IDE 偵測工具測試
 * IDE Detection Utility Tests
 */

import {
	IDEDetector,
	detectIDE,
	detectIDEs,
	getDetectedIDEs,
	getUndetectedIDEs,
	detectCustomIDEs,
	detectAllIDEs,
} from '../../src/utils/ideDetector';
import { knownIDEs } from '../../src/data/knownIDEs';
import { getVolumeFromFs } from 'memfs-extra';
import fse from 'memfs-extra/fs-extra';
import fs from 'fs';
import { join } from 'upath2';
import { __ROOT_TEST_TEMP } from '../__root';
import { IDetectionConfig } from '../../src/utils/ideDetector';
import path from 'upath2';

// Type for mock IDE in tests
type MockIDE = {
	name: string;
	appFolderNames: string[];
	existsPathIndex?: number;
	defaultSettings?: Record<string, any>;
};

jest.mock('fs');

const vol2 = getVolumeFromFs(fse);
const vol = getVolumeFromFs(fs);

const mockIDEs: MockIDE[] = [
	{
		name: 'IDE1',
		appFolderNames: [
			join('IDE', 'Test1'),
		],
		existsPathIndex: 0,
	},
	{
		name: 'IDE2',
		appFolderNames: [
			join('IDE', 'Test2-not-exists'),
			join('IDE', 'Test2'),
		],
		existsPathIndex: 1,
	},
	{
		name: 'IDE3 with User subfolder',
		appFolderNames: [
			join('IDE', 'IDE3 with User subfolder'),
			join('IDE', 'IDE3 with User subfolder', 'User'),
		],
		existsPathIndex: 1,
	},
	{
		name: 'IDE4 Folder Exists No Settings',
		appFolderNames: [
			join('IDE', 'FolderExistsNoSettings'),
		],
	},
];

const mockIDEsCustom: MockIDE[] = [
	{
		name: 'Existing IDE 1',
		appFolderNames: [
			join('IDE Custom', 'ExistingIDE'),
		],
		existsPathIndex: 0,
	},
	{
		name: 'Non-existing IDE',
		appFolderNames: [
			join('IDE Custom', 'NonExistingIDE'),
		],
	},
	{
		name: 'Existing IDE 2 with User subfolder',
		appFolderNames: [
			join('IDE Custom', 'Existing IDE 2'),
			join('IDE Custom', 'Existing IDE 2', 'User'),
		],
		existsPathIndex: 1,
	},
];

const customIDEs = mockIDEsCustom.map(v =>
{
	return {
		name: v.name,
		path: v.appFolderNames[0],
	}
});

const defautDetectionConfig: IDetectionConfig = {

	logger: jest.fn(),

	userDataDir: __ROOT_TEST_TEMP,

	pathLib: {
		join(...args: string[])
		{
			// @ts-ignore
			return path.join(...args);
		},
		resolve(...args: string[])
		{
			// @ts-ignore
			return path.resolve(...args);
		},
		normalize(arg: string)
		{
			return toGitBashPath(path.normalize(arg));
		},
	},
}

mockIDEs.concat(mockIDEsCustom).forEach(ide =>
{
	ide.appFolderNames = ide.appFolderNames.map(v => toGitBashPath(v));

	if (ide.existsPathIndex !== undefined)
	{
		let path = join(defautDetectionConfig.userDataDir, ide.appFolderNames[ide.existsPathIndex], 'settings.json');
		if (!fse.existsSync(path))
		{
			vol.fromJSON({
				[path]: JSON.stringify(ide.defaultSettings || {}),
			});

			// fse.outputJSONSync(path, ide.defaultSettings || {}, {
			// 	spaces: 2,
			// });
		}
	}
});

console.dir({
	vol1: vol.toJSON(),
	vol2: vol2.toJSON(),
	mockIDEs,
	mockIDEsCustom,
}, {
	depth: 4,
});

/**
 * 建立「資料夾已存在但沒有 settings.json」的 IDE 目錄
 * Create an IDE directory where the folder exists but settings.json is absent
 *
 * 用於測試資料夾存在但尚未建立設定檔時的提示訊息
 * Used to test the hint message when the folder exists but the settings file has not been created
 */
const folderExistsNoSettingsDir = toGitBashPath(path.normalize(
	join(defautDetectionConfig.userDataDir, 'IDE', 'FolderExistsNoSettings', 'User'),
));
if (!fse.existsSync(folderExistsNoSettingsDir))
{
	vol.fromJSON({
		[join(folderExistsNoSettingsDir, '.keep')]: '',
	});
}

function toGitBashPath(inputPath: string) {
  if (!inputPath) return inputPath;

  // 1. 統一將反斜線 \ 轉為正斜線 /
  let normalized = inputPath.replace(/\\/g, '/');

  // 2. 匹配磁碟代號 (如 D:/) 並轉為 /d/
  // [A-Za-z]: 匹配磁碟代號, (.*) 匹配後面的路徑
  normalized = normalized.replace(/^([A-Za-z]):\//, (match, drive) => {
    return `/${drive.toLowerCase()}/`;
  });

  return normalized;
}

describe('IDEDetector', () =>
{
	let detector: IDEDetector;

	beforeEach(() =>
	{
		detector = new IDEDetector({
			...defautDetectionConfig,
			verbose: true,
		});
	});

	describe('constructor', () =>
	{
		it('should create detector with default config', () =>
		{
			const defaultDetector = new IDEDetector();
			expect(defaultDetector).toBeInstanceOf(IDEDetector);
		});
	});

	describe('detectIDE', () =>
	{
		it('should detect VS Code with valid path', () =>
		{
			const vsCodeConfig = knownIDEs.find(ide => ide.name === 'Visual Studio Code')!;

			const result = detector.detectIDE(vsCodeConfig);

			expect(result).toHaveProperty('name', 'Visual Studio Code');
			expect(result).toHaveProperty('detected');
			expect(result).toHaveProperty('attemptedPaths');
			expect(Array.isArray(result.attemptedPaths)).toBe(true);
		});

		it('should handle multiple folder names', () =>
		{
			const insidersConfig = knownIDEs.find(ide => ide.name === 'Visual Studio Code - Insiders')!;

			const result = detector.detectIDE(insidersConfig);

			expect(result.name).toBe('Visual Studio Code - Insiders');
			expect(result.attemptedPaths.length > 0).toBeTruthy();
		});

		it('should provide reason when not detected', () =>
		{
			const result = detector.detectIDE(mockIDEs[1] as any);

			expect(result.detected).toBe(false);
			expect(result.reason).toContain('IDE not found');
			expect(result.reason).toContain('Tried paths');
		});

		it('should provide helpful hint when folder exists but settings.json not created yet', () =>
		{
			const ide = mockIDEs.find(ide => ide.name === 'IDE4 Folder Exists No Settings')!;

			const result = detector.detectIDE(ide as any);

			expect(result.detected).toBe(false);
			expect(result.path).toBeDefined();
			expect(result.path).toContain('FolderExistsNoSettings');
			expect(result.reason).toContain('尚未建立 settings.json');
			expect(result.reason).toContain('變更任一設定');
			expect(result.reason).toContain('settings.json has not been created yet');
		});
	});

	describe('detectIDEs', () =>
	{
		it('should detect multiple IDEs', () =>
		{
			const results = detector.detectIDEs([...knownIDEs.slice(0, 2)]);

			expect(results).toHaveLength(2);
			expect(results[0]).toHaveProperty('name');
			expect(results[0]).toHaveProperty('detected');
			expect(results[1]).toHaveProperty('name');
			expect(results[1]).toHaveProperty('detected');
		});

		it('should handle empty IDE list', () =>
		{
			const results = detector.detectIDEs([]);

			expect(results).toHaveLength(0);
		});
	});

	describe('getDetectedIDEs', () =>
	{
		it('should return only detected IDEs', () =>
		{
			const detected = detector.getDetectedIDEs(mockIDEs as any);

			expect(detected.every(ide => ide.detected)).toBe(true);
		});
	});

	describe('getUndetectedIDEs', () =>
	{
		it('should return only undetected IDEs', () =>
		{
			// Mock some detection results
			jest.spyOn(detector, 'detectIDEs').mockReturnValue([
				{ name: 'IDE1', detected: true, attemptedPaths: [] },
				{ name: 'IDE2', detected: false, attemptedPaths: [] },
				{ name: 'IDE3', detected: false, attemptedPaths: [] },
			] as any);

			const undetected = detector.getUndetectedIDEs([...knownIDEs]);

			expect(undetected).toHaveLength(2);
			expect(undetected.every(ide => !ide.detected)).toBe(true);
		});
	});

	describe('logging', () =>
	{
		it('should log when verbose is true', () =>
		{
			(defautDetectionConfig.logger as jest.Mocked<any>).mockReset();

			const verboseDetector = new IDEDetector({
				...defautDetectionConfig,
				verbose: true,
			});

			verboseDetector.detectIDE(mockIDEs[0] as any);

			expect(defautDetectionConfig.logger).toHaveBeenCalled();
		});

		it('should not log when verbose is false', () =>
		{
			(defautDetectionConfig.logger as jest.Mocked<any>).mockReset();

			const quietDetector = new IDEDetector({
				...defautDetectionConfig,

				verbose: false,
			});

			quietDetector.detectIDE(mockIDEs[0] as any);

			expect(defautDetectionConfig.logger).not.toHaveBeenCalled();
		});
	});
});

describe('Convenience Functions', () =>
{
	describe('detectIDE', () =>
	{
		it('should detect single IDE using convenience function', () =>
		{
			const mockIDE: MockIDE = { name: 'Test IDE', appFolderNames: ['Test'] };
			const result = detectIDE(mockIDE as any, { verbose: false });

			expect(result).toMatchObject({
				name: 'Test IDE',
				detected: expect.any(Boolean),
			});
		});
	});

	describe('detectIDEs', () =>
	{
		it('should detect multiple IDEs using convenience function', () =>
		{
			const results = detectIDEs(mockIDEs as any);

			expect(results.length >= 2).toBeTruthy();
		});
	});

	describe('getDetectedIDEs', () =>
	{
		it('should get detected IDEs using convenience function', () =>
		{
			const detected = getDetectedIDEs(mockIDEs as any);

			expect(Array.isArray(detected)).toBe(true);
		});
	});

	describe('getUndetectedIDEs', () =>
	{
		it('should get undetected IDEs using convenience function', () =>
		{
			const undetected = getUndetectedIDEs(mockIDEs as any);

			expect(Array.isArray(undetected)).toBe(true);
		});
	});
});

describe('Integration Tests', () =>
{
	describe('Real IDE Detection', () =>
	{
		it('should handle real known IDEs structure', () =>
		{
			const results = detectIDEs([...knownIDEs], { verbose: false });

			expect(results).toHaveLength(knownIDEs.length);
			expect(results.every(result =>
				typeof result.name === 'string' &&
				typeof result.detected === 'boolean' &&
				Array.isArray(result.attemptedPaths),
			)).toBe(true);
		});

		it('should include Windsurf in known IDEs', () =>
		{
			const windsurfIDE = knownIDEs.find(ide => ide.name === 'Windsurf');
			expect(windsurfIDE).toBeDefined();
			expect(windsurfIDE?.appFolderNames).toContain('Windsurf');
		});
	});

	describe('Custom IDE Detection', () =>
	{
		it('should detect custom IDE with direct settings.json', () =>
		{
			const results = detectCustomIDEs(customIDEs, defautDetectionConfig);

			console.dir(results);

			expect(results).toHaveProperty([0, 'detected'], true);
			expect(results[0].settingsPath).toContain('settings.json');
		});

		it('should detect custom IDE with User subfolder settings.json', () =>
		{
			const results = detectCustomIDEs(customIDEs, {
				...defautDetectionConfig,
				verbose: true,
			});

			const result = results.some(result => {
				if (result.detected && result.settingsPath!.includes('User/settings.json'))
				{
					return result.detected;
				}
			});
			expect(result).toBe(true);
		});

		it('should handle non-existent custom IDE', () =>
		{
			const results = detectCustomIDEs(customIDEs, defautDetectionConfig);

			const result = results.some(result =>
			{
				if (!result.detected)
				{
					expect(result.detected).toBe(false);
					expect(result.attemptedPaths).toHaveLength(2);
					expect(result.reason).toContain('settings.json not found');

					return true;
				}
			});
			expect(result).toBe(true);
		});
	});

	describe('Integrated Detection (Known + Custom)', () =>
	{
		it('should detect both known and custom IDEs', () =>
		{
			const results = detectAllIDEs([...knownIDEs], customIDEs, defautDetectionConfig);

			expect(results.knownResults).toHaveLength(knownIDEs.length);
			expect(results.customResults.length > 0).toBeTruthy();
			expect(results.allResults).toHaveLength(knownIDEs.length + customIDEs.length);

			expect(results.customResults.some(result => result.detected)).toBe(true);
		});

		it('should handle empty custom IDEs list', () =>
		{
			const results = detectAllIDEs([...knownIDEs], undefined, defautDetectionConfig);

			expect(results.knownResults).toHaveLength(knownIDEs.length);
			expect(results.customResults).toHaveLength(0);
			expect(results.allResults).toHaveLength(knownIDEs.length);
		});

		it('should handle empty known IDEs list with custom IDEs', () =>
		{
			const results = detectAllIDEs([], customIDEs, defautDetectionConfig);

			expect(results.knownResults).toHaveLength(0);
			expect(results.customResults.length > 0).toBeTruthy();
			expect(results.allResults.length > 0).toBeTruthy();

			expect(results.customResults.some(result => result.detected)).toBe(true);
		});
	});
});
