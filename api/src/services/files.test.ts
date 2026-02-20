import { PassThrough } from 'node:stream';
import { InvalidPayloadError } from '@directus/errors';
import { Driver, StorageManager } from '@directus/storage';
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
	type MockedFunction,
	type MockInstance,
	vi,
} from 'vitest';
import { getAxios } from '../request/index.js';
import { getStorage } from '../storage/index.js';
import { FilesService, ItemsService } from './index.js';

const mockEnvOverrides = vi.hoisted(
	() =>
		({
			FILES_MIME_TYPE_ALLOW_LIST: '*/*',
			STORAGE_LOCATIONS: 'local',
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
vi.mock('@directus/storage');
vi.mock('./files/lib/extract-metadata.js');
vi.mock('../request/index.js');

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

			it('throws InvalidPayloadError when MIME type is blocked by the global allow list', async () => {
				mockEnvOverrides['FILES_MIME_TYPE_ALLOW_LIST'] = 'image/*';

				mockAxiosGet.mockResolvedValue({
					headers: { 'content-type': 'application/pdf' },
					data: new PassThrough(),
					request: { res: { responseUrl: 'https://example.com/file.pdf' } },
				});

				await expect(service.importOne('https://example.com/file.pdf', {})).rejects.toBeInstanceOf(InvalidPayloadError);
				expect(uploadOneSpy).not.toHaveBeenCalled();
			});

			it('succeeds when MIME type is permitted by the global allow list', async () => {
				mockEnvOverrides['FILES_MIME_TYPE_ALLOW_LIST'] = 'image/*';

				mockAxiosGet.mockResolvedValue({
					headers: { 'content-type': 'image/jpeg' },
					data: new PassThrough(),
					request: { res: { responseUrl: 'https://example.com/photo.jpg' } },
				});

				await expect(service.importOne('https://example.com/photo.jpg', {})).resolves.toBe('imported-file-id');
				expect(uploadOneSpy).toHaveBeenCalled();
			});

			it('throws InvalidPayloadError when MIME type is not in allowedMimeTypes', async () => {
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

			it('succeeds when MIME type matches an allowedMimeTypes glob pattern', async () => {
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

			it('does not restrict MIME type when allowedMimeTypes is an empty array', async () => {
				await expect(service.importOne('https://example.com/photo.jpg', {}, [])).resolves.toBe('imported-file-id');
				expect(uploadOneSpy).toHaveBeenCalled();
			});

			it('strips content-type parameters before checking MIME type', async () => {
				mockEnvOverrides['FILES_MIME_TYPE_ALLOW_LIST'] = 'image/*';

				mockAxiosGet.mockResolvedValue({
					headers: { 'content-type': 'image/jpeg; charset=utf-8' },
					data: new PassThrough(),
					request: { res: { responseUrl: 'https://example.com/photo.jpg' } },
				});

				await expect(service.importOne('https://example.com/photo.jpg', {})).resolves.toBe('imported-file-id');
				expect(uploadOneSpy).toHaveBeenCalled();
			});

			it('falls back to application/octet-stream when the content-type header is absent', async () => {
				mockEnvOverrides['FILES_MIME_TYPE_ALLOW_LIST'] = 'application/octet-stream';

				mockAxiosGet.mockResolvedValue({
					headers: {},
					data: new PassThrough(),
					request: { res: { responseUrl: 'https://example.com/file' } },
				});

				await expect(service.importOne('https://example.com/file', {})).resolves.toBe('imported-file-id');
				expect(uploadOneSpy).toHaveBeenCalled();
			});

			it('passes the stripped MIME type (without parameters) to uploadOne', async () => {
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
});
