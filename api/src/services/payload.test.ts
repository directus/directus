import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { PayloadService } from '../../src/services/index.js';
import { getHelpers, Helpers } from '../../src/database/helpers/index.js';
import {describe, beforeEach, beforeAll, afterEach, Mocked, expect, vi, it} from 'vitest'

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

	describe('Services / PayloadService', () => {
		describe('transformers', () => {
			let service: PayloadService;
			let helpers: Helpers;

			beforeEach(() => {
				service = new PayloadService('test', {
					knex: db,
					schema: { collections: {}, relations: [] },
				});
				helpers = getHelpers(db);
			});

			describe('csv', () => {
				it('Returns undefined for illegal values', async () => {
					const result = await service.transformers['cast-csv']!({
						value: 123,
						action: 'read',
						payload: {},
						accountability: { role: null },
						specials: [],
						helpers,
					});

					expect(result).toBe(undefined);
				});

				it('Returns [] for empty strings', async () => {
					const result = await service.transformers['cast-csv']!({
						value: '',
						action: 'read',
						payload: {},
						accountability: { role: null },
						specials: [],
						helpers,
					});

					expect(result).toMatchObject([]);
				});

				it('Splits the CSV string', async () => {
					const result = await service.transformers['cast-csv']!({
						value: 'test,directus',
						action: 'read',
						payload: {},
						accountability: { role: null },
						specials: [],
						helpers,
					});

					expect(result).toMatchObject(['test', 'directus']);
				});

				it('Saves array values as joined string', async () => {
					const result = await service.transformers['cast-csv']!({
						value: ['test', 'directus'],
						action: 'create',
						payload: {},
						accountability: { role: null },
						specials: [],
						helpers,
					});

					expect(result).toBe('test,directus');
				});

				it('Saves string values as is', async () => {
					const result = await service.transformers['cast-csv']!({
						value: 'test,directus',
						action: 'create',
						payload: {},
						accountability: { role: null },
						specials: [],
						helpers,
					});

					expect(result).toBe('test,directus');
				});
			});
		});
	});
});
