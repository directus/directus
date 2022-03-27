import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { PayloadService } from '../../src/services';

jest.mock('../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../src/database/index');

describe('Integration Tests', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = knex({ client: MockClient }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / PayloadService', () => {
		describe('transformers', () => {
			let service: PayloadService;

			beforeEach(() => {
				service = new PayloadService('test', {
					knex: db,
					schema: { collections: {}, relations: [] },
				});
			});

			describe('csv', () => {
				it('Returns undefined for illegal values', async () => {
					const result = await service.transformers['cast-csv']({
						value: 123,
						action: 'read',
						payload: {},
						accountability: { role: null },
						specials: [],
					});

					expect(result).toBe(undefined);
				});

				it('Returns [] for empty strings', async () => {
					const result = await service.transformers['cast-csv']({
						value: '',
						action: 'read',
						payload: {},
						accountability: { role: null },
						specials: [],
					});

					expect(result).toMatchObject([]);
				});

				it('Splits the CSV string', async () => {
					const result = await service.transformers['cast-csv']({
						value: 'test,directus',
						action: 'read',
						payload: {},
						accountability: { role: null },
						specials: [],
					});

					expect(result).toMatchObject(['test', 'directus']);
				});

				it('Saves array values as joined string', async () => {
					const result = await service.transformers['cast-csv']({
						value: ['test', 'directus'],
						action: 'create',
						payload: {},
						accountability: { role: null },
						specials: [],
					});

					expect(result).toBe('test,directus');
				});

				it('Saves string values as is', async () => {
					const result = await service.transformers['cast-csv']({
						value: 'test,directus',
						action: 'create',
						payload: {},
						accountability: { role: null },
						specials: [],
					});

					expect(result).toBe('test,directus');
				});
			});
		});
	});
});
