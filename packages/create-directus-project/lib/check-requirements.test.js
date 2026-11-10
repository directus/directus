import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import checkRequirements, { getMinimumMajor } from './check-requirements.js';

// The minimum major is read from package.json, so the versions below are derived from it
const major = getMinimumMajor();

describe('getMinimumMajor', () => {
	it('should return the major version from engines.node in package.json', () => {
		const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

		expect(major).toBeTypeOf('number');
		expect(pkg.engines.node).toContain(String(major));
	});
});

describe('checkRequirements', () => {
	let mockExit;
	let mockConsoleError;
	let mockProcessVersions;

	beforeEach(() => {
		// Mock process.exit
		mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
			throw new Error('process.exit called');
		});

		// Mock console.error
		mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

		// Mock process.versions
		mockProcessVersions = vi.spyOn(process, 'versions', 'get').mockReturnValue({
			...process.versions,
			node: `${major}.0.0`, // default value
		});
	});

	afterEach(() => {
		// Restore mocks
		mockExit.mockRestore();
		mockConsoleError.mockRestore();
		mockProcessVersions.mockRestore();
	});

	describe('when Node.js version is supported', () => {
		it.each([`${major}.0.0`, `${major}.1.0`, `${major}.10.5`, `${major + 2}.0.0`])(
			'should pass without errors for Node.js %s',
			(node) => {
				// Arrange
				mockProcessVersions.mockReturnValue({ ...process.versions, node });

				// Act
				checkRequirements();

				// Assert
				expect(mockExit).not.toHaveBeenCalled();
				expect(mockConsoleError).not.toHaveBeenCalled();
			},
		);
	});

	describe('when Node.js version is below the minimum', () => {
		it.each(['18.17.0', '20.10.0', '22.10.5', `${major - 1}.0.0`])('should exit with code 1 for Node.js %s', (node) => {
			// Arrange
			mockProcessVersions.mockReturnValue({ ...process.versions, node });

			// Act & Assert
			expect(() => checkRequirements()).toThrow('process.exit called');
			expect(mockExit).toHaveBeenCalledWith(1);
			expect(mockConsoleError).toHaveBeenCalledTimes(3);
		});
	});

	describe('error messages', () => {
		it('should display correct error messages for wrong version', () => {
			// Arrange
			mockProcessVersions.mockReturnValue({ ...process.versions, node: '18.17.0' });

			// Act & Assert
			expect(() => checkRequirements()).toThrow('process.exit called');
			expect(mockConsoleError).toHaveBeenNthCalledWith(1, expect.stringContaining('You are running'));
			expect(mockConsoleError).toHaveBeenNthCalledWith(1, expect.stringContaining('Node.js 18.17.0'));
			expect(mockConsoleError).toHaveBeenNthCalledWith(2, expect.stringContaining('Directus requires'));
			expect(mockConsoleError).toHaveBeenNthCalledWith(2, expect.stringContaining(`Node.js ${major}`));
			expect(mockConsoleError).toHaveBeenNthCalledWith(2, expect.stringContaining('or newer'));
			expect(mockConsoleError).toHaveBeenNthCalledWith(3, 'Please adjust your Node.js version and try again.');
		});

		it('should include the actual version in error message', () => {
			// Arrange
			const testVersion = '20.5.1';
			mockProcessVersions.mockReturnValue({ ...process.versions, node: testVersion });

			// Act & Assert
			expect(() => checkRequirements()).toThrow('process.exit called');
			expect(mockConsoleError).toHaveBeenNthCalledWith(1, expect.stringContaining(testVersion));
		});
	});

	describe('edge cases', () => {
		it.each([`${major}.0.0-pre`, `${major}.1.0+build.123`])('should handle the version string %s', (node) => {
			// Arrange
			mockProcessVersions.mockReturnValue({ ...process.versions, node });

			// Act
			checkRequirements();

			// Assert
			expect(mockExit).not.toHaveBeenCalled();
			expect(mockConsoleError).not.toHaveBeenCalled();
		});
	});
});
