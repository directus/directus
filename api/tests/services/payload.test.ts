import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { PayloadService } from '../../src/services';
import { getHelpers, Helpers } from '../../src/database/helpers';
import { userSchema } from '../__test-utils__/schemas';
import { ItemsService } from '../../src/services';
import { PrimaryKey } from '../../src/types';

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
		describe('relations', () => {
			let service: PayloadService;
			let upsertMany: jest.SpyInstance<Promise<PrimaryKey[]>>;
			let updateByQuery: jest.SpyInstance<Promise<PrimaryKey[]>>;

			beforeEach(() => {
				service = new PayloadService('authors', {
					knex: db,
					schema: userSchema,
				});
				upsertMany = jest.spyOn(ItemsService.prototype, 'upsertMany').mockResolvedValue([1]);
				updateByQuery = jest.spyOn(ItemsService.prototype, 'updateByQuery').mockResolvedValue([1]);
			});

			afterEach(() => {
				upsertMany.mockClear();
				updateByQuery.mockClear();
			});

			describe('process02m', () => {
				it('replaces unset sort field with highest value', async () => {
					tracker.on.select('id').response([{ id: undefined }]);

					tracker.on.select('posts').response([{ id: 1 }]);
					tracker.on.select('authors').response([{ id: 1 }]);

					await service.processO2M({ items: [{ id: undefined }] }, 'testing-sort-field');

					expect(upsertMany.mock.calls[0][0]).toStrictEqual([{ id: 1, uploaded_by: 'testing-sort-field' }]);
				});

				it('leaves set sort field', async () => {
					tracker.on.select('testing-sort-field').response([{ id: 3 }]);

					tracker.on.select('posts').response([{ id: 3 }]);
					tracker.on.select('authors').response([{ id: 3 }]);

					await service.processO2M({ items: [{ id: 3 }] }, 'testing-sort-field');

					expect(upsertMany.mock.calls[0][0]).toStrictEqual([{ id: 3, uploaded_by: 'testing-sort-field' }]);
				});
			});
		});
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
					const result = await service.transformers['cast-csv']({
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
					const result = await service.transformers['cast-csv']({
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
					const result = await service.transformers['cast-csv']({
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
					const result = await service.transformers['cast-csv']({
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
					const result = await service.transformers['cast-csv']({
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
