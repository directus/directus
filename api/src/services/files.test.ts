import { Readable } from 'node:stream';
import { StorageManager } from '@directus/storage';
import { InvalidPayloadError } from '@directus/errors';
import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type MockedFunction,
	type MockInstance,
} from 'vitest';
import { FilesService, ItemsService } from './index.js';
import { _cache } from '../storage/index.js';

vi.mock('@directus/storage');

vi.mock('./files/lib/extract-metadata', () => ({
	extractMetadata: vi.fn().mockResolvedValue({
		height: 100,
		width: 100,
		description: null,
		title: 'Test Image',
		tags: null,
		metadata: {},
	}),
}));

vi.mock('../../src/database/index', () => ({
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('../database/helpers/index', () => ({
	getHelpers: vi.fn().mockImplementation(() => ({
		date: {
			writeTimestamp: vi.fn().mockReturnValue(new Date('2024-06-28T14:00:00.000Z')),
		},
	})),
}));

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(() => {
		db = vi.mocked(knex.default({ client: MockClient }));
		tracker = createTracker(db);
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	describe('Services / Files', () => {
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
			let superUploadOne: MockInstance;
			let superUpdateOne: MockInstance;
			let mockStorage: StorageManager;

			const mockAsyncIterator = {
				async *[Symbol.asyncIterator]() {
					yield* await Promise.resolve([]);
				},
			};

			const mockFileData = {
				id: 'test_image_id',
				storage: 'local',
				filename_disk: 'test_image_id.png',
				filename_download: 'test_image.png',
				title: 'Test Image',
				type: 'image/png',
				folder: null,
				replaced_on: null,
			};

			const mockMetadata = {
				height: 100,
				width: 100,
				description: null,
				title: 'Test Image',
				tags: null,
				metadata: {},
			};

			beforeEach(() => {
				service = new FilesService({
					knex: db,
					schema: {
						collections: {},
						relations: [],
					},
				});

				mockStorage = {
					registerDriver: vi.fn(),
					registerLocation: vi.fn(),
					location: vi.fn(() => ({
						write: vi.fn(),
						stat: vi.fn().mockReturnValue({
							size: 200,
							modified: '2024-06-14T23:59:59.001Z',
						}),
						read: vi.fn((value) => Readable.from(value)),
						list: vi.fn().mockReturnValue(mockAsyncIterator),
						move: vi.fn(),
					})),
				} as unknown as StorageManager;

				_cache.storage = mockStorage;

				vi.mocked(StorageManager).mockReturnValue(mockStorage);

				superUploadOne = vi.spyOn(FilesService.prototype, 'uploadOne');
				superUpdateOne = vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue(1);

				tracker.on.select('select "storage_default_folder" from "directus_settings"').response([]);
			});

			it('should update the file `replaced_on`, `filename_download`, & `filename_disk` if primary key exists', async () => {
				tracker.on
					.select(
						'select "folder", "filename_download", "filename_disk", "title", "description", "metadata", "replaced_on" from "directus_files" where "id" = ?',
					)
					.response(mockFileData);

				const readableData = Readable.from('test_image.jpeg', { encoding: 'utf8' });

				await service.uploadOne(
					readableData,
					{
						storage: 'local',
						type: 'image/jpeg',
						filename_download: 'test_image',
						filename_disk: 'test_image.jpeg',
						title: 'Test Image',
					},
					'test_image_id',
				);

				expect(superUploadOne).toHaveBeenCalled();

				expect(superUpdateOne).toHaveBeenCalledWith(
					'test_image_id',
					expect.objectContaining({
						...mockFileData,
						...mockMetadata,
						filesize: 200,
						type: 'image/jpeg',
						filename_download: 'test_image.jpeg',
						filename_disk: 'test_image.jpeg',
						replaced_on: '2024-06-28T14:00:00.000Z',
					}),
					expect.objectContaining({
						emitEvents: false,
					}),
				);
			});

			it('should not update file `replaced_on` if primary key does not exist', async () => {
				tracker.on
					.select(
						'select "folder", "filename_download", "filename_disk", "title", "description", "metadata", "replaced_on" from "directus_files" where "id" = ?',
					)
					.response(null);

				const readableData = Readable.from('test_image.png', { encoding: 'utf8' });

				await service.uploadOne(readableData, {
					storage: 'local',
					type: 'image/png',
					filename_download: 'test_image',
					title: 'Test Image',
				});

				expect(superUploadOne).toHaveBeenCalled();

				expect(superUpdateOne).toHaveBeenCalledWith(
					1,
					expect.objectContaining({
						...mockMetadata,
						storage: 'local',
						filename_download: 'test_image.png',
						type: 'image/png',
						filename_disk: '1.png',
						filesize: 200,
					}),
					expect.objectContaining({
						emitEvents: false,
					}),
				);
			});

			it('should use default filename_disk if filename_disk is not supplied', async () => {
				const readableData = Readable.from('test_image.png', { encoding: 'utf8' });

				await service.uploadOne(readableData, {
					storage: 'local',
					type: 'image/png',
					filename_download: 'test_image.png',
					title: 'Test Image',
				});

				expect(superUploadOne).toHaveBeenCalled();

				expect(superUpdateOne).toHaveBeenCalledWith(
					1,
					expect.objectContaining({
						...mockMetadata,
						storage: 'local',
						filename_download: 'test_image.png',
						type: 'image/png',
						filename_disk: '1.png',
						filesize: 200,
					}),
					expect.objectContaining({
						emitEvents: false,
					}),
				);
			});

			it('should use supplied filename_disk', async () => {
				const readableData = Readable.from('test_image.png', { encoding: 'utf8' });

				await service.uploadOne(readableData, {
					storage: 'local',
					type: 'image/png',
					filename_download: 'test_image.png',
					filename_disk: 'test_image.png',
					title: 'Test Image',
				});

				expect(superUploadOne).toHaveBeenCalled();

				expect(superUpdateOne).toHaveBeenCalledWith(
					1,
					expect.objectContaining({
						...mockMetadata,
						storage: 'local',
						filename_download: 'test_image.png',
						type: 'image/png',
						filename_disk: 'test_image.png',
						filesize: 200,
					}),
					expect.objectContaining({
						emitEvents: false,
					}),
				);
			});
		});
	});
});
