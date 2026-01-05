import { useBus } from '../../../bus/index.js';
import { useLock } from '../../../lock/index.js';
import { useLogger } from '../../../logger/index.js';
import { getStorage } from '../../../storage/index.js';
import { getExtensionsPath } from '../get-extensions-path.js';
import { isSynchronizing, setSyncStatus, SyncStatus } from './status.js';
import { syncExtensions } from './sync.js';
import { SyncFileTracker } from './tracker.js';
import { compareFileMetadata, getSyncPaths } from './utils.js';
import { useEnv } from '@directus/env';
import type { Driver } from '@directus/storage';
import mid from 'node-machine-id';
import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({
		EXTENSIONS_LOCATION: 'test-location',
		EXTENSIONS_PATH: 'remote/extensions',
		REFRESH_TOKEN_COOKIE_DOMAIN: 'localhost',
		REFRESH_TOKEN_TTL: '7d',
		REFRESH_TOKEN_COOKIE_SECURE: false,
		REFRESH_TOKEN_COOKIE_SAME_SITE: 'strict',
		SESSION_COOKIE_DOMAIN: 'localhost',
		SESSION_COOKIE_TTL: '1d',
		SESSION_COOKIE_SECURE: false,
		SESSION_COOKIE_SAME_SITE: 'strict',
	})),
}));

vi.mock('../../../bus/index.js');
vi.mock('../../../lock/index.js');
vi.mock('../../../logger/index.js');
vi.mock('../../../storage/index.js');
vi.mock('../get-extensions-path.js');
vi.mock('./status.js');
vi.mock('./utils.js');
vi.mock('./tracker.js');
vi.mock('node:fs/promises');
vi.mock('node:fs');
vi.mock('node:stream/promises');
vi.mock('node-machine-id');

describe('syncExtensions', () => {
	let mockEnv: Record<string, any>;
	let mockLock: any;
	let mockMessenger: any;
	let mockLogger: any;
	let mockStorage: any;
	let mockDisk: Driver;
	let mockFileTracker: any;

	beforeEach(() => {
		// Mock all the things
		mockEnv = new Proxy(
			{
				EXTENSIONS_LOCATION: 'test-location',
				EXTENSIONS_PATH: 'remote/extensions',
			},
			{
				get: (target, prop) => {
					return target[prop as keyof typeof target];
				},
			},
		) as any;

		mockLock = {
			increment: vi.fn(),
			delete: vi.fn(),
		};

		mockMessenger = {
			subscribe: vi.fn(),
			publish: vi.fn(),
		};

		mockLogger = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
		};

		mockDisk = {
			exists: vi.fn(),
			list: vi.fn(),
			read: vi.fn(),
			stat: vi.fn(),
		} as any;

		mockStorage = {
			location: vi.fn().mockReturnValue(mockDisk),
		};

		mockFileTracker = {
			readLocalFiles: vi.fn().mockResolvedValue(0),
			passedFile: vi.fn().mockResolvedValue(undefined),
			cleanup: vi.fn().mockResolvedValue(undefined),
		};

		vi.mocked(useEnv).mockReturnValue(mockEnv);
		vi.mocked(useLock).mockReturnValue(mockLock);
		vi.mocked(useBus).mockReturnValue(mockMessenger);
		vi.mocked(useLogger).mockReturnValue(mockLogger);
		vi.mocked(getStorage).mockResolvedValue(mockStorage);
		vi.mocked(getExtensionsPath).mockReturnValue('/local/extensions');
		vi.mocked(isSynchronizing).mockResolvedValue(false);
		vi.mocked(mid.machineId).mockResolvedValue('test-machine-id');
		vi.mocked(SyncFileTracker).mockImplementation(() => mockFileTracker);

		vi.mocked(getSyncPaths).mockReturnValue({
			localExtensionsPath: '/local/extensions',
			remoteExtensionsPath: 'remote/extensions',
		});

		vi.mocked(mkdir).mockResolvedValue(undefined);
		vi.mocked(rm).mockResolvedValue(undefined);
		vi.mocked(setSyncStatus).mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('basic synchronization flow', () => {
		test('should exit early if already synchronizing and forceSync is not enabled', async () => {
			vi.mocked(isSynchronizing).mockResolvedValue(true);

			await syncExtensions();

			expect(mockLock.increment).not.toHaveBeenCalled();
			expect(setSyncStatus).not.toHaveBeenCalled();
		});

		test('should continue if already synchronizing but forceSync is enabled', async () => {
			vi.mocked(isSynchronizing).mockResolvedValue(true);
			mockLock.increment.mockResolvedValue(1);
			vi.mocked(mockDisk.list).mockImplementation(async function* () {});

			await syncExtensions({ forceSync: true });

			expect(mockLock.increment).toHaveBeenCalledWith('extensions-sync/test-machine-id');
		});

		test('should proceed with sync when lock increment returns 1', async () => {
			mockLock.increment.mockResolvedValue(1);
			vi.mocked(mockDisk.list).mockImplementation(async function* () {});

			await syncExtensions();

			expect(setSyncStatus).toHaveBeenCalledWith(SyncStatus.SYNCING);
		});

		test('should create local extensions path', async () => {
			mockLock.increment.mockResolvedValue(1);
			vi.mocked(mockDisk.list).mockImplementation(async function* () {});

			await syncExtensions();

			expect(mkdir).toHaveBeenCalledWith('/local/extensions', { recursive: true });
		});
	});

	describe('partial sync', () => {
		test('should use partial sync paths when partialSync option is provided', async () => {
			mockLock.increment.mockResolvedValue(1);

			vi.mocked(getSyncPaths).mockReturnValue({
				localExtensionsPath: '/local/extensions/.registry/my-extension',
				remoteExtensionsPath: 'remote/extensions/.registry/my-extension',
			});

			vi.mocked(mockDisk.exists).mockResolvedValue(true);
			vi.mocked(mockDisk.list).mockImplementation(async function* () {});

			await syncExtensions({ partialSync: '.registry/my-extension' });

			expect(getSyncPaths).toHaveBeenCalledWith('.registry/my-extension');
		});

		test('should remove local directory if remote does not exist during partial sync', async () => {
			mockLock.increment.mockResolvedValue(1);

			vi.mocked(getSyncPaths).mockReturnValue({
				localExtensionsPath: '/local/extensions/.registry/my-extension',
				remoteExtensionsPath: 'remote/extensions/.registry/my-extension',
			});

			vi.mocked(mockDisk.exists).mockResolvedValue(false);

			await syncExtensions({ partialSync: '.registry/my-extension' });

			expect(mockDisk.exists).toHaveBeenCalledWith(
				`remote${sep}extensions${sep}.registry${sep}my-extension${sep}package.json`,
			);

			expect(rm).toHaveBeenCalledWith('/local/extensions/.registry/my-extension', { recursive: true, force: true });
		});

		test('should not check remote existence during full sync', async () => {
			mockLock.increment.mockResolvedValue(1);
			vi.mocked(mockDisk.list).mockImplementation(async function* () {});

			await syncExtensions();

			expect(mockDisk.exists).not.toHaveBeenCalled();
		});
	});

	describe('file synchronization', () => {
		test('should sync files from remote to local', async () => {
			mockLock.increment.mockResolvedValue(1);

			const mockReadStream = new Readable();
			mockReadStream.push('file content');
			mockReadStream.push(null);

			vi.mocked(createWriteStream).mockReturnValue({ pipe: vi.fn() } as any);
			vi.mocked(mockDisk.read).mockResolvedValue(mockReadStream as any);
			vi.mocked(pipeline).mockResolvedValue(undefined);

			vi.mocked(mockDisk.list).mockImplementation(async function* () {
				yield 'remote/extensions/test-file.js';
			});

			await syncExtensions();

			expect(mockDisk.list).toHaveBeenCalledWith('remote/extensions');
			expect(mockFileTracker.passedFile).toHaveBeenCalledWith('test-file.js');
			expect(mockDisk.read).toHaveBeenCalledWith('remote/extensions/test-file.js');
		});

		test('should skip file sync when forceSync is false and file metadata matches', async () => {
			mockLock.increment.mockResolvedValue(1);
			mockFileTracker.readLocalFiles.mockResolvedValue(1);
			vi.mocked(compareFileMetadata).mockResolvedValue(true);

			vi.mocked(mockDisk.list).mockImplementation(async function* () {
				yield 'remote/extensions/test-file.js';
			});

			await syncExtensions();

			expect(compareFileMetadata).toHaveBeenCalled();
			expect(mockDisk.read).not.toHaveBeenCalled();
		});

		test('should sync file when forceSync is false and file metadata does not match', async () => {
			mockLock.increment.mockResolvedValue(1);
			mockFileTracker.readLocalFiles.mockResolvedValue(1);
			vi.mocked(compareFileMetadata).mockResolvedValue(false);
			vi.mocked(createWriteStream).mockReturnValue({ pipe: vi.fn() } as any);
			vi.mocked(mockDisk.read).mockResolvedValue(new Readable() as any);
			vi.mocked(pipeline).mockResolvedValue(undefined);

			vi.mocked(mockDisk.list).mockImplementation(async function* () {
				yield 'remote/extensions/test-file.js';
			});

			await syncExtensions();

			expect(compareFileMetadata).toHaveBeenCalled();
			expect(mockDisk.read).toHaveBeenCalled();
		});

		test('should always sync when forceSync is true', async () => {
			mockLock.increment.mockResolvedValue(1);
			mockFileTracker.readLocalFiles.mockResolvedValue(1);

			vi.mocked(createWriteStream).mockReturnValue({ pipe: vi.fn() } as any);
			vi.mocked(mockDisk.read).mockResolvedValue(new Readable() as any);
			vi.mocked(pipeline).mockResolvedValue(undefined);

			vi.mocked(mockDisk.list).mockImplementation(async function* () {
				yield 'remote/extensions/test-file.js';
			});

			await syncExtensions({ forceSync: true });

			expect(compareFileMetadata).not.toHaveBeenCalled();
			expect(mockDisk.read).toHaveBeenCalled();
		});

		test('should not compare metadata when no local files exist', async () => {
			mockLock.increment.mockResolvedValue(1);
			mockFileTracker.readLocalFiles.mockResolvedValue(0);

			vi.mocked(createWriteStream).mockReturnValue({ pipe: vi.fn() } as any);
			vi.mocked(mockDisk.read).mockResolvedValue(new Readable() as any);
			vi.mocked(pipeline).mockResolvedValue(undefined);

			vi.mocked(mockDisk.list).mockImplementation(async function* () {
				yield 'remote/extensions/test-file.js';
			});

			await syncExtensions();

			expect(compareFileMetadata).not.toHaveBeenCalled();
			expect(mockDisk.read).toHaveBeenCalled();
		});
	});

	describe('cleanup and finalization', () => {
		test('should release lock and publish message on success', async () => {
			mockLock.increment.mockResolvedValue(1);
			vi.mocked(mockDisk.list).mockImplementation(async function* () {});

			await syncExtensions();

			expect(mockMessenger.publish).toHaveBeenCalledWith('extensions-sync/test-machine-id', { ready: true });
			expect(mockLock.delete).toHaveBeenCalledWith('extensions-sync/test-machine-id');
			expect(setSyncStatus).toHaveBeenCalledWith(SyncStatus.IDLE);
		});

		test('should release lock and publish message even on error', async () => {
			mockLock.increment.mockResolvedValue(1);

			// eslint-disable-next-line require-yield
			vi.mocked(mockDisk.list).mockImplementation(async function* () {
				throw new Error('Storage error');
			});

			await expect(syncExtensions()).rejects.toThrow('Storage error');

			expect(mockMessenger.publish).toHaveBeenCalledWith('extensions-sync/test-machine-id', { ready: true });
			expect(mockLock.delete).toHaveBeenCalledWith('extensions-sync/test-machine-id');
			expect(setSyncStatus).toHaveBeenCalledWith(SyncStatus.IDLE);
		});

		test('should set sync status to IDLE in finally block', async () => {
			mockLock.increment.mockResolvedValue(1);
			vi.mocked(mockDisk.list).mockImplementation(async function* () {});

			await syncExtensions();

			expect(setSyncStatus).toHaveBeenCalledWith(SyncStatus.SYNCING);
			expect(setSyncStatus).toHaveBeenCalledWith(SyncStatus.IDLE);
		});
	});

	describe('error handling', () => {
		test('should handle storage location errors', async () => {
			mockLock.increment.mockResolvedValue(1);
			vi.mocked(getStorage).mockRejectedValue(new Error('Storage not configured'));

			await expect(syncExtensions()).rejects.toThrow('Storage not configured');

			// Should still cleanup
			expect(mockLock.delete).toHaveBeenCalled();
			expect(setSyncStatus).toHaveBeenCalledWith(SyncStatus.IDLE);
		});

		test('should handle file read errors gracefully', async () => {
			mockLock.increment.mockResolvedValue(1);
			vi.mocked(mockDisk.read).mockRejectedValue(new Error('File read error'));

			vi.mocked(mockDisk.list).mockImplementation(async function* () {
				yield 'remote/extensions/test-file.js';
			});

			await expect(syncExtensions()).rejects.toThrow();

			// Should still cleanup
			expect(mockLock.delete).toHaveBeenCalled();
			expect(setSyncStatus).toHaveBeenCalledWith(SyncStatus.IDLE);
		});
	});

	describe('concurrency management', () => {
		test('should process multiple files with queue', async () => {
			mockLock.increment.mockResolvedValue(1);

			vi.mocked(createWriteStream).mockReturnValue({ pipe: vi.fn() } as any);
			vi.mocked(mockDisk.read).mockResolvedValue(new Readable() as any);
			vi.mocked(pipeline).mockResolvedValue(undefined);

			vi.mocked(mockDisk.list).mockImplementation(async function* () {
				yield 'remote/extensions/file1.js';
				yield 'remote/extensions/file2.js';
				yield 'remote/extensions/file3.js';
			});

			await syncExtensions();

			expect(mockDisk.read).toHaveBeenCalledTimes(3);
			expect(pipeline).toHaveBeenCalledTimes(3);
		});
	});
});
