/**
 * 獨立 IDE Provider 測試
 * Standalone IDE Provider Tests
 */

import {
	StandaloneIDEProvider,
	createStandaloneIDEProvider,
	quickDetectIDEs,
} from '../../src/providers/standaloneIDEProvider';
import { knownIDEs } from '../../src/data/knownIDEs';

// Type for mock IDE in tests
type MockIDE = {
	name: string;
	appFolderNames: string[];
};

describe('StandaloneIDEProvider', () =>
{
	let provider: StandaloneIDEProvider;
	let mockLogger: jest.MockedFunction<(message: string) => void>;

	beforeEach(() =>
	{
		mockLogger = jest.fn();
		provider = createStandaloneIDEProvider([...knownIDEs], {
			verbose: true,
			logger: mockLogger,
		});
	});

	describe('constructor', () =>
	{
		it('should create provider with known IDEs', () =>
		{
			expect(provider).toBeInstanceOf(StandaloneIDEProvider);
		});

		it('should create provider with custom config', () =>
		{
			const customProvider = new StandaloneIDEProvider([...knownIDEs], {
				verbose: true,
				userDataDir: '/custom/path',
				logger: mockLogger,
				customIDEs: [
					{ name: 'Custom IDE', path: '/custom/ide/path' },
				],
			});
			expect(customProvider).toBeInstanceOf(StandaloneIDEProvider);
		});
	});

	describe('refresh', () =>
	{
		it('should refresh detection results', async () =>
		{
			const results = await provider.refresh();

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);
		});

		it('should clear previous results', async () =>
		{
			// First refresh
			await provider.refresh();
			const firstResults = provider.getAllIDEs();

			// Second refresh
			await provider.refresh();
			const secondResults = provider.getAllIDEs();

			// Results should be consistent
			expect(firstResults.length).toBe(secondResults.length);
		});
	});

	describe('getAllIDEs', () =>
	{
		it('should return all detected IDEs', async () =>
		{
			await provider.refresh();
			const allIDEs = provider.getAllIDEs();

			expect(Array.isArray(allIDEs)).toBe(true);
			allIDEs.forEach(ide =>
			{
				expect(ide).toHaveProperty('name');
				expect(ide).toHaveProperty('available');
				expect(ide).toHaveProperty('nativePath');
				expect(ide).toHaveProperty('settingsPath');
				expect(ide).toHaveProperty('detectionResult');
			});
		});
	});

	describe('getAvailableIDEs', () =>
	{
		it('should return only available IDEs', async () =>
		{
			await provider.refresh();
			const availableIDEs = provider.getAvailableIDEs();

			expect(Array.isArray(availableIDEs)).toBe(true);
			availableIDEs.forEach(ide =>
			{
				expect(ide.available).toBe(true);
				expect(ide.nativePath).toBeTruthy();
				expect(ide.settingsPath).toBeTruthy();
			});
		});
	});

	describe('getUnavailableIDEs', () =>
	{
		it('should return unavailable IDEs', async () =>
		{
			await provider.refresh();
			const unavailableIDEs = provider.getUnavailableIDEs();

			expect(Array.isArray(unavailableIDEs)).toBe(true);
			unavailableIDEs.forEach(ide =>
			{
				expect(ide.detected).toBe(false);
				expect(ide.reason).toBeTruthy();
			});
		});
	});

	describe('getIDEByName', () =>
	{
		it('should return IDE by name', async () =>
		{
			await provider.refresh();

			// Try to get a known IDE
			const vsCode = provider.getIDEByName('Visual Studio Code');

			if (vsCode)
			{
				expect(vsCode.name).toBe('Visual Studio Code');
				expect(vsCode.available).toBe(true);
			}
		});

		it('should return undefined for unknown IDE', async () =>
		{
			await provider.refresh();
			const unknown = provider.getIDEByName('Unknown IDE');
			expect(unknown).toBeUndefined();
		});
	});

	describe('getDetectionResult', () =>
	{
		it('should return detection result by name', async () =>
		{
			await provider.refresh();
			const result = provider.getDetectionResult('Visual Studio Code');

			if (result)
			{
				expect(result).toHaveProperty('name');
				expect(result).toHaveProperty('detected');
				expect(result).toHaveProperty('attemptedPaths');
			}
		});
	});

	describe('isIDEAvailable', () =>
	{
		it('should return availability status', async () =>
		{
			await provider.refresh();
			const isAvailable = provider.isIDEAvailable('Visual Studio Code');
			expect(typeof isAvailable).toBe('boolean');
		});
	});

	describe('getAvailableIDECount', () =>
	{
		it('should return count of available IDEs', async () =>
		{
			await provider.refresh();
			const count = provider.getAvailableIDECount();
			expect(typeof count).toBe('number');
			expect(count).toBeGreaterThanOrEqual(0);
		});
	});

	describe('getStatistics', () =>
	{
		it('should return detection statistics', async () =>
		{
			await provider.refresh();
			const stats = provider.getStatistics();

			expect(stats).toHaveProperty('total');
			expect(stats).toHaveProperty('detected');
			expect(stats).toHaveProperty('undetected');
			expect(stats).toHaveProperty('detectionRate');

			expect(typeof stats.total).toBe('number');
			expect(typeof stats.detected).toBe('number');
			expect(typeof stats.undetected).toBe('number');
			expect(typeof stats.detectionRate).toBe('number');

			expect(stats.total).toBe(stats.detected + stats.undetected);
			expect(stats.detectionRate).toBeGreaterThanOrEqual(0);
			expect(stats.detectionRate).toBeLessThanOrEqual(1);
		});
	});

	describe('exportResults', () =>
	{
		it('should export results as JSON', async () =>
		{
			await provider.refresh();
			const exported = provider.exportResults();

			expect(typeof exported).toBe('string');

			const parsed = JSON.parse(exported);
			expect(parsed).toHaveProperty('timestamp');
			expect(parsed).toHaveProperty('statistics');
			expect(parsed).toHaveProperty('availableIDEs');
			expect(parsed).toHaveProperty('unavailableIDEs');
			expect(parsed).toHaveProperty('allResults');
		});
	});

	describe('Custom IDE Management', () =>
	{
		it('should set custom IDEs', async () =>
		{
			const customIDEs = [
				{ name: 'Custom IDE 1', path: '/path/to/ide1' },
				{ name: 'Custom IDE 2', path: '/path/to/ide2' },
			];

			provider.setCustomIDEs(customIDEs);
			await provider.refresh();

			const result1 = provider.getDetectionResult('Custom IDE 1');
			const result2 = provider.getDetectionResult('Custom IDE 2');

			expect(result1).toBeDefined();
			expect(result2).toBeDefined();
		});

		it('should add custom IDE', async () =>
		{
			provider.addCustomIDE({ name: 'New Custom IDE', path: '/new/path' });
			await provider.refresh();

			const result = provider.getDetectionResult('New Custom IDE');
			expect(result).toBeDefined();
		});

		it('should remove custom IDE', async () =>
		{
			provider.addCustomIDE({ name: 'Temporary IDE', path: '/temp/path' });
			await provider.refresh();

			let result = provider.getDetectionResult('Temporary IDE');
			expect(result).toBeDefined();

			const removed = provider.removeCustomIDE('Temporary IDE');
			expect(removed).toBe(true);

			await provider.refresh();
			result = provider.getDetectionResult('Temporary IDE');
			expect(result).toBeUndefined();
		});

		it('should return false when removing non-existent IDE', () =>
		{
			const removed = provider.removeCustomIDE('Non-existent IDE');
			expect(removed).toBe(false);
		});
	});
});

describe('Convenience Functions', () =>
{
	describe('createStandaloneIDEProvider', () =>
	{
		it('should create provider instance', () =>
		{
			const provider = createStandaloneIDEProvider([...knownIDEs]);
			expect(provider).toBeInstanceOf(StandaloneIDEProvider);
		});

		it('should create provider with config', () =>
		{
			const provider = createStandaloneIDEProvider([...knownIDEs], {
				verbose: true,
			});
			expect(provider).toBeInstanceOf(StandaloneIDEProvider);
		});
	});

	describe('quickDetectIDEs', () =>
	{
		it('should quickly detect IDEs and return results', async () =>
		{
			const results = await quickDetectIDEs([...knownIDEs]);

			expect(results).toHaveProperty('available');
			expect(results).toHaveProperty('unavailable');
			expect(results).toHaveProperty('statistics');

			expect(Array.isArray(results.available)).toBe(true);
			expect(Array.isArray(results.unavailable)).toBe(true);
			expect(typeof results.statistics).toBe('object');
		});

		it('should work with custom config', async () =>
		{
			const results = await quickDetectIDEs([...knownIDEs], {
				verbose: true,
				customIDEs: [
					{ name: 'Test Custom IDE', path: '/test/path' },
				],
			});

			expect(results.available.length).toBeGreaterThanOrEqual(0);
			expect(results.unavailable.length).toBeGreaterThanOrEqual(0);
		});
	});
});

describe('Integration Tests', () =>
{
	describe('Real IDE Detection', () =>
	{
		it('should handle real known IDEs', async () =>
		{
			const provider = createStandaloneIDEProvider([...knownIDEs]);
			await provider.refresh();

			const allIDEs = provider.getAllIDEs();
			const stats = provider.getStatistics();

			expect(allIDEs.length).toBeGreaterThanOrEqual(0);
			expect(stats.total).toBe(knownIDEs.length);
		});

		it('should include Windsurf detection', async () =>
		{
			const provider = createStandaloneIDEProvider([...knownIDEs]);
			await provider.refresh();

			const windsurfResult = provider.getDetectionResult('Windsurf');
			expect(windsurfResult).toBeDefined();
			expect(windsurfResult?.name).toBe('Windsurf');
		});
	});

	describe('Export and Import', () =>
	{
		it('should export and maintain data integrity', async () =>
		{
			const testProvider = createStandaloneIDEProvider([...knownIDEs]);
			await testProvider.refresh();
			const exported = testProvider.exportResults();
			const parsed = JSON.parse(exported);

			expect(parsed.availableIDEs.length).toBe(testProvider.getAvailableIDEs().length);
			expect(parsed.unavailableIDEs.length).toBe(testProvider.getUnavailableIDEs().length);
			expect(parsed.statistics).toEqual(testProvider.getStatistics());
		});
	});

	describe('Custom IDEs Integration', () =>
	{
		it('should initialize with custom IDEs', async () =>
		{
			const customIDEs = [
				{ name: 'Custom IDE 1', path: '/path/to/custom1' },
				{ name: 'Custom IDE 2', path: '/path/to/custom2' },
			];

			const provider = createStandaloneIDEProvider([...knownIDEs], {
				customIDEs,
				verbose: false,
			});

			await provider.refresh();
			const allResults = provider.getAllIDEs();

			// Should include both known and custom IDEs
			expect(allResults.length).toBeGreaterThanOrEqual(knownIDEs.length);
		});

		it('should add and remove custom IDEs', async () =>
		{
			const provider = createStandaloneIDEProvider([...knownIDEs], {
				verbose: false,
			});

			await provider.refresh();
			const initialCount = provider.getAllIDEs().length;

			// Add custom IDE
			provider.addCustomIDE({ name: 'Test Custom IDE', path: '/test/path' });

			// Remove custom IDE
			const removed = provider.removeCustomIDE('Test Custom IDE');

			expect(removed).toBe(true);
		});

		it('should handle custom IDE detection results', async () =>
		{
			const mockFs = require('fs');
			const originalExistsSync = mockFs.existsSync;

			// Mock file system for custom IDE
			mockFs.existsSync = jest.fn((path: string) =>
			{
				if (path.includes('MockCustomIDE/settings.json'))
				{
					return true;
				}
				return false;
			});

			const customIDEs = [
				{ name: 'Mock Custom IDE', path: '/mock/path/MockCustomIDE' },
			];

			const provider = createStandaloneIDEProvider([], {
				customIDEs,
				verbose: false,
			});

			await provider.refresh();
			const availableIDEs = provider.getAvailableIDEs();
			const statistics = provider.getStatistics();

			expect(availableIDEs).toHaveLength(1);
			expect(availableIDEs[0].name).toBe('Mock Custom IDE');
			expect(statistics.total).toBe(1);
			expect(statistics.detected).toBe(1);

			// Restore original function
			mockFs.existsSync = originalExistsSync;
		});

		it('should handle mixed known and custom IDEs', async () =>
		{
			const mockFs = require('fs');
			const originalExistsSync = mockFs.existsSync;

			// Mock file system for custom IDE
			mockFs.existsSync = jest.fn((path: string) =>
			{
				if (path.includes('MixedCustomIDE/settings.json'))
				{
					return true;
				}
				// Use original for known IDEs
				return originalExistsSync(path);
			});

			const customIDEs = [
				{ name: 'Mixed Custom IDE', path: '/mixed/path/MixedCustomIDE' },
			];

			const provider = createStandaloneIDEProvider([...knownIDEs.slice(0, 2)], {
				customIDEs,
				verbose: false,
			});

			await provider.refresh();
			const statistics = provider.getStatistics();
			const availableIDEs = provider.getAvailableIDEs();
			const unavailableIDEs = provider.getUnavailableIDEs();

			// Should have 2 known + 1 custom IDEs
			expect(statistics.total).toBe(3);
			expect(availableIDEs.length + unavailableIDEs.length).toBe(3);

			// Should include the custom IDE
			const customIDE = availableIDEs.find(ide => ide.name === 'Mixed Custom IDE');
			if (customIDE)
			{
				expect(customIDE.name).toBe('Mixed Custom IDE');
			}

			// Restore original function
			mockFs.existsSync = originalExistsSync;
		});

		it('should export custom IDEs in results', async () =>
		{
			const mockFs = require('fs');
			const originalExistsSync = mockFs.existsSync;

			// Mock file system for custom IDE
			mockFs.existsSync = jest.fn((path: string) =>
			{
				if (path.includes('ExportCustomIDE/settings.json'))
				{
					return true;
				}
				return false;
			});

			const customIDEs = [
				{ name: 'Export Custom IDE', path: '/export/path/ExportCustomIDE' },
			];

			const provider = createStandaloneIDEProvider([], {
				customIDEs,
				verbose: false,
			});

			await provider.refresh();
			const exported = provider.exportResults();
			const parsed = JSON.parse(exported);

			expect(parsed.availableIDEs).toHaveLength(1);
			expect(parsed.availableIDEs[0].name).toBe('Export Custom IDE');
			expect(parsed.statistics.total).toBe(1);
			expect(parsed.statistics.detected).toBe(1);

			// Restore original function
			mockFs.existsSync = originalExistsSync;
		});
	});
});
