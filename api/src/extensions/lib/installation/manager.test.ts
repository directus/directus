import { download } from '@directus/extensions-registry';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogger } from '../../../logger/index.js';
import { InstallationManager } from './manager.js';

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

describe('InstallationManager', () => {
	let manager: InstallationManager;
	let mockLogger: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		mockLogger = {
			warn: vi.fn(),
		};

		vi.mocked(useLogger).mockReturnValue(mockLogger);
		vi.mocked(mkdir).mockResolvedValue(undefined);

		// Setup successful mocks by default
		const mockReadableStream = {
			getReader: () => ({
				read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
			}),
		};

		vi.mocked(download).mockResolvedValue(mockReadableStream as any);

		vi.mocked(readFile).mockResolvedValue(
			JSON.stringify({
				name: 'test-extension',
				directus: {
					type: 'interface',
				},
			}),
		);

		manager = new InstallationManager();
	});

	describe('Errors', () => {
		test('should throw marketplace ServiceUnavailableError when download fails', async () => {
			vi.mocked(download).mockRejectedValue(new Error('Network error'));

			await expect(manager.install('test-version')).rejects.toThrowError(
				'Service "marketplace" is unavailable. Could not download the extension.',
			);
		});

		test('should throw extension ServiceUnavailableError for any non marketplace error', async () => {
			vi.mocked(mkdir).mockRejectedValue(new Error());

			await expect(manager.install('test-version')).rejects.toThrowError(
				'Service "extensions" is unavailable. Failed to extract the extension or write it to storage.',
			);
		});

		test('should always clean up temporary directory even when error occurs', async () => {
			vi.mocked(mkdir).mockRejectedValue(new Error());

			await expect(manager.install('test-version')).rejects.toThrow();

			expect(rm).toHaveBeenCalledWith('/tmp/marketplace/test-version', { recursive: true });
		});

		test('should log warning when error occurs', async () => {
			vi.mocked(download).mockRejectedValue(new Error('Test error'));

			await expect(manager.install('test-version')).rejects.toThrow();

			expect(mockLogger.warn).toHaveBeenCalled();
		});
	});
});
