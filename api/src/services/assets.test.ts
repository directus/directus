import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Driver, StorageManager } from '@directus/storage';
import type { File, SchemaOverview } from '@directus/types';
import { Readable } from 'node:stream';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('archiver');

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('./files.js', async () => {
	const { mockFilesService } = await import('../test-utils/services/files-service.js');
	return mockFilesService();
});

vi.mock('./folders.js', async () => {
	const { mockFoldersService } = await import('../test-utils/services/folders-service.js');
	return mockFoldersService();
});

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('../../src/database/index', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../storage/index.js');

import archiver, { type Archiver } from 'archiver';
import { getStorage } from '../storage/index.js';
import { AssetsService } from './assets.js';
import { FilesService } from './files.js';
import { FoldersService } from './folders.js';

describe('AssetsService', () => {
	const mockArchiver = {
		append: vi.fn(),
		finalize: vi.fn().mockResolvedValue(undefined),
	};

	const mockSchema = {
		collections: {},
		relations: [],
	} as SchemaOverview;

	let mockDriver: Partial<Driver>;
	let mockStorage: Partial<StorageManager>;

	// Common setup
	beforeEach(() => {
		vi.resetAllMocks();

		mockDriver = {
			read: vi.fn().mockResolvedValue(Readable.from(['stream'])),
			exists: vi.fn().mockResolvedValue(true),
		};

		mockStorage = {
			location: vi.fn(() => mockDriver as Driver),
		};

		vi.mocked(getStorage).mockResolvedValue(mockStorage as StorageManager);
		vi.mocked(archiver).mockReturnValue(mockArchiver as unknown as Archiver);
	});

	describe('zip (private)', () => {
		test('should throw error when no files provided', async () => {
			vi.spyOn(FilesService.prototype, 'readByQuery').mockResolvedValue([]);

			const assetsService = new AssetsService({
				schema: mockSchema,
			});

			await expect(assetsService.zipFiles([])).rejects.toThrow(InvalidPayloadError);
			await expect(assetsService.zipFiles([])).rejects.toThrow('No files found in the selected folders tree');
		});

		test('should handle files in folders with proper paths', async () => {
			const folders = new Map([
				['folder1', 'Documents'],
				['folder2', 'Documents/Photos'],
			]);

			const assetsService = new AssetsService({
				schema: mockSchema,
			});

			vi.spyOn(FoldersService.prototype, 'buildTree').mockResolvedValue(folders);

			vi.spyOn(FilesService.prototype, 'readByQuery').mockResolvedValue([
				{ id: '1', folder: 'folder1', filename_download: 'file1.txt' },
				{ id: '2', folder: 'folder2', filename_download: 'file2.txt' },
			] as File[]);

			vi.spyOn(FilesService.prototype, 'readOne').mockImplementation(
				async (key) => ({ id: key, folder: `folder${key}`, filename_download: `file${key}.txt` }) as File,
			);

			const result = await assetsService.zipFolder('folder1');
			await result.complete();

			expect(mockArchiver.append).toHaveBeenNthCalledWith(1, expect.any(Readable), {
				prefix: 'Documents',
				name: 'file1.txt',
			});

			expect(mockArchiver.append).toHaveBeenNthCalledWith(2, expect.any(Readable), {
				prefix: 'Documents/Photos',
				name: 'file2.txt',
			});
		});

		test('should deduplicate filenames within same folder', async () => {
			const folders = new Map([
				['folder1', 'Documents'],
				['folder2', 'Documents/Photos'],
			]);

			vi.spyOn(FoldersService.prototype, 'buildTree').mockResolvedValue(folders);

			vi.spyOn(FilesService.prototype, 'readByQuery').mockResolvedValue([
				{ id: '1', folder: 'folder1', filename_download: 'document.pdf' },
				{ id: '2', folder: 'folder1', filename_download: 'document.pdf' },
				{ id: '3', folder: 'folder2', filename_download: 'document.pdf' },
			] as File[]);

			vi.spyOn(FilesService.prototype, 'readOne').mockImplementationOnce(
				async () => ({ id: '1', folder: 'folder1', filename_download: 'document.pdf' }) as File,
			);

			vi.spyOn(FilesService.prototype, 'readOne').mockImplementationOnce(
				async () => ({ id: '2', folder: 'folder2', filename_download: 'document.pdf' }) as File,
			);

			vi.spyOn(FilesService.prototype, 'readOne').mockImplementationOnce(
				async () => ({ id: '3', folder: 'folder3', filename_download: 'document.pdf' }) as File,
			);

			const assetsService = new AssetsService({
				schema: mockSchema,
			});

			const result = await assetsService.zipFolder('folder1');
			await result.complete();

			expect(mockArchiver.append).toHaveBeenNthCalledWith(1, expect.any(Readable), {
				prefix: 'Documents',
				name: 'document.pdf',
			});

			expect(mockArchiver.append).toHaveBeenNthCalledWith(2, expect.any(Readable), {
				prefix: 'Documents',
				name: 'document.pdf (1)',
			});

			expect(mockArchiver.append).toHaveBeenNthCalledWith(3, expect.any(Readable), {
				prefix: 'Documents/Photos',
				name: 'document.pdf',
			});
		});

		test('should add empty folders to archive', async () => {
			const folders = new Map([
				['folder1', 'Documents'],
				['folder2', 'Documents/Photos'],
			]);

			vi.spyOn(FoldersService.prototype, 'buildTree').mockResolvedValue(folders);

			vi.spyOn(FilesService.prototype, 'readByQuery').mockResolvedValue([
				{ id: '1', folder: 'folder1', filename_download: 'document.pdf' },
			] as File[]);

			vi.spyOn(FilesService.prototype, 'readOne').mockImplementationOnce(
				async () => ({ id: '1', folder: 'folder1', filename_download: 'document.pdf' }) as File,
			);

			const assetsService = new AssetsService({
				schema: mockSchema,
			});

			const result = await assetsService.zipFolder('folder1');
			await result.complete();

			expect(mockArchiver.append).toHaveBeenNthCalledWith(1, expect.any(Readable), {
				prefix: 'Documents',
				name: 'document.pdf',
			});

			expect(mockArchiver.append).toHaveBeenNthCalledWith(2, '', {
				name: 'Documents/',
			});

			expect(mockArchiver.append).toHaveBeenNthCalledWith(3, '', {
				name: 'Documents/Photos/',
			});
		});

		test('should throw ForbiddenError if file does not exist in storage', async () => {
			vi.spyOn(FilesService.prototype, 'readByQuery').mockResolvedValue([
				{ id: 'file1', folder: null, filename_download: 'missing.txt', storage: 'local' },
			] as File[]);

			vi.spyOn(FilesService.prototype, 'readOne').mockResolvedValue({
				id: 'file1',
				folder: null,
				filename_download: 'missing.txt',
				storage: 'local',
			} as File);

			vi.mocked(mockDriver.exists!).mockResolvedValue(false);

			const assetsService = new AssetsService({
				schema: mockSchema,
			});

			const result = await assetsService.zipFiles(['file1']);

			await expect(result.complete()).rejects.toThrow(ForbiddenError);
		});

		test('should fallback to file ID with extension when filename is restricted', async () => {
			vi.spyOn(FilesService.prototype, 'readByQuery').mockResolvedValue([
				{ id: 'file1', folder: null, filename_download: null, storage: 'local' },
			] as unknown as File[]);

			vi.spyOn(FilesService.prototype, 'readOne').mockImplementationOnce(
				async () =>
					({
						id: '1',
						filename_download: 'file.txt',
						type: 'text/plain',
					}) as unknown as File,
			);

			const assetsService = new AssetsService({
				schema: mockSchema,
			});

			const result = await assetsService.zipFiles(['1']);
			await result.complete();

			expect(mockArchiver.append).toHaveBeenCalledWith(expect.any(Readable), {
				prefix: undefined,
				name: '1.txt',
			});
		});
	});

	describe('zipFiles', () => {
		test('should zip multiple files', async () => {
			const readByQuerySpy = vi.spyOn(FilesService.prototype, 'readByQuery').mockResolvedValue([
				{ id: 'file1', folder: null, filename_download: 'file1.txt' },
				{ id: 'file2', folder: null, filename_download: 'file2.txt' },
			] as File[]);

			vi.spyOn(FilesService.prototype, 'readOne').mockImplementation(
				async (key) => ({ id: key, folder: null, filename_download: `${key}.txt` }) as File,
			);

			const files = ['file1', 'file2'];

			const service = new AssetsService({
				schema: mockSchema,
			});

			const result = await service.zipFiles(files);

			await result.complete();

			expect(result.archive).toBeDefined();
			expect(result.complete).toBeDefined();

			expect(readByQuerySpy).toHaveBeenCalledWith({
				filter: {
					id: {
						_in: files,
					},
				},
				limit: -1,
			});
		});
	});

	describe('zipFolder', () => {
		test('should zip folder with files', async () => {
			const folderId = 'root-id';

			const filesServiceReadByQuery = vi.spyOn(FilesService.prototype, 'readByQuery').mockResolvedValue([
				{ id: 'file1', folder: folderId, filename_download: 'file1.txt' },
				{ id: 'file2', folder: folderId, filename_download: 'file2.txt' },
			] as File[]);

			vi.spyOn(FoldersService.prototype, 'buildTree').mockResolvedValue(new Map([['root-id', 'root']]));

			vi.spyOn(FilesService.prototype, 'readOne').mockImplementation(
				async (key) => ({ id: key, folder: null, filename_download: `${key}.txt` }) as File,
			);

			const service = new AssetsService({
				schema: mockSchema,
			});

			const result = await service.zipFolder(folderId);

			await result.complete();

			expect(result.archive).toBeDefined();
			expect(result.complete).toBeDefined();
			expect(result.metadata.name).toBe('root');

			expect(filesServiceReadByQuery).toHaveBeenCalledWith({
				filter: {
					folder: {
						_in: [folderId],
					},
				},
				limit: -1,
			});
		});
	});
});
