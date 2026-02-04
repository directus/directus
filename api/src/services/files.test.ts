import { PassThrough } from 'node:stream';
import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { Driver, StorageManager } from '@directus/storage';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { getStorage } from '../storage/index.js';
import { resetEnvMock } from '../test-utils/env.js';
import { createMockKnex, resetKnexMocks } from '../test-utils/knex.js';
import { FilesService, ItemsService } from './index.js';

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../test-utils/env.js');
	return mockEnv();
});

vi.mock('../storage/index.js');
vi.mock('@directus/storage');
vi.mock('./files/lib/extract-metadata.js');

describe('Service / Files', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	beforeEach(() => {
		vi.clearAllMocks();
		resetEnvMock();
	});

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
	});

	describe('createOne', () => {
		let service: FilesService;
		let superCreateOne: MockInstance;

		beforeEach(() => {
			service = new FilesService({
				knex: db,
				schema: { collections: {}, relations: [] },
			});

			superCreateOne = vi.spyOn(ItemsService.prototype, 'createOne').mockReturnValue(Promise.resolve(1));
		});

		it('throws InvalidPayloadError when "type" is not provided', async () => {
			try {
				await service.createOne({
					title: 'Test File',
					storage: 'local',
					filename_download: 'test_file',
				});
			} catch (err: any) {
				expect(err).toBeInstanceOf(InvalidPayloadError);
				expect(err.message).toBe('Invalid payload. "type" is required.');
			}

			expect(superCreateOne).not.toHaveBeenCalled();
		});

		it('creates a file entry when "type" is provided', async () => {
			await service.createOne({
				title: 'Test File',
				storage: 'local',
				filename_download: 'test_file',
				type: 'application/octet-stream',
			});

			expect(superCreateOne).toHaveBeenCalled();
		});
	});

	describe('uploadOne', () => {
		let service: FilesService;
		let superUpdateOne: MockInstance;

		let sample: {
			id: string;
			filesize: number;
		};

		beforeEach(() => {
			service = new FilesService({
				knex: db,
				schema: { collections: {}, relations: [] },
			});

			sample = {
				id: 'test-file-id-123',
				filesize: 500,
			};

			const mockDriver: Partial<Driver> = {
				read: vi.fn().mockResolvedValue(new PassThrough()),
				write: vi.fn(),
				stat: vi.fn().mockReturnValue({ size: sample.filesize }),
			};

			const mockStorage: Partial<StorageManager> = {
				location: vi.fn(() => mockDriver as Driver),
			};

			vi.mocked(getStorage).mockResolvedValue(mockStorage as StorageManager);

			tracker.on.select('select "storage_default_folder" from "directus_settings"').response([]);

			vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue(sample.id);
			superUpdateOne = vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue(sample.id);
		});

		it('should set the `uploaded_on` field to the current date', async () => {
			tracker.on
				.select(
					'select "folder", "filename_download", "filename_disk", "title", "description", "metadata" from "directus_files" where "id" = ?',
				)
				.response(null);

			const mockData = {
				storage: 'local',
				type: 'image/jpeg',
				filename_download: 'test.jpg',
			};

			const mockDate = new Date();

			vi.setSystemTime(mockDate);

			await service.uploadOne(new PassThrough(), mockData);

			vi.useRealTimers();

			expect(superUpdateOne).toHaveBeenCalledWith(
				sample.id,
				expect.objectContaining({
					...mockData,
					uploaded_on: mockDate.toISOString(),
				}),
				{ emitEvents: false },
			);
		});

		it('should update the `filename_disk` extension to the correct mimetype', async () => {
			tracker.on
				.select(
					'select "folder", "filename_download", "filename_disk", "title", "description", "metadata" from "directus_files" where "id" = ?',
				)
				.response(null);

			const mockDataJPG = {
				storage: 'local',
				type: 'image/jpeg',
				filename_download: 'test.jpg',
			};

			const mockDataPNG = {
				storage: 'local',
				type: 'image/png',
				filename_download: 'test.png',
			};

			const mockDate = new Date();

			vi.setSystemTime(mockDate);

			await service.uploadOne(new PassThrough(), mockDataJPG);

			expect(superUpdateOne).toHaveBeenCalledWith(
				sample.id,
				expect.objectContaining({
					...mockDataJPG,
					uploaded_on: mockDate.toISOString(),
					filename_disk: `${sample.id}.jpg`,
				}),
				{ emitEvents: false },
			);

			await service.uploadOne(new PassThrough(), mockDataPNG);

			expect(superUpdateOne).toHaveBeenCalledWith(
				sample.id,
				expect.objectContaining({
					...mockDataPNG,
					uploaded_on: mockDate.toISOString(),
					filename_disk: `${sample.id}.png`,
				}),
				{ emitEvents: false },
			);

			vi.useRealTimers();
		});
	});

	describe('updateMany', () => {
		let service: FilesService;
		let mockDriver: Partial<Driver>;
		let mockStorage: Partial<StorageManager>;

		beforeEach(() => {
			service = new FilesService({
				knex: db,
				schema: { collections: {}, relations: [] },
			});

			mockDriver = {
				exists: vi.fn().mockResolvedValue(false),
				move: vi.fn().mockResolvedValue(undefined),
				delete: vi.fn().mockResolvedValue(undefined),
				list: vi.fn().mockImplementation(async function* () {
					// Default: no files
				}),
			};

			mockStorage = {
				location: vi.fn(() => mockDriver as Driver),
			};

			vi.mocked(getStorage).mockResolvedValue(mockStorage as StorageManager);
		});

		it('should throw ForbiddenError when filename_disk is not unique', async () => {
			tracker.on
				.select('select "filename_disk" from "directus_files" where "filename_disk" = ?')
				.response([{ filename_disk: 'existing-file.jpg' }]);

			await expect(
				service.updateMany([1], {
					filename_disk: 'existing-file.jpg',
				}),
			).rejects.toThrow(ForbiddenError);
		});

		it('should normalize filename_disk path', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			tracker.on
				.select('select "id", "storage", "filename_disk" from "directus_files"')
				.response([{ id: 1, storage: 'local', filename_disk: 'old-file.jpg' }]);

			const superUpdateMany = vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);

			mockDriver.list = vi.fn().mockImplementation(async function* () {
				yield 'old-file.jpg';
			});

			await service.updateMany([1], {
				filename_disk: '/folder/../new-file.jpg',
			});

			expect(superUpdateMany).toHaveBeenCalledWith([1], { filename_disk: 'new-file.jpg' }, undefined);
		});

		it('should move file when filename_disk changes', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{
					id: 1,
					storage: 'local',
					filename_disk: 'old-file.jpg',
				},
			]);

			vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);

			mockDriver.list = vi.fn().mockImplementation(async function* () {
				yield 'old-file.jpg';
			});

			await service.updateMany([1], {
				filename_disk: 'new-file.jpg',
			});

			expect(mockDriver.move).toHaveBeenCalledWith('old-file.jpg', 'new-file.jpg');
		});

		it('should not move file when filename_disk has not changed', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'same-file.jpg' },
			]);

			vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);

			mockDriver.list = vi.fn().mockImplementation(async function* () {
				yield 'same-file.jpg';
			});

			await service.updateMany([1], {
				filename_disk: 'same-file.jpg',
			});

			expect(mockDriver.move).not.toHaveBeenCalled();
		});

		it('should delete original file when remote file exists and FILES_DELETE_ORIGINAL_ON_MOVE is true', async () => {
			vi.mocked(useEnv).mockReturnValue({
				FILES_DELETE_ORIGINAL_ON_MOVE: 'true',
			});

			const { FilesService } = await import('./files.js');

			service = new FilesService({
				knex: db,
				schema: { collections: {}, relations: [] },
			});

			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'old-file.jpg' },
			]);

			vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);

			// Simulate remote file already exists
			mockDriver.exists = vi.fn().mockResolvedValue(true);

			mockDriver.list = vi.fn().mockImplementation(async function* () {
				yield 'old-file.jpg';
			});

			await service.updateMany([1], {
				filename_disk: 'new-file.jpg',
			});

			// Should not move (remote exists), but should delete original
			expect(mockDriver.move).not.toHaveBeenCalled();
			expect(mockDriver.delete).toHaveBeenCalledWith('old-file.jpg');
		});

		it('should not delete original file when remote file exists and FILES_DELETE_ORIGINAL_ON_MOVE is false', async () => {
			vi.mocked(useEnv).mockReturnValue({
				FILES_DELETE_ORIGINAL_ON_MOVE: 'false',
			});

			const { FilesService } = await import('./files.js');

			service = new FilesService({
				knex: db,
				schema: { collections: {}, relations: [] },
			});

			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'old-file.jpg' },
			]);

			vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);

			// Simulate remote file already exists
			mockDriver.exists = vi.fn().mockResolvedValue(true);

			mockDriver.list = vi.fn().mockImplementation(async function* () {
				yield 'old-file.jpg';
			});

			await service.updateMany([1], {
				filename_disk: 'new-file.jpg',
			});

			// Should not move (remote exists), and should not delete original
			expect(mockDriver.move).not.toHaveBeenCalled();
			expect(mockDriver.delete).not.toHaveBeenCalled();
		});

		it('should delete generated assets (thumbnails) when moving file', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'old-file.jpg' },
			]);

			vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);

			mockDriver.list = vi.fn().mockImplementation(async function* () {
				yield 'old-file.jpg';
				yield 'old-file-thumbnail-small.jpg';
				yield 'old-file-thumbnail-large.jpg';
			});

			await service.updateMany([1], {
				filename_disk: 'new-file.jpg',
			});

			// Should move the primary asset
			expect(mockDriver.move).toHaveBeenCalledWith('old-file.jpg', 'new-file.jpg');

			// Should delete the thumbnails
			expect(mockDriver.delete).toHaveBeenCalledWith('old-file-thumbnail-small.jpg');
			expect(mockDriver.delete).toHaveBeenCalledWith('old-file-thumbnail-large.jpg');
		});

		it('should handle files in subdirectories', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'folder/old-file.jpg' },
			]);

			vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);

			mockDriver.list = vi.fn().mockImplementation(async function* () {
				yield 'folder/old-file.jpg';
				yield 'folder/old-file-thumbnail.jpg';
			});

			await service.updateMany([1], {
				filename_disk: 'folder/new-file.jpg',
			});

			expect(mockDriver.move).toHaveBeenCalledWith('folder/old-file.jpg', 'folder/new-file.jpg');
			expect(mockDriver.delete).toHaveBeenCalledWith('folder/old-file-thumbnail.jpg');
		});

		it('should process multiple files independently in separate transactions', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'file1.jpg' },
				{ id: 2, storage: 'local', filename_disk: 'file2.jpg' },
			]);

			vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1, 2]);

			let callCount = 0;

			mockDriver.list = vi.fn().mockImplementation(async function* () {
				if (callCount === 0) {
					callCount++;
					yield 'file1.jpg';
				} else {
					yield 'file2.jpg';
				}
			});

			await service.updateMany([1, 2], {
				filename_disk: 'new-file.jpg',
			});

			// Should move both files
			expect(mockDriver.move).toHaveBeenCalledTimes(2);
			expect(mockDriver.move).toHaveBeenCalledWith('file1.jpg', 'new-file.jpg');
			expect(mockDriver.move).toHaveBeenCalledWith('file2.jpg', 'new-file.jpg');
		});
	});
});
