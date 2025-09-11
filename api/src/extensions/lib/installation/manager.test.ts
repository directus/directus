import { ServiceUnavailableError } from '@directus/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InstallationManager } from './manager.js';

// Mock all dependencies at the top level
vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({
		TEMP_PATH: '/tmp',
		EXTENSIONS_PATH: '/extensions',
	})),
}));

vi.mock('@directus/extensions-registry', () => ({
	download: vi.fn(),
}));

vi.mock('@directus/storage-driver-local');

vi.mock('fs-extra', () => ({
	move: vi.fn(),
	remove: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
	mkdir: vi.fn(),
	readFile: vi.fn(),
	rm: vi.fn(),
}));

vi.mock('tar', () => ({
	extract: vi.fn(),
}));

vi.mock('../../../logger/index.js', () => ({
	useLogger: vi.fn(() => ({ warn: vi.fn() })),
}));

vi.mock('../../../storage/index.js', () => ({
	getStorage: vi.fn(),
}));

vi.mock('../get-extensions-path.js', () => ({
	getExtensionsPath: vi.fn(() => '/extensions'),
}));

describe('InstallationManager - Error Message Specificity', () => {
	let manager: InstallationManager;
	let mockLogger: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		mockLogger = {
			warn: vi.fn(),
		};

		const { useLogger } = vi.mocked(await import('../../../logger/index.js'));
		useLogger.mockReturnValue(mockLogger);

		const { download } = vi.mocked(await import('@directus/extensions-registry'));
		const { readFile } = vi.mocked(await import('node:fs/promises'));

		// Setup successful mocks by default
		const mockReadableStream = {
			getReader: () => ({
				read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
			}),
		};
		download.mockResolvedValue(mockReadableStream as any);

		readFile.mockResolvedValue(
			JSON.stringify({
				name: 'test-extension',
				directus: {
					type: 'interface',
				},
			}),
		);

		manager = new InstallationManager();
	});

	it('should throw ServiceUnavailableError with permission error message for EACCES', async () => {
		const { mkdir } = vi.mocked(await import('node:fs/promises'));
		const permissionError = new Error('Permission denied') as NodeJS.ErrnoException;
		permissionError.code = 'EACCES';

		mkdir.mockRejectedValue(permissionError);

		try {
			await manager.install('test-version');
			expect.fail('Expected error to be thrown');
		} catch (error) {
			expect(error).toBeInstanceOf(ServiceUnavailableError);
			expect((error as any).extensions.reason).toBe(
				'Insufficient permissions to write to the extensions directory. Please check file system permissions',
			);
			expect((error as any).extensions.service).toBe('marketplace');
		}
	});

	it('should throw ServiceUnavailableError with permission error message for EPERM', async () => {
		const { move } = vi.mocked(await import('fs-extra'));
		const permissionError = new Error('Operation not permitted') as NodeJS.ErrnoException;
		permissionError.code = 'EPERM';

		move.mockRejectedValue(permissionError);

		try {
			await manager.install('test-version');
			expect.fail('Expected error to be thrown');
		} catch (error) {
			expect(error).toBeInstanceOf(ServiceUnavailableError);
			expect((error as any).extensions.reason).toBe(
				'Insufficient permissions to write to the extensions directory. Please check file system permissions',
			);
		}
	});

	it('should throw ServiceUnavailableError with directory error message for ENOENT', async () => {
		const { mkdir } = vi.mocked(await import('node:fs/promises'));
		const noEntError = new Error('No such file or directory') as NodeJS.ErrnoException;
		noEntError.code = 'ENOENT';

		mkdir.mockRejectedValue(noEntError);

		try {
			await manager.install('test-version');
			expect.fail('Expected error to be thrown');
		} catch (error) {
			expect(error).toBeInstanceOf(ServiceUnavailableError);
			expect((error as any).extensions.reason).toBe('Extensions directory path does not exist or is inaccessible');
		}
	});

	it('should throw ServiceUnavailableError with generic error message for unknown errors', async () => {
		const { mkdir } = vi.mocked(await import('node:fs/promises'));
		const { readFile } = vi.mocked(await import('node:fs/promises'));
		const { download } = vi.mocked(await import('@directus/extensions-registry'));
		const unknownError = new Error('Network error');

		// Mock successful mkdir and readFile to ensure we get to the download error
		mkdir.mockResolvedValue(undefined);
		readFile.mockResolvedValue(
			JSON.stringify({
				name: 'test-extension',
				directus: {
					type: 'interface',
				},
			}),
		);

		download.mockRejectedValue(unknownError);

		try {
			await manager.install('test-version');
			expect.fail('Expected error to be thrown');
		} catch (error) {
			expect(error).toBeInstanceOf(ServiceUnavailableError);
			expect((error as any).extensions.reason).toBe('Could not download and extract the extension');
		}
	});

	it('should always clean up temporary directory even when error occurs', async () => {
		const { mkdir, rm } = vi.mocked(await import('node:fs/promises'));
		const permissionError = new Error('Permission denied') as NodeJS.ErrnoException;
		permissionError.code = 'EACCES';

		mkdir.mockRejectedValue(permissionError);

		await expect(manager.install('test-version')).rejects.toThrow();

		expect(rm).toHaveBeenCalledWith('/tmp/marketplace/test-version', { recursive: true });
	});

	it('should throw ServiceUnavailableError with file limit error message for EMFILE', async () => {
		const { mkdir } = vi.mocked(await import('node:fs/promises'));
		const fileLimitError = new Error('Too many open files') as NodeJS.ErrnoException;
		fileLimitError.code = 'EMFILE';

		mkdir.mockRejectedValue(fileLimitError);

		try {
			await manager.install('test-version');
			expect.fail('Expected error to be thrown');
		} catch (error) {
			expect(error).toBeInstanceOf(ServiceUnavailableError);
			expect((error as any).extensions.reason).toBe('Too many open files during extension installation');
		}
	});

	it('should throw ServiceUnavailableError with file limit error message for ENFILE', async () => {
		const { mkdir } = vi.mocked(await import('node:fs/promises'));
		const fileLimitError = new Error('File table overflow') as NodeJS.ErrnoException;
		fileLimitError.code = 'ENFILE';

		mkdir.mockRejectedValue(fileLimitError);

		try {
			await manager.install('test-version');
			expect.fail('Expected error to be thrown');
		} catch (error) {
			expect(error).toBeInstanceOf(ServiceUnavailableError);
			expect((error as any).extensions.reason).toBe('Too many open files during extension installation');
		}
	});

	it('should log warning when error occurs', async () => {
		const { mkdir } = vi.mocked(await import('node:fs/promises'));
		const { readFile } = vi.mocked(await import('node:fs/promises'));
		const { download } = vi.mocked(await import('@directus/extensions-registry'));
		const testError = new Error('Test error');

		// Mock successful mkdir and readFile to ensure we get to the download error
		mkdir.mockResolvedValue(undefined);
		readFile.mockResolvedValue(
			JSON.stringify({
				name: 'test-extension',
				directus: {
					type: 'interface',
				},
			}),
		);

		download.mockRejectedValue(testError);

		await expect(manager.install('test-version')).rejects.toThrow();

		expect(mockLogger.warn).toHaveBeenCalledWith(testError);
	});
});
