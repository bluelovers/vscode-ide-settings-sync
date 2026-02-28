const { join } = require('path');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/test'],
	testMatch: [
		'**/*.test.ts',
		'**/*.test.tsx',
		'**/*.spec.ts',
		'**/*.spec.tsx',
	],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
	collectCoverageFrom: [
		'src/**/*.ts',
		'src/**/*.tsx',
		'!src/**/*.d.ts',
	],
	coverageDirectory: 'coverage',
	verbose: true,
	transform: {
		'^.+\\.tsx?$': ['ts-jest', {
			tsconfig: join(__dirname, `test/tsconfig.json`),
		}],
	},
};
