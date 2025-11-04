import { InvalidPayloadError } from '@directus/errors';
import { Driver, StorageManager } from '@directus/storage';
import type { Knex } from 'knex';
import knex from 'knex';
import { MockClient, Tracker, createTracker } from 'knex-mock-client';
import { PassThrough } from 'node:stream';
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type MockInstance,
	type MockedFunction,
} from 'vitest';
import { getStorage } from '../storage/index.js';
import { FilesService, ItemsService } from './index.js';

vi.mock('../storage/index.js');
vi.mock('@directus/storage');
vi.mock('./files/lib/extract-metadata.js');

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
			let superUpdateOne: MockInstance;

			let sample: {
				id: string;
				filesize: number;
			};

			beforeEach(() => {
				service = new FilesService({
					knex: db,
					schema: {
						collections: {},
						relations: [],
					},
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
	});
});
