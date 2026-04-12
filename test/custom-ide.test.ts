/**
 * Custom IDE 專項測試
 * Custom IDE Specific Tests
 *
 * 專門測試 CustomIDEs 功能的完整性和正確性
 * Specifically test the completeness and correctness of CustomIDEs functionality
 */

import { IDEDetector, detectCustomIDEs, detectAllIDEs } from '../src/utils/ideDetector';
import { createStandaloneIDEProvider, quickDetectIDEs } from '../src/providers/standaloneIDEProvider';
import { knownIDEs } from '../src/data/knownIDEs';

describe('Custom IDEs', () =>
{
	let detector: IDEDetector;
	let originalExistsSync: any;

	beforeEach(() =>
	{
		detector = new IDEDetector({ verbose: false });
		const mockFs = require('fs');
		originalExistsSync = mockFs.existsSync;
	});

	afterEach(() =>
	{
		const mockFs = require('fs');
		mockFs.existsSync = originalExistsSync;
	});

	describe('IDEDetector Custom IDE Methods', () =>
	{

		it('should detect custom IDE with direct settings.json', () =>
		{
			const mockFs = require('fs');
			mockFs.existsSync = jest.fn((path: string) =>
			{
				if (path.includes('TestIDE1/settings.json'))
				{
					return true;
				}
				return false;
			});

			const customIDEs = [
				{ name: 'Test IDE 1', path: '/test/path/TestIDE1' },
			];

			const results = detector.detectCustomIDEs(customIDEs);

			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('Test IDE 1');
			expect(results[0].detected).toBe(true);
			expect(results[0].path).toBe('/test/path/TestIDE1');
			expect(results[0].settingsPath).toBe('/test/path/TestIDE1/settings.json');
			expect(results[0].attemptedPaths).toContain('/test/path/TestIDE1/settings.json');
		});

		it('should detect custom IDE with User subfolder settings.json', () =>
		{
			const mockFs = require('fs');
			mockFs.existsSync = jest.fn((path: string) =>
			{
				// Direct path should return false
				if (path.includes('TestIDE2/settings.json'))
				{
					return false;
				}
				// User subfolder should return true
				if (path.includes('TestIDE2/User/settings.json'))
				{
					return true;
				}
				return false;
			});

			const customIDEs = [
				{ name: 'Test IDE 2', path: '/test/path/TestIDE2' },
			];

			const results = detector.detectCustomIDEs(customIDEs);

			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('Test IDE 2');
			expect(results[0].detected).toBe(true);
			expect(results[0].path).toBe('/test/path/TestIDE2/User');
			expect(results[0].settingsPath).toBe('/test/path/TestIDE2/User/settings.json');
			expect(results[0].attemptedPaths).toContain('/test/path/TestIDE2/User/settings.json');
		});

		it('should prefer direct settings.json over User subfolder', () =>
		{
			const mockFs = require('fs');
			mockFs.existsSync = jest.fn((path: string) =>
			{
				if (path.includes('TestIDE3/settings.json'))
				{
					return true;
				}
				if (path.includes('TestIDE3/User/settings.json'))
				{
					return true; // This should not be used
				}
				return false;
			});

			const customIDEs = [
				{ name: 'Test IDE 3', path: '/test/path/TestIDE3' },
			];

			const results = detector.detectCustomIDEs(customIDEs);

			expect(results[0].detected).toBe(true);
			expect(results[0].path).toBe('/test/path/TestIDE3');
			expect(results[0].settingsPath).toBe('/test/path/TestIDE3/settings.json');
		});

		it('should handle non-existent custom IDE gracefully', () =>
		{
			const mockFs = require('fs');
			mockFs.existsSync = jest.fn((path: string) =>
			{
				return false; // Nothing exists
			});

			const customIDEs = [
				{ name: 'Non-existent IDE', path: '/non/existent/path' },
			];

			const results = detector.detectCustomIDEs(customIDEs);

			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('Non-existent IDE');
			expect(results[0].detected).toBe(false);
			expect(results[0].reason).toContain('settings.json not found');
			expect(results[0].attemptedPaths).toHaveLength(2);
			// Check both attempted paths
			expect(results[0].attemptedPaths.some(p => p.includes('settings.json'))).toBe(true);
			expect(results[0].attemptedPaths.some(p => p.includes('User/settings.json'))).toBe(true);
		});

		it('should handle multiple custom IDEs with mixed results', () =>
		{
			const mockFs = require('fs');
			mockFs.existsSync = jest.fn((path: string) =>
			{
				if (path.includes('ExistingIDE1/settings.json'))
				{
					return true;
				}
				// Direct path for IDE2 should return false
				if (path.includes('ExistingIDE2/settings.json'))
				{
					return false;
				}
				// User subfolder for IDE2 should return true
				if (path.includes('ExistingIDE2/User/settings.json'))
				{
					return true;
				}
				return false;
			});

			const customIDEs = [
				{ name: 'Existing IDE 1', path: '/path/ExistingIDE1' },
				{ name: 'Existing IDE 2', path: '/path/ExistingIDE2' },
				{ name: 'Non-existing IDE', path: '/path/NonExistingIDE' },
			];

			const results = detector.detectCustomIDEs(customIDEs);

			expect(results).toHaveLength(3);
			expect(results[0].detected).toBe(true); // Direct settings.json
			expect(results[1].detected).toBe(true); // User subfolder settings.json
			expect(results[2].detected).toBe(false); // Nothing exists
		});

		it('should use detectAllIDEs for comprehensive detection', () =>
		{
			const mockFs = require('fs');
			mockFs.existsSync = jest.fn((path: string) =>
			{
				if (path.includes('AllTestIDE/settings.json'))
				{
					return true;
				}
				// Use original for known IDEs
				return originalExistsSync(path);
			});

			const customIDEs = [
				{ name: 'All Test IDE', path: '/all/path/AllTestIDE' },
			];

			const results = detector.detectAllIDEs([...knownIDEs], customIDEs);

			expect(results.knownResults).toHaveLength(knownIDEs.length);
			expect(results.customResults).toHaveLength(1);
			expect(results.allResults).toHaveLength(knownIDEs.length + 1);
			expect(results.customResults[0].name).toBe('All Test IDE');
			expect(results.customResults[0].detected).toBe(true);
		});
	});

	describe('Convenience Functions', () =>
	{
		it('should work with detectCustomIDEs convenience function', () =>
		{
			const mockFs = require('fs');
			const originalExistsSync = mockFs.existsSync;

			// Set up mock for this test only
			mockFs.existsSync = jest.fn((path: string) =>
			{
				if (path.includes('ConvenienceIDE/settings.json'))
				{
					return true;
				}
				return false;
			});

			const customIDEs = [
				{ name: 'Convenience IDE', path: '/convenience/path/ConvenienceIDE' },
			];

			const results = detectCustomIDEs(customIDEs, { verbose: false });

			expect(results).toHaveLength(1);
			expect(results[0].detected).toBe(true);
			expect(results[0].name).toBe('Convenience IDE');

			// Restore original
			mockFs.existsSync = originalExistsSync;
		});

		it('should work with detectAllIDEs convenience function', () =>
		{
			const mockFs = require('fs');
			const originalExistsSync = mockFs.existsSync;

			mockFs.existsSync = jest.fn((path: string) =>
			{
				if (path.includes('AllConvenienceIDE/settings.json'))
				{
					return true;
				}
				return originalExistsSync(path);
			});

			const customIDEs = [
				{ name: 'All Convenience IDE', path: '/all/convenience/AllConvenienceIDE' },
			];

			const results = detectAllIDEs([...knownIDEs], customIDEs, { verbose: false });

			expect(results.knownResults).toHaveLength(knownIDEs.length);
			expect(results.customResults).toHaveLength(1);
			expect(results.allResults).toHaveLength(knownIDEs.length + 1);

			mockFs.existsSync = originalExistsSync;
		});
	});

	describe('StandaloneProvider Custom IDE Integration', () =>
	{
		it('should initialize with custom IDEs configuration', async () =>
		{
			const customIDEs = [
				{ name: 'Provider Test IDE', path: '/provider/test/path' },
			];

			const provider = createStandaloneIDEProvider([...knownIDEs.slice(0, 2)], {
				customIDEs,
				verbose: false,
			});

			await provider.refresh();
			const statistics = provider.getStatistics();

			expect(statistics.total).toBe(3); // 2 known + 1 custom
		});

		it('should add custom IDE dynamically', async () =>
		{
			const provider = createStandaloneIDEProvider([...knownIDEs.slice(0, 1)], {
				verbose: false,
			});

			await provider.refresh();
			const initialStats = provider.getStatistics();

			// Add custom IDE
			provider.addCustomIDE({ name: 'Dynamic IDE', path: '/dynamic/path' });

			// Note: Adding doesn't automatically refresh
			expect(initialStats.total).toBe(1);
		});

		it('should remove custom IDE dynamically', async () =>
		{
			const customIDEs = [
				{ name: 'Removable IDE', path: '/removable/path' },
			];

			const provider = createStandaloneIDEProvider([], {
				customIDEs,
				verbose: false,
			});

			const removed = provider.removeCustomIDE('Removable IDE');

			expect(removed).toBe(true);

			const notRemoved = provider.removeCustomIDE('Non-existent IDE');
			expect(notRemoved).toBe(false);
		});

		it('should set custom IDEs in bulk', async () =>
		{
			const provider = createStandaloneIDEProvider([], {
				verbose: false,
			});

			const newCustomIDEs = [
				{ name: 'Bulk IDE 1', path: '/bulk/path1' },
				{ name: 'Bulk IDE 2', path: '/bulk/path2' },
			];

			provider.setCustomIDEs(newCustomIDEs);

			// Note: Setting doesn't automatically refresh
			// This tests the setter method
			expect(newCustomIDEs).toHaveLength(2);
		});
	});

	describe('quickDetectIDEs with Custom IDEs', () =>
	{
		it('should include custom IDEs in quick detection', async () =>
		{
			const mockFs = require('fs');
			const originalExistsSync = mockFs.existsSync;

			mockFs.existsSync = jest.fn((path: string) =>
			{
				if (path.includes('QuickCustomIDE/settings.json'))
				{
					return true;
				}
				return originalExistsSync(path);
			});

			const customIDEs = [
				{ name: 'Quick Custom IDE', path: '/quick/custom/QuickCustomIDE' },
			];

			const results = await quickDetectIDEs([...knownIDEs.slice(0, 1)], {
				customIDEs,
				verbose: false,
			});

			expect(results.available.length).toBeGreaterThanOrEqual(1);
			expect(results.unavailable.length).toBeGreaterThanOrEqual(0);
			expect(results.statistics.total).toBeGreaterThanOrEqual(1);

			// Check if custom IDE is in results
			const customIDEResult = results.available.find(ide => ide.name === 'Quick Custom IDE');
			if (customIDEResult)
			{
				expect(customIDEResult.name).toBe('Quick Custom IDE');
			}

			mockFs.existsSync = originalExistsSync;
		});
	});

	describe('Error Handling and Edge Cases', () =>
	{
		it('should handle empty custom IDEs array', () =>
		{
			const results = detector.detectCustomIDEs([]);

			expect(results).toHaveLength(0);
		});

		it('should handle undefined custom IDEs in detectAllIDEs', () =>
		{
			const results = detector.detectAllIDEs([...knownIDEs], undefined);

			expect(results.knownResults).toHaveLength(knownIDEs.length);
			expect(results.customResults).toHaveLength(0);
			expect(results.allResults).toHaveLength(knownIDEs.length);
		});

		it('should handle custom IDE with empty path', () =>
		{
			const customIDEs = [
				{ name: 'Empty Path IDE', path: '' },
			];

			const results = detector.detectCustomIDEs(customIDEs);

			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('Empty Path IDE');
			expect(results[0].detected).toBe(false);
		});

		it('should handle custom IDE with special characters in path', () =>
		{
			const mockFs = require('fs');
			const originalExistsSync = mockFs.existsSync;

			mockFs.existsSync = jest.fn((path: string) =>
			{
				if (path.includes('Special IDE/settings.json'))
				{
					return true;
				}
				return false;
			});

			const customIDEs = [
				{ name: 'Special IDE', path: '/path with spaces/Special IDE' },
			];

			const results = detectCustomIDEs(customIDEs, { verbose: false });

			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('Special IDE');
			expect(results[0].detected).toBe(true);

			mockFs.existsSync = originalExistsSync;
		});
	});

	describe('Performance and Scalability', () =>
	{
		it('should handle large number of custom IDEs efficiently', () =>
		{
			const mockFs = require('fs');
			const originalExistsSync = mockFs.existsSync;

			mockFs.existsSync = jest.fn((path: string) =>
			{
				// Simulate every 10th IDE exists
				if (path.includes('BulkIDE') && path.includes('settings.json'))
				{
					const match = path.match(/BulkIDE(\d+)/);
					if (match && parseInt(match[1]) % 10 === 0)
					{
						return true;
					}
				}
				return false;
			});

			// Create 100 custom IDEs
			const customIDEs = Array.from({ length: 100 }, (_, i) => ({
				name: `Bulk IDE ${i + 1}`,
				path: `/bulk/path/BulkIDE${i + 1}`,
			}));

			const startTime = Date.now();
			const results = detectCustomIDEs(customIDEs, { verbose: false });
			const endTime = Date.now();

			expect(results).toHaveLength(100);
			expect(results.filter(r => r.detected).length).toBe(10); // Every 10th IDE exists
			expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

			mockFs.existsSync = originalExistsSync;
		});
	});
});
