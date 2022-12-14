import exifr from 'exifr';
import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { Readable } from 'node:stream';
import { afterEach, beforeAll, beforeEach, describe, expect, it, MockedFunction, SpyInstance, vi } from 'vitest';
import { FilesService, ItemsService } from '.';
import { InvalidPayloadException } from '../exceptions';

vi.mock('exifr');

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(() => {
		db = vi.mocked(knex({ client: MockClient }));
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	describe('Services / Files', () => {
		describe('createOne', () => {
			let service: FilesService;
			let superCreateOne: SpyInstance;

			beforeEach(() => {
				service = new FilesService({
					knex: db,
					schema: { collections: {}, relations: [] },
				});
				superCreateOne = vi.spyOn(ItemsService.prototype, 'createOne').mockReturnValue(Promise.resolve(1));
			});

			it('throws InvalidPayloadException when "type" is not provided', async () => {
				try {
					await service.createOne({
						title: 'Test File',
						storage: 'local',
						filename_download: 'test_file',
					});
				} catch (err: any) {
					expect(err).toBeInstanceOf(InvalidPayloadException);
					expect(err.message).toBe('"type" is required');
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

		describe('getMetadata', () => {
			let service: FilesService;
			let exifrParseSpy: SpyInstance<any>;

			const sampleMetadata = {
				CustomTagA: 'value a',
				CustomTagB: 'value b',
				CustomTagC: 'value c',
			};

			beforeEach(() => {
				exifrParseSpy = vi.spyOn(exifr, 'parse');
				service = new FilesService({
					knex: db,
					schema: { collections: {}, relations: [] },
				});
			});

			it('accepts allowlist metadata tags', async () => {
				exifrParseSpy.mockReturnValue(Promise.resolve({ ...sampleMetadata }));
				const stream = Readable.from(['file buffer content']);
				const allowList = ['CustomTagB', 'CustomTagA'];

				const metadata = await service.getMetadata(stream, allowList);

				expect(exifrParseSpy).toHaveBeenCalled();
				expect(metadata.metadata.CustomTagA).toStrictEqual(sampleMetadata.CustomTagA);
				expect(metadata.metadata.CustomTagB).toStrictEqual(sampleMetadata.CustomTagB);
				expect(metadata.metadata.CustomTagC).toBeUndefined();
			});
		});
	});
});
