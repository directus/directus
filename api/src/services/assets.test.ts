import { PassThrough } from 'node:stream';
import { Readable } from 'node:stream';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Driver, StorageManager } from '@directus/storage';
import type { Accountability } from '@directus/types';
import type { File, SchemaOverview } from '@directus/types';
import archiver, { type Archiver } from 'archiver';
import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockedFunction, test, vi } from 'vitest';
import { validateItemAccess } from '../permissions/modules/validate-access/lib/validate-item-access.js';
import { getStorage } from '../storage/index.js';
import { AssetsService } from './assets.js';
import { FilesService } from './files.js';
import { FoldersService } from './folders.js';

vi.mock('@directus/storage');
vi.mock('../permissions/modules/validate-access/lib/validate-item-access.js');
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

describe('AssetsService', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	const mockFileId = 'eff91c4f-535d-4be8-b499-8af62588d26b';

	const mockFile = {
		id: mockFileId,
		storage: 'local',
		filename_disk: 'test-file.pdf',
		filename_download: 'my-document.pdf',
		type: 'application/pdf',
		title: 'My Document',
		description: 'A test document',
		width: 1920,
		height: 1080,
		filesize: 9156,
		modified_on: '2025-09-23T19:31:49.000Z',
	};

	const createAssetsService = (accountability: Accountability) => {
		return new AssetsService({
			knex: db,
			schema: { collections: {}, relations: [] },
			accountability,
		});
	};

	beforeAll(() => {
		db = vi.mocked(knex.default({ client: MockClient }));
		tracker = createTracker(db);
	});

	beforeEach(() => {
		tracker.on.select(/directus_settings/).response([{}]);
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	describe('getAsset', () => {
		let service: AssetsService;
		let mockDriver: Partial<Driver>;
		let mockStorage: Partial<StorageManager>;

		beforeEach(() => {
			mockDriver = {
				exists: vi.fn().mockResolvedValue(true),
				read: vi.fn().mockResolvedValue(new PassThrough()),
				stat: vi.fn().mockResolvedValue({ size: mockFile.filesize }),
			};

			mockStorage = {
				location: vi.fn(() => mockDriver as Driver),
			};

			vi.mocked(getStorage).mockResolvedValue(mockStorage as StorageManager);

			vi.mocked(validateItemAccess).mockResolvedValue({
				accessAllowed: true,
				allowedRootFields: ['*'],
			});
		});

		describe('field filtering for non-admin users', () => {
			it('should filter out fields that the user does not have permission to see', async () => {
				const accountability: Accountability = {
					user: 'test-user-id',
					role: 'test-role-id',
					roles: ['test-role-id'],
					admin: false,
					app: false,
					ip: '127.0.0.1',
				};

				service = createAssetsService(accountability);

				vi.mocked(FilesService.prototype.readOne).mockResolvedValue(mockFile as any);

				vi.mocked(validateItemAccess).mockResolvedValue({
					accessAllowed: true,
					allowedRootFields: ['id', 'type', 'title'],
				});

				const result = await service.getAsset(mockFileId);

				expect(result.file.type).toBe(mockFile.type);
				expect(result.file.filename_download).toBeUndefined();
				expect(result.file.title).toBe(mockFile.title);
			});

			it('should keep all fields when user has full access (*)', async () => {
				const accountability: Accountability = {
					user: 'test-user-id',
					role: 'test-role-id',
					roles: ['test-role-id'],
					admin: false,
					app: false,
					ip: '127.0.0.1',
				};

				service = createAssetsService(accountability);

				vi.mocked(FilesService.prototype.readOne).mockResolvedValue(mockFile as any);

				vi.mocked(validateItemAccess).mockResolvedValue({
					accessAllowed: true,
					allowedRootFields: ['*'],
				});

				const result = await service.getAsset(mockFileId);

				expect(result.file).toEqual(mockFile);
			});
		});

		describe('admin users', () => {
			it('should not filter any fields for admin users', async () => {
				const accountability: Accountability = {
					user: 'admin-user-id',
					role: 'admin-role-id',
					roles: ['admin-role-id'],
					admin: true,
					app: false,
					ip: '127.0.0.1',
				};

				service = createAssetsService(accountability);

				vi.mocked(FilesService.prototype.readOne).mockResolvedValue(mockFile as any);

				const result = await service.getAsset(mockFileId);

				expect(result.file).toEqual(mockFile);

				expect(validateItemAccess).not.toHaveBeenCalled();
			});
		});

		describe('system public assets', () => {
			it('should not filter fields for system public assets (logo, favicon, etc.)', async () => {
				const logoFileId = '550e8400-e29b-41d4-a716-446655440000';

				const accountability: Accountability = {
					user: null,
					role: null,
					roles: [],
					admin: false,
					app: false,
					ip: '127.0.0.1',
				};

				service = createAssetsService(accountability);

				tracker.reset();
				tracker.on.select(/directus_settings/).response([{ project_logo: logoFileId }]);

				const logoFile = { ...mockFile, id: logoFileId } as any;
				vi.mocked(FilesService.prototype.readOne).mockResolvedValue(logoFile);

				const result = await service.getAsset(logoFileId);

				expect(result.file).toEqual(logoFile);

				expect(validateItemAccess).not.toHaveBeenCalled();
			});
		});

		describe('access validation', () => {
			it('should call validateItemAccess with correct parameters', async () => {
				const accountability: Accountability = {
					user: 'test-user-id',
					role: 'test-role-id',
					roles: ['test-role-id'],
					admin: false,
					app: false,
					ip: '127.0.0.1',
				};

				service = createAssetsService(accountability);

				vi.mocked(FilesService.prototype.readOne).mockResolvedValue(mockFile as any);

				vi.mocked(validateItemAccess).mockResolvedValue({
					accessAllowed: true,
					allowedRootFields: ['*'],
				});

				await service.getAsset(mockFileId);

				expect(validateItemAccess).toHaveBeenCalledWith(
					{
						accountability,
						action: 'read',
						collection: 'directus_files',
						primaryKeys: [mockFileId],
						returnAllowedRootFields: true,
					},
					expect.objectContaining({
						knex: db,
						schema: expect.anything(),
					}),
				);
			});

			it('should throw ForbiddenError if validateItemAccess denies access', async () => {
				const accountability: Accountability = {
					user: 'test-user-id',
					role: 'test-role-id',
					roles: ['test-role-id'],
					admin: false,
					app: false,
					ip: '127.0.0.1',
				};

				service = createAssetsService(accountability);

				vi.mocked(validateItemAccess).mockResolvedValue({
					accessAllowed: false,
				});

				await expect(service.getAsset(mockFileId)).rejects.toThrow(ForbiddenError);
			});

			it('should throw ForbiddenError if file does not exist in storage', async () => {
				const accountability: Accountability = {
					user: 'test-user-id',
					role: 'test-role-id',
					roles: ['test-role-id'],
					admin: false,
					app: false,
					ip: '127.0.0.1',
				};

				service = createAssetsService(accountability);

				vi.mocked(FilesService.prototype.readOne).mockResolvedValue(mockFile as any);
				vi.mocked(mockDriver.exists as any).mockResolvedValue(false);

				await expect(service.getAsset(mockFileId)).rejects.toThrow(ForbiddenError);
			});
		});

		describe('unauthenticated access', () => {
			it('should filter fields for unauthenticated users based on public permissions', async () => {
				const accountability: Accountability = {
					user: null,
					role: null,
					roles: [],
					admin: false,
					app: false,
					ip: '127.0.0.1',
				};

				service = createAssetsService(accountability);

				vi.mocked(FilesService.prototype.readOne).mockResolvedValue(mockFile as any);

				vi.mocked(validateItemAccess).mockResolvedValue({
					accessAllowed: true,
					allowedRootFields: ['id', 'type'],
				});

				const result = await service.getAsset(mockFileId);

				expect(result.file.type).toBe(mockFile.type);

				expect(result.file.filename_download).toBeUndefined();
				expect(result.file.title).toBeUndefined();
				expect(result.file.description).toBeUndefined();
			});
		});

		describe('bypass fields', () => {
			it('should always include type and filesize even if not in allowedRootFields', async () => {
				const accountability: Accountability = {
					user: 'test-user-id',
					role: 'test-role-id',
					roles: ['test-role-id'],
					admin: false,
					app: false,
					ip: '127.0.0.1',
				};

				service = createAssetsService(accountability);

				vi.mocked(FilesService.prototype.readOne).mockResolvedValue(mockFile as any);

				vi.mocked(validateItemAccess).mockResolvedValue({
					accessAllowed: true,
					allowedRootFields: ['id'],
				});

				const result = await service.getAsset(mockFileId);

				expect(result.file.type).toBe(mockFile.type);
				expect(result.file.filesize).toBe(mockFile.filesize);
			});
		});
	});

	describe('zip (private)', () => {
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
