/**
 * IDE 偵測工具測試
 * IDE Detection Utility Tests
 */

import { IDEDetector, detectIDE, detectIDEs, getDetectedIDEs, getUndetectedIDEs, detectCustomIDEs, detectAllIDEs } from '../../src/utils/ideDetector';
import { knownIDEs } from '../../src/data/knownIDEs';

// Type for mock IDE in tests
type MockIDE = {
	name: string;
	appFolderNames: string[];
};

describe('IDEDetector', () => {
	let detector: IDEDetector;
	let mockLogger: jest.MockedFunction<(message: string) => void>;

	beforeEach(() => {
		mockLogger = jest.fn();
		detector = new IDEDetector({
			verbose: true,
			logger: mockLogger,
		});
	});

	describe('constructor', () => {
		it('should create detector with default config', () => {
			const defaultDetector = new IDEDetector();
			expect(defaultDetector).toBeInstanceOf(IDEDetector);
		});

		it('should create detector with custom config', () => {
			const customDetector = new IDEDetector({
				verbose: true,
				userDataDir: '/custom/path',
				logger: mockLogger,
			});
			expect(customDetector).toBeInstanceOf(IDEDetector);
		});
	});

	describe('detectIDE', () => {
		it('should detect VS Code with valid path', () => {
			const vsCodeConfig = knownIDEs.find(ide => ide.name === 'Visual Studio Code')!;
			
			const result = detector.detectIDE(vsCodeConfig);
			
			expect(result).toHaveProperty('name', 'Visual Studio Code');
			expect(result).toHaveProperty('detected');
			expect(result).toHaveProperty('attemptedPaths');
			expect(Array.isArray(result.attemptedPaths)).toBe(true);
		});

		it('should handle multiple folder names', () => {
			const insidersConfig = knownIDEs.find(ide => ide.name === 'Visual Studio Code - Insiders')!;
			
			const result = detector.detectIDE(insidersConfig);
			
			expect(result.name).toBe('Visual Studio Code - Insiders');
			expect(result.attemptedPaths.length).toBe(insidersConfig.appFolderNames.length);
		});

		it('should provide reason when not detected', () => {
			const mockIDE: MockIDE = {
				name: 'Test IDE',
				appFolderNames: ['NonExistentIDE'],
			};

			const result = detector.detectIDE(mockIDE as any);
			
			expect(result.detected).toBe(false);
			expect(result.reason).toContain('IDE not found');
			expect(result.reason).toContain('Tried paths');
		});
	});

	describe('detectIDEs', () => {
		it('should detect multiple IDEs', () => {
			const results = detector.detectIDEs([...knownIDEs.slice(0, 2)]);
			
			expect(results).toHaveLength(2);
			expect(results[0]).toHaveProperty('name');
			expect(results[0]).toHaveProperty('detected');
			expect(results[1]).toHaveProperty('name');
			expect(results[1]).toHaveProperty('detected');
		});

		it('should handle empty IDE list', () => {
			const results = detector.detectIDEs([]);
			
			expect(results).toHaveLength(0);
		});
	});

	describe('getDetectedIDEs', () => {
		it('should return only detected IDEs', () => {
			// Mock some detection results
			jest.spyOn(detector, 'detectIDEs').mockReturnValue([
				{ name: 'IDE1', detected: true, attemptedPaths: [] },
				{ name: 'IDE2', detected: false, attemptedPaths: [] },
				{ name: 'IDE3', detected: true, attemptedPaths: [] },
			] as any);

			const detected = detector.getDetectedIDEs([...knownIDEs]);
			
			expect(detected).toHaveLength(2);
			expect(detected.every(ide => ide.detected)).toBe(true);
		});
	});

	describe('getUndetectedIDEs', () => {
		it('should return only undetected IDEs', () => {
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

	describe('logging', () => {
		it('should log when verbose is true', () => {
			const verboseDetector = new IDEDetector({
				verbose: true,
				logger: mockLogger,
			});

			const mockIDE: MockIDE = { name: 'Test IDE', appFolderNames: ['Test'] };
			verboseDetector.detectIDE(mockIDE as any);

			expect(mockLogger).toHaveBeenCalled();
		});

		it('should not log when verbose is false', () => {
			const quietDetector = new IDEDetector({
				verbose: false,
				logger: mockLogger,
			});

			const mockIDE: MockIDE = { name: 'Test IDE', appFolderNames: ['Test'] };
			quietDetector.detectIDE(mockIDE as any);

			expect(mockLogger).not.toHaveBeenCalled();
		});
	});
});

describe('Convenience Functions', () => {
	describe('detectIDE', () => {
		it('should detect single IDE using convenience function', () => {
			const mockIDE: MockIDE = { name: 'Test IDE', appFolderNames: ['Test'] };
			const result = detectIDE(mockIDE as any, { verbose: false });
			
			expect(result).toHaveProperty('name', 'Test IDE');
			expect(result).toHaveProperty('detected');
		});
	});

	describe('detectIDEs', () => {
		it('should detect multiple IDEs using convenience function', () => {
			const mockIDEs: MockIDE[] = [
				{ name: 'IDE1', appFolderNames: ['Test1'] },
				{ name: 'IDE2', appFolderNames: ['Test2'] },
			];
			const results = detectIDEs(mockIDEs as any);
			
			expect(results).toHaveLength(2);
		});
	});

	describe('getDetectedIDEs', () => {
		it('should get detected IDEs using convenience function', () => {
			const mockIDEs: MockIDE[] = [
				{ name: 'IDE1', appFolderNames: ['Test1'] },
				{ name: 'IDE2', appFolderNames: ['Test2'] },
			];
			const detected = getDetectedIDEs(mockIDEs as any);
			
			expect(Array.isArray(detected)).toBe(true);
		});
	});

	describe('getUndetectedIDEs', () => {
		it('should get undetected IDEs using convenience function', () => {
			const mockIDEs: MockIDE[] = [
				{ name: 'IDE1', appFolderNames: ['Test1'] },
				{ name: 'IDE2', appFolderNames: ['Test2'] },
			];
			const undetected = getUndetectedIDEs(mockIDEs as any);
			
			expect(Array.isArray(undetected)).toBe(true);
		});
	});
});

describe('Integration Tests', () => {
	describe('Real IDE Detection', () => {
		it('should handle real known IDEs structure', () => {
			const results = detectIDEs([...knownIDEs], { verbose: false });
			
			expect(results).toHaveLength(knownIDEs.length);
			expect(results.every(result => 
				typeof result.name === 'string' &&
				typeof result.detected === 'boolean' &&
				Array.isArray(result.attemptedPaths)
			)).toBe(true);
		});

		it('should include Windsurf in known IDEs', () => {
			const windsurfIDE = knownIDEs.find(ide => ide.name === 'Windsurf');
			expect(windsurfIDE).toBeDefined();
			expect(windsurfIDE?.appFolderNames).toContain('Windsurf');
		});
	});

	describe('Custom IDE Detection', () => {
		it('should detect custom IDE with direct settings.json', () => {
			const mockFs = require('fs');
			const originalExistsSync = mockFs.existsSync;
			
			// Mock file system
			mockFs.existsSync = jest.fn((path: string) => {
				if (path.includes('CustomIDE1/settings.json')) {
					return true;
				}
				return false;
			});

			const customIDEs = [
				{ name: 'Custom IDE 1', path: '/path/to/CustomIDE1' },
			];

			const results = detectCustomIDEs(customIDEs, { verbose: false });
			
			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('Custom IDE 1');
			expect(results[0].detected).toBe(true);
			expect(results[0].path).toBe('/path/to/CustomIDE1');
			expect(results[0].settingsPath).toBe('/path/to/CustomIDE1/settings.json');

			// Restore original function
			mockFs.existsSync = originalExistsSync;
		});

		it('should detect custom IDE with User subfolder settings.json', () => {
			const mockFs = require('fs');
			const originalExistsSync = mockFs.existsSync;
			
			// Mock file system
			mockFs.existsSync = jest.fn((path: string) => {
				if (path.includes('CustomIDE2/User/settings.json')) {
					return true;
				}
				return false;
			});

			const customIDEs = [
				{ name: 'Custom IDE 2', path: '/path/to/CustomIDE2' },
			];

			const results = detectCustomIDEs(customIDEs, { verbose: false });
			
			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('Custom IDE 2');
			expect(results[0].detected).toBe(true);
			expect(results[0].path).toBe('/path/to/CustomIDE2/User');
			expect(results[0].settingsPath).toBe('/path/to/CustomIDE2/User/settings.json');

			// Restore original function
			mockFs.existsSync = originalExistsSync;
		});

		it('should handle non-existent custom IDE', () => {
			const customIDEs = [
				{ name: 'Non-existent IDE', path: '/non/existent/path' },
			];

			const results = detectCustomIDEs(customIDEs, { verbose: false });
			
			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('Non-existent IDE');
			expect(results[0].detected).toBe(false);
			expect(results[0].reason).toContain('settings.json not found');
			expect(results[0].attemptedPaths).toHaveLength(2);
		});

		it('should handle multiple custom IDEs', () => {
			const mockFs = require('fs');
			const originalExistsSync = mockFs.existsSync;
			
			// Mock file system - only first IDE exists
			mockFs.existsSync = jest.fn((path: string) => {
				if (path.includes('ExistingIDE/settings.json')) {
					return true;
				}
				return false;
			});

			const customIDEs = [
				{ name: 'Existing IDE', path: '/path/to/ExistingIDE' },
				{ name: 'Non-existing IDE', path: '/path/to/NonExistingIDE' },
				{ name: 'Another IDE', path: '/path/to/AnotherIDE' },
			];

			const results = detectCustomIDEs(customIDEs, { verbose: false });
			
			expect(results).toHaveLength(3);
			expect(results[0].detected).toBe(true); // Existing IDE
			expect(results[1].detected).toBe(false); // Non-existing IDE
			expect(results[2].detected).toBe(false); // Another IDE

			// Restore original function
			mockFs.existsSync = originalExistsSync;
		});
	});

	describe('Integrated Detection (Known + Custom)', () => {
		it('should detect both known and custom IDEs', () => {
			const mockFs = require('fs');
			const originalExistsSync = mockFs.existsSync;
			
			// Mock file system for custom IDEs
			mockFs.existsSync = jest.fn((path: string) => {
				if (path.includes('MyCustomIDE/settings.json')) {
					return true;
				}
				// Use original for known IDEs
				return originalExistsSync(path);
			});

			const customIDEs = [
				{ name: 'My Custom IDE', path: '/path/to/MyCustomIDE' },
			];

			const results = detectAllIDEs([...knownIDEs], customIDEs, { verbose: false });
			
			expect(results.knownResults).toHaveLength(knownIDEs.length);
			expect(results.customResults).toHaveLength(1);
			expect(results.allResults).toHaveLength(knownIDEs.length + 1);
			expect(results.customResults[0].name).toBe('My Custom IDE');
			expect(results.customResults[0].detected).toBe(true);

			// Restore original function
			mockFs.existsSync = originalExistsSync;
		});

		it('should handle empty custom IDEs list', () => {
			const results = detectAllIDEs([...knownIDEs], undefined, { verbose: false });
			
			expect(results.knownResults).toHaveLength(knownIDEs.length);
			expect(results.customResults).toHaveLength(0);
			expect(results.allResults).toHaveLength(knownIDEs.length);
		});

		it('should handle empty known IDEs list with custom IDEs', () => {
			const mockFs = require('fs');
			const originalExistsSync = mockFs.existsSync;
			
			// Mock file system
			mockFs.existsSync = jest.fn((path: string) => {
				if (path.includes('CustomOnlyIDE/settings.json')) {
					return true;
				}
				return false;
			});

			const customIDEs = [
				{ name: 'Custom Only IDE', path: '/path/to/CustomOnlyIDE' },
			];

			const results = detectAllIDEs([], customIDEs, { verbose: false });
			
			expect(results.knownResults).toHaveLength(0);
			expect(results.customResults).toHaveLength(1);
			expect(results.allResults).toHaveLength(1);
			expect(results.customResults[0].detected).toBe(true);

			// Restore original function
			mockFs.existsSync = originalExistsSync;
		});
	});
});
