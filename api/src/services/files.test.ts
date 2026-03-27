import { PassThrough, Readable } from 'node:stream';
import { useEnv } from '@directus/env';
import { ForbiddenError, InternalServerError, InvalidPayloadError, ServiceUnavailableError } from '@directus/errors';
import { Driver, StorageManager } from '@directus/storage';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, test, vi } from 'vitest';
import { getAxios } from '../request/index.js';
import { getStorage } from '../storage/index.js';
import { resetEnvMock } from '../test-utils/env.js';
import { createMockKnex, resetKnexMocks } from '../test-utils/knex.js';
import { createMockDriver, createMockStorage } from '../test-utils/storage.js';
import { FilesService, ItemsService } from './index.js';

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

const mockEnvOverrides = vi.hoisted(
	() =>
		({
			FILES_MIME_TYPE_ALLOW_LIST: '*/*',
		}) as Record<string, unknown>,
);

vi.mock('@directus/env', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@directus/env')>();
	const realEnv = actual.useEnv();

	const envWithOverrides = new Proxy(realEnv as Record<string, unknown>, {
		get(target, prop: string) {
			return prop in mockEnvOverrides ? mockEnvOverrides[prop] : target[prop];
		},
		set(_target, prop: string, value: unknown) {
			mockEnvOverrides[prop] = value;
			return true;
		},
	});

	return {
		...actual,
		useEnv: vi.fn(() => envWithOverrides),
	};
});

vi.mock('../storage/index.js');
vi.mock('./files/lib/extract-metadata.js');
vi.mock('../request/index.js');

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

		beforeEach(() => {
			service = new FilesService({
				knex: db,
				schema: { collections: {}, relations: [] },
			});
		});

		test('throws InvalidPayloadError when "type" is not provided', async () => {
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

			expect(ItemsService.prototype.createOne).not.toHaveBeenCalled();
		});

		test('should throw ForbiddenError deferred when filename_disk is not unique', async () => {
			tracker.on
				.select('select "filename_disk" from "directus_files" where "filename_disk" = ?')
				.response([{ filename_disk: 'existing-file.jpg' }]);

			await service.createOne({
				type: 'application/octet-stream',
				filename_disk: 'existing-file.jpg',
			});

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
				{
					type: 'application/octet-stream',
					filename_disk: 'existing-file.jpg',
				},
				expect.objectContaining({ preMutationError: expect.any(ForbiddenError) }),
			);
		});

		test('creates a file entry when "type" is provided', async () => {
			await service.createOne({
				title: 'Test File',
				storage: 'local',
				filename_download: 'test_file',
				type: 'application/octet-stream',
			});

			expect(ItemsService.prototype.createOne).toHaveBeenCalled();
		});

		test('should normalize filename_disk path', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			await service.createOne({
				type: 'application/octet-stream',
				filename_disk: '/folder/../new-file.jpg',
			});

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
				{ filename_disk: 'new-file.jpg', type: 'application/octet-stream' },
				{},
			);
		});
	});

	describe('uploadOne', () => {
		let service: FilesService;
		let superUpdateOne: MockInstance;
		let mockDriver: Driver;
		let mockStorage: StorageManager;

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

			mockDriver = createMockDriver();
			mockStorage = createMockStorage(mockDriver);
			vi.mocked(getStorage).mockResolvedValue(mockStorage);

			tracker.on.select('select "storage_default_folder" from "directus_settings"').response([]);

			vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue(sample.id);
			superUpdateOne = vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue(sample.id);
		});

		test.each(['EROFS', 'EACCES', 'EPERM'])('returns 500 for %s filesystem error', async (code: any) => {
			const stream = Readable.from(Buffer.from('test content'));

			vi.mocked(mockDriver.write).mockRejectedValue(Object.assign(new Error('fs error'), { code }));

			await expect(
				service.uploadOne(stream, {
					storage: 'local',
					filename_download: 'test.txt',
					type: 'text/plain',
				} as any),
			).rejects.toBeInstanceOf(InternalServerError);
		});

		test('returns service unavailable for unknown error', async () => {
			const stream = Readable.from(Buffer.from('test content'));

			vi.mocked(mockDriver.write).mockRejectedValue(Object.assign(new Error('Error')));

			await expect(
				service.uploadOne(stream, {
					storage: 'local',
					filename_download: 'test.txt',
					type: 'text/plain',
				} as any),
			).rejects.toBeInstanceOf(ServiceUnavailableError);
		});

		test('should set the `uploaded_on` field to the current date', async () => {
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

		test('should update the `filename_disk` extension to the correct mimetype', async () => {
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

		describe('storage default behavior', () => {
			it('should default to the first STORAGE_LOCATIONS when storage is not provided', async () => {
				mockEnvOverrides['STORAGE_LOCATIONS'] = 'local,s3';

				tracker.on
					.select(
						'select "folder", "filename_download", "filename_disk", "title", "description", "metadata", "storage" from "directus_files" where "id" = ?',
					)
					.response(null);

				await service.uploadOne(new PassThrough(), {
					type: 'image/jpeg',
					filename_download: 'test.jpg',
				});

				expect(superUpdateOne).toHaveBeenCalledWith(
					sample.id,
					expect.objectContaining({
						storage: 'local',
					}),
					{ emitEvents: false },
				);
			});

			it('should use the provided storage when explicitly set', async () => {
				mockEnvOverrides['STORAGE_LOCATIONS'] = 'local,s3';

				tracker.on
					.select(
						'select "folder", "filename_download", "filename_disk", "title", "description", "metadata", "storage" from "directus_files" where "id" = ?',
					)
					.response(null);

				await service.uploadOne(new PassThrough(), {
					storage: 's3',
					type: 'image/jpeg',
					filename_download: 'test.jpg',
				});

				expect(superUpdateOne).toHaveBeenCalledWith(
					sample.id,
					expect.objectContaining({
						storage: 's3',
					}),
					{ emitEvents: false },
				);
			});

			it('should preserve the existing file storage on re-upload without storage', async () => {
				mockEnvOverrides['STORAGE_LOCATIONS'] = 'local,s3';

				tracker.on
					.select(
						'select "folder", "filename_download", "filename_disk", "title", "description", "metadata", "storage" from "directus_files" where "id" = ?',
					)
					.response({ storage: 's3', filename_disk: 'existing.jpg' });

				await service.uploadOne(
					new PassThrough(),
					{
						type: 'image/jpeg',
						filename_download: 'test.jpg',
					},
					sample.id,
				);

				expect(superUpdateOne).toHaveBeenCalledWith(
					sample.id,
					expect.objectContaining({
						storage: 's3',
					}),
					{ emitEvents: false },
				);
			});

			it('should override the existing file storage when explicitly provided', async () => {
				mockEnvOverrides['STORAGE_LOCATIONS'] = 'local,s3';

				tracker.on
					.select(
						'select "folder", "filename_download", "filename_disk", "title", "description", "metadata", "storage" from "directus_files" where "id" = ?',
					)
					.response({ storage: 's3', filename_disk: 'existing.jpg' });

				await service.uploadOne(
					new PassThrough(),
					{
						storage: 'local',
						type: 'image/jpeg',
						filename_download: 'test.jpg',
					},
					sample.id,
				);

				expect(superUpdateOne).toHaveBeenCalledWith(
					sample.id,
					expect.objectContaining({
						storage: 'local',
					}),
					{ emitEvents: false },
				);
			});

			describe('uploadOne - permanent filesystem errors', () => {
				const errorCodes = ['EROFS', 'EACCES', 'EPERM'] as const;

				it.each(errorCodes)('returns 500 for %s filesystem error', async (code: any) => {
					const stream = Readable.from(Buffer.from('test content'));

					const storage = await getStorage();
					const disk = storage.location('local');

					vi.spyOn(disk, 'write').mockRejectedValue(Object.assign(new Error('fs error'), { code }));

					await expect(
						service.uploadOne(stream, {
							storage: 'local',
							filename_download: 'test.txt',
							type: 'text/plain',
						} as any),
					).rejects.toBeInstanceOf(InternalServerError);
				});
			});
		});
	});

	describe('updateMany', () => {
		let service: FilesService;
		let mockDriver: Driver;
		let mockStorage: StorageManager;

		beforeEach(() => {
			service = new FilesService({
				knex: db,
				schema: { collections: {}, relations: [] },
			});

			mockDriver = createMockDriver();
			mockStorage = createMockStorage(mockDriver);
			vi.mocked(getStorage).mockResolvedValue(mockStorage);
		});

		test('should throw ForbiddenError deferred when filename_disk is not unique', async () => {
			tracker.on
				.select('select "filename_disk" from "directus_files" where "filename_disk" = ?')
				.response([{ filename_disk: 'existing-file.jpg' }]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'old-file.jpg' },
			]);

			await service.updateMany([1], {
				filename_disk: 'existing-file.jpg',
			});

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				[1],
				{ filename_disk: 'existing-file.jpg' },
				expect.objectContaining({ preMutationError: expect.any(ForbiddenError) }),
			);
		});

		test('should throw deferred InvalidPayloadError when filename_disk is present in bulk update', async () => {
			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'old-file.jpg' },
				{ id: 2, storage: 'local', filename_disk: 'old-file-2.jpg' },
			]);

			await service.updateMany([1, 2], {
				filename_disk: 'existing-file.jpg',
			});

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				[1, 2],
				{ filename_disk: 'existing-file.jpg' },
				expect.objectContaining({ preMutationError: expect.any(InvalidPayloadError) }),
			);
		});

		test('should normalize filename_disk path', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'old-file.jpg' },
			]);

			const superUpdateMany = vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);

			vi.mocked(mockDriver.list).mockImplementation(async function* () {
				yield 'old-file.jpg';
			});

			await service.updateMany([1], {
				filename_disk: '/folder/../new-file.jpg',
			});

			expect(superUpdateMany).toHaveBeenCalledWith([1], { filename_disk: 'new-file.jpg' }, {});
		});

		test('should move file when filename_disk changes', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{
					id: 1,
					storage: 'local',
					filename_disk: 'old-file.jpg',
				},
			]);

			vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);

			vi.mocked(mockDriver.list).mockImplementation(async function* () {
				yield 'old-file.jpg';
			});

			await service.updateMany([1], {
				filename_disk: 'new-file.jpg',
			});

			expect(mockDriver.move).toHaveBeenCalledWith('old-file.jpg', 'new-file.jpg');
			// delete should not be called since its a move
			expect(mockDriver.delete).not.toHaveBeenCalled();
		});

		test('should not move file when filename_disk has not changed', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'same-file.jpg' },
			]);

			const superUpdateMany = vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);

			vi.mocked(mockDriver.list).mockImplementation(async function* () {
				yield 'same-file.jpg';
			});

			await service.updateMany([1], {
				filename_disk: 'same-file.jpg',
			});

			expect(superUpdateMany).toHaveBeenCalledWith([1], { filename_disk: 'same-file.jpg' }, {});
			expect(mockDriver.move).not.toHaveBeenCalled();
			expect(mockDriver.delete).not.toHaveBeenCalled();
		});

		test('should delete original file when remote file exists and FILES_DELETE_ORIGINAL_ON_MOVE is true', async () => {
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

			vi.mocked(mockDriver.exists).mockResolvedValue(true);

			vi.mocked(mockDriver.list).mockImplementation(async function* () {
				yield 'old-file.jpg';
			});

			await service.updateMany([1], {
				filename_disk: 'new-file.jpg',
			});

			expect(mockDriver.move).not.toHaveBeenCalled();
			expect(mockDriver.delete).toHaveBeenCalledWith('old-file.jpg');
		});

		test('should not delete original file when remote file exists and FILES_DELETE_ORIGINAL_ON_MOVE is false', async () => {
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

			vi.mocked(mockDriver.exists).mockResolvedValue(true);

			vi.mocked(mockDriver.list).mockImplementation(async function* () {
				yield 'old-file.jpg';
			});

			await service.updateMany([1], {
				filename_disk: 'new-file.jpg',
			});

			expect(mockDriver.move).not.toHaveBeenCalled();
			expect(mockDriver.delete).not.toHaveBeenCalled();
		});

		test('should delete generated assets (thumbnails) when moving file', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'old-file.jpg' },
			]);

			vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);

			vi.mocked(mockDriver.list).mockImplementation(async function* () {
				yield 'old-file.jpg';
				yield 'old-file-thumbnail-small.jpg';
				yield 'old-file-thumbnail-large.jpg';
			});

			await service.updateMany([1], {
				filename_disk: 'new-file.jpg',
			});

			expect(mockDriver.move).toHaveBeenCalledWith('old-file.jpg', 'new-file.jpg');
			expect(mockDriver.delete).toHaveBeenCalledWith('old-file-thumbnail-small.jpg');
			expect(mockDriver.delete).toHaveBeenCalledWith('old-file-thumbnail-large.jpg');
		});

		test('should handle files in subdirectories', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'folder/old-file.jpg' },
			]);

			vi.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);

			vi.mocked(mockDriver.list).mockImplementation(async function* () {
				yield 'folder/old-file.jpg';
				yield 'old-file-thumbnail.jpg';
			});

			await service.updateMany([1], {
				filename_disk: 'folder/new-file.jpg',
			});

			expect(mockDriver.move).toHaveBeenCalledWith('folder/old-file.jpg', 'folder/new-file.jpg');
			expect(mockDriver.delete).toHaveBeenCalledWith('old-file-thumbnail.jpg');
		});

		test('should update without file operations when filename_disk is not in data', async () => {
			await service.updateMany([1], {
				title: 'Updated Title',
			});

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith([1], { title: 'Updated Title' }, {});
			expect(mockDriver.move).not.toHaveBeenCalled();
			expect(mockDriver.delete).not.toHaveBeenCalled();
		});

		test('should skip file operations when file record has no filename_disk', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: null },
			]);

			await service.updateMany([1], {
				filename_disk: 'new-file.jpg',
			});

			expect(mockDriver.move).not.toHaveBeenCalled();
			expect(mockDriver.delete).not.toHaveBeenCalled();
		});

		test('should skip file operations when file record is not found in updatedFiles map', async () => {
			tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

			await service.updateMany([1], {
				filename_disk: 'new-file.jpg',
			});

			expect(mockDriver.move).not.toHaveBeenCalled();
			expect(mockDriver.delete).not.toHaveBeenCalled();
		});
	});

	describe('deleteMany', () => {
		let service: FilesService;
		let mockDriver: Driver;

		beforeEach(() => {
			service = new FilesService({
				knex: db,
				schema: { collections: {}, relations: [] },
			});

			mockDriver = createMockDriver();
			const mockStorage = createMockStorage(mockDriver);
			vi.mocked(getStorage).mockResolvedValue(mockStorage);
		});

		test('should delete file and generated assets from storage', async () => {
			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'test-file.jpg' },
			]);

			vi.mocked(mockDriver.list).mockImplementation(async function* () {
				yield 'test-file.jpg';
				yield 'test-file-thumbnail-small.jpg';
				yield 'test-file-thumbnail-large.jpg';
			});

			await service.deleteMany([1]);

			expect(ItemsService.prototype.deleteMany).toHaveBeenCalledWith([1]);
			expect(mockDriver.delete).toHaveBeenCalledWith('test-file.jpg');
			expect(mockDriver.delete).toHaveBeenCalledWith('test-file-thumbnail-small.jpg');
			expect(mockDriver.delete).toHaveBeenCalledWith('test-file-thumbnail-large.jpg');
		});

		test('should delete multiple files from storage', async () => {
			vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
				{ id: 1, storage: 'local', filename_disk: 'file1.jpg' },
				{ id: 2, storage: 'local', filename_disk: 'file2.png' },
			]);

			let callCount = 0;

			vi.mocked(mockDriver.list).mockImplementation(async function* () {
				if (callCount === 0) {
					callCount++;
					yield 'file1.jpg';
				} else {
					yield 'file2.png';
				}
			});

			await service.deleteMany([1, 2]);

			expect(ItemsService.prototype.deleteMany).toHaveBeenCalledWith([1, 2]);
			expect(mockDriver.delete).toHaveBeenCalledWith('file1.jpg');
			expect(mockDriver.delete).toHaveBeenCalledWith('file2.png');
		});
	});

	describe('importOne', () => {
		let service: FilesService;
		let uploadOneSpy: MockInstance;
		let mockAxiosGet: ReturnType<typeof vi.fn>;

		beforeEach(() => {
			mockEnvOverrides['FILES_MIME_TYPE_ALLOW_LIST'] = '*/*';
			mockEnvOverrides['STORAGE_LOCATIONS'] = 'local';

			service = new FilesService({
				knex: db,
				schema: { collections: {}, relations: [] },
			});

			uploadOneSpy = vi.spyOn(FilesService.prototype, 'uploadOne').mockResolvedValue('imported-file-id');

			mockAxiosGet = vi.fn().mockResolvedValue({
				headers: { 'content-type': 'image/jpeg' },
				data: new PassThrough(),
				request: { res: { responseUrl: 'https://example.com/photo.jpg' } },
			});

			vi.mocked(getAxios).mockResolvedValue({ get: mockAxiosGet } as any);
		});

		test('throws InvalidPayloadError when MIME type is blocked by the global allow list', async () => {
			mockEnvOverrides['FILES_MIME_TYPE_ALLOW_LIST'] = 'image/*';

			mockAxiosGet.mockResolvedValue({
				headers: { 'content-type': 'application/pdf' },
				data: new PassThrough(),
				request: { res: { responseUrl: 'https://example.com/file.pdf' } },
			});

			await expect(service.importOne('https://example.com/file.pdf', {})).rejects.toBeInstanceOf(InvalidPayloadError);
			expect(uploadOneSpy).not.toHaveBeenCalled();
		});

		test('succeeds when MIME type is permitted by the global allow list', async () => {
			mockEnvOverrides['FILES_MIME_TYPE_ALLOW_LIST'] = 'image/*';

			mockAxiosGet.mockResolvedValue({
				headers: { 'content-type': 'image/jpeg' },
				data: new PassThrough(),
				request: { res: { responseUrl: 'https://example.com/photo.jpg' } },
			});

			await expect(service.importOne('https://example.com/photo.jpg', {})).resolves.toBe('imported-file-id');
			expect(uploadOneSpy).toHaveBeenCalled();
		});

		test('throws InvalidPayloadError when MIME type is not in filterMimeType', async () => {
			mockAxiosGet.mockResolvedValue({
				headers: { 'content-type': 'image/png' },
				data: new PassThrough(),
				request: { res: { responseUrl: 'https://example.com/image.png' } },
			});

			await expect(
				service.importOne('https://example.com/image.png', {}, { filterMimeType: ['image/jpeg'] }),
			).rejects.toBeInstanceOf(InvalidPayloadError);

			expect(uploadOneSpy).not.toHaveBeenCalled();
		});

		test('succeeds when MIME type matches an filterMimeType glob pattern', async () => {
			mockAxiosGet.mockResolvedValue({
				headers: { 'content-type': 'image/png' },
				data: new PassThrough(),
				request: { res: { responseUrl: 'https://example.com/image.png' } },
			});

			await expect(
				service.importOne('https://example.com/image.png', {}, { filterMimeType: ['image/*'] }),
			).resolves.toBe('imported-file-id');

			expect(uploadOneSpy).toHaveBeenCalled();
		});

		test('does not restrict MIME type when filterMimeType is an empty array', async () => {
			await expect(service.importOne('https://example.com/photo.jpg', {}, { filterMimeType: [] })).resolves.toBe(
				'imported-file-id',
			);

			expect(uploadOneSpy).toHaveBeenCalled();
		});

		test('strips content-type parameters before checking MIME type', async () => {
			mockEnvOverrides['FILES_MIME_TYPE_ALLOW_LIST'] = 'image/*';

			mockAxiosGet.mockResolvedValue({
				headers: { 'content-type': 'image/jpeg; charset=utf-8' },
				data: new PassThrough(),
				request: { res: { responseUrl: 'https://example.com/photo.jpg' } },
			});

			await expect(service.importOne('https://example.com/photo.jpg', {})).resolves.toBe('imported-file-id');
			expect(uploadOneSpy).toHaveBeenCalled();
		});

		test('falls back to application/octet-stream when the content-type header is absent', async () => {
			mockEnvOverrides['FILES_MIME_TYPE_ALLOW_LIST'] = 'application/octet-stream';

			mockAxiosGet.mockResolvedValue({
				headers: {},
				data: new PassThrough(),
				request: { res: { responseUrl: 'https://example.com/file' } },
			});

			await expect(service.importOne('https://example.com/file', {})).resolves.toBe('imported-file-id');
			expect(uploadOneSpy).toHaveBeenCalled();
		});

		test('passes the stripped MIME type (without parameters) to uploadOne', async () => {
			mockAxiosGet.mockResolvedValue({
				headers: { 'content-type': 'image/jpeg; charset=utf-8' },
				data: new PassThrough(),
				request: { res: { responseUrl: 'https://example.com/photo.jpg' } },
			});

			await service.importOne('https://example.com/photo.jpg', {});

			expect(uploadOneSpy).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ type: 'image/jpeg' }),
				undefined,
			);
		});
	});
});
