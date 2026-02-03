import { stat } from 'node:fs/promises';
import { join, sep } from 'node:path';
import { useEnv } from '@directus/env';
import type { Driver } from '@directus/storage';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getExtensionsPath } from '../get-extensions-path.js';
import { compareFileMetadata, fsStat, getSyncPaths, pathDepth } from './utils.js';

vi.mock('node:fs/promises');
vi.mock('../get-extensions-path.js');
vi.mock('@directus/env');

describe('extensions sync utils', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('pathDepth', () => {
		test('should return 0 for path with no separators', () => {
			expect(pathDepth('file.txt')).toBe(0);
			expect(pathDepth('')).toBe(0);
		});

		test('should return correct depth for nested path', () => {
			expect(pathDepth(`folder${sep}file.txt`)).toBe(1);
			expect(pathDepth(`folder1${sep}folder2${sep}folder3${sep}file.txt`)).toBe(3);
		});
	});

	describe('fsStat', () => {
		test('should return size and modified date when file exists', async () => {
			const mockDate = new Date('2025-01-01T00:00:00Z');
			const mockStat = { size: 1024, mtime: mockDate };

			vi.mocked(stat).mockResolvedValue(mockStat as any);

			const result = await fsStat('/path/to/file.txt');
			expect(result).toEqual({ size: 1024, modified: mockDate });
		});

		test('should return null when stat throws any error', async () => {
			vi.mocked(stat).mockRejectedValue(new Error('File not found'));

			const result = await fsStat('/path/to/file.txt');
			expect(result).toBeNull();
		});
	});

	describe('getSyncPaths', () => {
		const mockLocalPath = '/local/extensions';
		const mockRemotePath = '/remote/extensions';

		beforeEach(() => {
			vi.mocked(getExtensionsPath).mockReturnValue(mockLocalPath);
			vi.mocked(useEnv).mockReturnValue({ EXTENSIONS_PATH: mockRemotePath });
		});

		test('should return root paths when partialPath is undefined', () => {
			const result = getSyncPaths(undefined);

			expect(result).toEqual({
				localExtensionsPath: mockLocalPath,
				remoteExtensionsPath: mockRemotePath,
			});
		});

		test('should append partial path to both local and remote paths', () => {
			const result = getSyncPaths('hooks/my-hook');

			expect(result.localExtensionsPath).toBe(join(mockLocalPath, 'hooks', 'my-hook'));
			expect(result.remoteExtensionsPath).toBe(join(mockRemotePath, 'hooks', 'my-hook'));
		});

		test('should sanitize relative path correctly', () => {
			const result = getSyncPaths('./../path/to/file.js');

			expect(result.localExtensionsPath).toBe(join(mockLocalPath, 'path', 'to', 'file.js'));
			expect(result.remoteExtensionsPath).toBe(join(mockRemotePath, 'path', 'to', 'file.js'));
		});
	});

	describe('compareFileMetadata', () => {
		const mockLocalPath = '/local/file.txt';
		const mockRemotePath = '/remote/file.txt';
		let mockDisk: Driver;

		beforeEach(() => {
			mockDisk = {
				stat: vi.fn(),
			} as unknown as Driver;
		});

		test('should return false when local file does not exist', async () => {
			vi.mocked(stat).mockRejectedValue(new Error('File not found'));

			const result = await compareFileMetadata(mockLocalPath, mockRemotePath, mockDisk);
			expect(result).toBe(false);
		});

		test('should return false when remote file does not exist', async () => {
			vi.mocked(stat).mockResolvedValue({
				size: 1024,
				mtime: new Date('2025-01-01T00:00:00Z'),
			} as any);

			vi.mocked(mockDisk.stat).mockRejectedValue(new Error('File not found'));

			const result = await compareFileMetadata(mockLocalPath, mockRemotePath, mockDisk);
			expect(result).toBe(false);
		});

		test('should return true when files have same size and remote is older', async () => {
			vi.mocked(stat).mockResolvedValue({
				size: 1024,
				mtime: new Date('2025-01-02T00:00:00Z'),
			} as any);

			vi.mocked(mockDisk.stat).mockResolvedValue({
				size: 1024,
				modified: new Date('2025-01-01T00:00:00Z'),
			} as any);

			const result = await compareFileMetadata(mockLocalPath, mockRemotePath, mockDisk);
			expect(result).toBe(true);
		});

		test('should return true when files have same size and same modified date', async () => {
			const sameDate = new Date('2025-01-01T00:00:00Z');

			vi.mocked(stat).mockResolvedValue({
				size: 1024,
				mtime: sameDate,
			} as any);

			vi.mocked(mockDisk.stat).mockResolvedValue({
				size: 1024,
				modified: sameDate,
			} as any);

			const result = await compareFileMetadata(mockLocalPath, mockRemotePath, mockDisk);
			expect(result).toBe(true);
		});

		test('should return false when files have different sizes', async () => {
			const sameDate = new Date('2025-01-01T00:00:00Z');

			vi.mocked(stat).mockResolvedValue({
				size: 1024,
				mtime: sameDate,
			} as any);

			vi.mocked(mockDisk.stat).mockResolvedValue({
				size: 2048,
				modified: sameDate,
			} as any);

			const result = await compareFileMetadata(mockLocalPath, mockRemotePath, mockDisk);
			expect(result).toBe(false);
		});

		test('should return false when remote file is newer', async () => {
			vi.mocked(stat).mockResolvedValue({
				size: 1024,
				mtime: new Date('2025-01-01T00:00:00Z'),
			} as any);

			vi.mocked(mockDisk.stat).mockResolvedValue({
				size: 1024,
				modified: new Date('2025-01-02T00:00:00Z'),
			} as any);

			const result = await compareFileMetadata(mockLocalPath, mockRemotePath, mockDisk);
			expect(result).toBe(false);
		});
	});
});
