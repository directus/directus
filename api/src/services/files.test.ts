import exifr from 'exifr';
import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { FilesService } from './index.js';
import {describe, beforeEach, beforeAll, afterEach, Mocked, expect, vi, SpyInstance, it} from 'vitest'

vi.mock('exifr');
vi.mock('../../src/database/index', () => {
	return { getDatabaseClient: vi.fn().mockReturnValue('postgres') };
});

describe('Integration Tests', () => {
	let db: Mocked<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = knex({ client: MockClient }) as Mocked<Knex>;
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / Files', () => {
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
				const bufferContent = 'file buffer content';
				const allowList = ['CustomTagB', 'CustomTagA'];

				const metadata = await service.getMetadata(bufferContent, allowList);

				expect(exifrParseSpy).toHaveBeenCalled();
				expect(metadata.metadata.CustomTagA).toStrictEqual(sampleMetadata.CustomTagA);
				expect(metadata.metadata.CustomTagB).toStrictEqual(sampleMetadata.CustomTagB);
				expect(metadata.metadata.CustomTagC).toBeUndefined();
			});
		});
	});
});
