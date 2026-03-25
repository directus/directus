import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import checkRequirements from './check-requirements.js';

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
			node: '22.0.0', // default value
		});
	});

	afterEach(() => {
		// Restore mocks
		mockExit.mockRestore();
		mockConsoleError.mockRestore();
		mockProcessVersions.mockRestore();
	});

	describe('when Node.js version is correct', () => {
		it('should pass without errors for Node.js 22.x.x', () => {
			// Arrange
			mockProcessVersions.mockReturnValue({ ...process.versions, node: '22.0.0' });

			// Act
			checkRequirements();

			// Assert
			expect(mockExit).not.toHaveBeenCalled();
			expect(mockConsoleError).not.toHaveBeenCalled();
		});

		it('should pass without errors for Node.js 22.1.0', () => {
			// Arrange
			mockProcessVersions.mockReturnValue({ ...process.versions, node: '22.1.0' });

			// Act
			checkRequirements();

			// Assert
			expect(mockExit).not.toHaveBeenCalled();
			expect(mockConsoleError).not.toHaveBeenCalled();
		});

		it('should pass without errors for Node.js 22.10.5', () => {
			// Arrange
			mockProcessVersions.mockReturnValue({ ...process.versions, node: '22.10.5' });

			// Act
			checkRequirements();

			// Assert
			expect(mockExit).not.toHaveBeenCalled();
			expect(mockConsoleError).not.toHaveBeenCalled();
		});
	});

	describe('when Node.js version is incorrect', () => {
		it('should exit with code 1 for Node.js 18.x.x', () => {
			// Arrange
			mockProcessVersions.mockReturnValue({ ...process.versions, node: '18.17.0' });

			// Act & Assert
			expect(() => checkRequirements()).toThrow('process.exit called');
			expect(mockExit).toHaveBeenCalledWith(1);
			expect(mockConsoleError).toHaveBeenCalledTimes(3);
		});

		it('should exit with code 1 for Node.js 20.x.x', () => {
			// Arrange
			mockProcessVersions.mockReturnValue({ ...process.versions, node: '20.10.0' });

			// Act & Assert
			expect(() => checkRequirements()).toThrow('process.exit called');
			expect(mockExit).toHaveBeenCalledWith(1);
			expect(mockConsoleError).toHaveBeenCalledTimes(3);
		});

		it('should exit with code 1 for Node.js 16.x.x', () => {
			// Arrange
			mockProcessVersions.mockReturnValue({ ...process.versions, node: '16.20.0' });

			// Act & Assert
			expect(() => checkRequirements()).toThrow('process.exit called');
			expect(mockExit).toHaveBeenCalledWith(1);
			expect(mockConsoleError).toHaveBeenCalledTimes(3);
		});

		it('should exit with code 1 for Node.js 24.x.x (future version)', () => {
			// Arrange
			mockProcessVersions.mockReturnValue({ ...process.versions, node: '24.0.0' });

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
			expect(mockConsoleError).toHaveBeenNthCalledWith(2, expect.stringContaining('Node.js 22'));
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
		it('should handle version strings with pre-release identifiers', () => {
			// Arrange
			mockProcessVersions.mockReturnValue({ ...process.versions, node: '22.0.0-pre' });

			// Act
			checkRequirements();

			// Assert
			expect(mockExit).not.toHaveBeenCalled();
			expect(mockConsoleError).not.toHaveBeenCalled();
		});

		it('should handle version strings with build metadata', () => {
			// Arrange
			mockProcessVersions.mockReturnValue({ ...process.versions, node: '22.1.0+build.123' });

			// Act
			checkRequirements();

			// Assert
			expect(mockExit).not.toHaveBeenCalled();
			expect(mockConsoleError).not.toHaveBeenCalled();
		});

		it('should correctly parse single digit minor and patch versions', () => {
			// Arrange
			mockProcessVersions.mockReturnValue({ ...process.versions, node: '22.0.0' });

			// Act
			checkRequirements();

			// Assert
			expect(mockExit).not.toHaveBeenCalled();
			expect(mockConsoleError).not.toHaveBeenCalled();
		});
	});
});
