/**
 * Custom IDE 基本測試
 * Custom IDE Basic Tests
 *
 * 簡化的 CustomIDEs 功能測試，專注於核心邏輯驗證
 * Simplified CustomIDEs functionality tests, focusing on core logic validation
 */

import { IDEDetector, detectCustomIDEs } from '../src/utils/ideDetector';
import { createStandaloneIDEProvider } from '../src/providers/standaloneIDEProvider';

describe('Custom IDE Basic Tests', () => {
	it('should create IDEDetector without errors', () => {
		const detector = new IDEDetector({ verbose: false });
		expect(detector).toBeDefined();
		expect(typeof detector.detectCustomIDEs).toBe('function');
	});

	it('should handle empty custom IDEs array', () => {
		const detector = new IDEDetector({ verbose: false });
		const results = detector.detectCustomIDEs([]);
		
		expect(results).toHaveLength(0);
		expect(Array.isArray(results)).toBe(true);
	});

	it('should return correct structure for custom IDE detection', () => {
		const detector = new IDEDetector({ verbose: false });
		const customIDEs = [
			{ name: 'Test IDE', path: '/test/path' },
		];

		const results = detector.detectCustomIDEs(customIDEs);
		
		expect(results).toHaveLength(1);
		expect(results[0]).toHaveProperty('name', 'Test IDE');
		expect(results[0]).toHaveProperty('detected');
		expect(typeof results[0].detected).toBe('boolean');
		expect(results[0]).toHaveProperty('attemptedPaths');
		expect(Array.isArray(results[0].attemptedPaths)).toBe(true);
	});

	it('should work with convenience function', () => {
		const customIDEs = [
			{ name: 'Convenience Test IDE', path: '/convenience/path' },
		];

		const results = detectCustomIDEs(customIDEs, { verbose: false });
		
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe('Convenience Test IDE');
		expect(typeof results[0].detected).toBe('boolean');
	});

	it('should create StandaloneProvider with custom IDEs', () => {
		const customIDEs = [
			{ name: 'Provider Test IDE', path: '/provider/path' },
		];

		const provider = createStandaloneIDEProvider([], {
			customIDEs,
			verbose: false,
		});

		expect(provider).toBeDefined();
		expect(typeof provider.refresh).toBe('function');
		expect(typeof provider.addCustomIDE).toBe('function');
		expect(typeof provider.removeCustomIDE).toBe('function');
	});

	it('should add and remove custom IDEs from provider', () => {
		const provider = createStandaloneIDEProvider([], {
			verbose: false,
		});

		// Add custom IDE
		provider.addCustomIDE({ name: 'Dynamic IDE', path: '/dynamic/path' });
		
		// Remove custom IDE
		const removed = provider.removeCustomIDE('Dynamic IDE');
		expect(removed).toBe(true);

		// Try to remove non-existent IDE
		const notRemoved = provider.removeCustomIDE('Non-existent IDE');
		expect(notRemoved).toBe(false);
	});

	it('should set custom IDEs in bulk', () => {
		const provider = createStandaloneIDEProvider([], {
			verbose: false,
		});

		const newCustomIDEs = [
			{ name: 'Bulk IDE 1', path: '/bulk/path1' },
			{ name: 'Bulk IDE 2', path: '/bulk/path2' },
		];

		// This should not throw an error
		expect(() => {
			provider.setCustomIDEs(newCustomIDEs);
		}).not.toThrow();
	});

	it('should handle detectAllIDEs with custom IDEs', () => {
		const detector = new IDEDetector({ verbose: false });
		const customIDEs = [
			{ name: 'All Test IDE', path: '/all/test/path' },
		];

		const results = detector.detectAllIDEs([], customIDEs);
		
		expect(results).toHaveProperty('knownResults');
		expect(results).toHaveProperty('customResults');
		expect(results).toHaveProperty('allResults');
		expect(Array.isArray(results.knownResults)).toBe(true);
		expect(Array.isArray(results.customResults)).toBe(true);
		expect(Array.isArray(results.allResults)).toBe(true);
		expect(results.knownResults).toHaveLength(0);
		expect(results.customResults).toHaveLength(1);
		expect(results.allResults).toHaveLength(1);
	});

	it('should handle detectAllIDEs without custom IDEs', () => {
		const detector = new IDEDetector({ verbose: false });

		const results = detector.detectAllIDEs([], undefined);
		
		expect(results.knownResults).toHaveLength(0);
		expect(results.customResults).toHaveLength(0);
		expect(results.allResults).toHaveLength(0);
	});

	it('should have correct detection result interface', () => {
		const detector = new IDEDetector({ verbose: false });
		const customIDEs = [
			{ name: 'Interface Test IDE', path: '/interface/path' },
		];

		const results = detector.detectCustomIDEs(customIDEs);
		const result = results[0];

		// Check required properties
		expect(result).toHaveProperty('name');
		expect(result).toHaveProperty('detected');
		expect(result).toHaveProperty('attemptedPaths');

		// Check optional properties
		if (result.detected) {
			expect(result).toHaveProperty('path');
			expect(result).toHaveProperty('settingsPath');
		} else {
			expect(result).toHaveProperty('reason');
		}

		// Check types
		expect(typeof result.name).toBe('string');
		expect(typeof result.detected).toBe('boolean');
		expect(Array.isArray(result.attemptedPaths)).toBe(true);
		
		if (result.detected) {
			expect(typeof result.path).toBe('string');
			expect(typeof result.settingsPath).toBe('string');
		} else {
			expect(typeof result.reason).toBe('string');
		}
	});
});
