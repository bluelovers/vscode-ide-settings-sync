/**
 * IDE 偵測工具測試
 * IDE Detection Utility Tests
 */

import { IDEDetector, detectIDE, detectIDEs, getDetectedIDEs, getUndetectedIDEs } from '../../src/utils/ideDetector';
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
});
