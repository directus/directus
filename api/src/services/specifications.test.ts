import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { CollectionsService, FieldsService, RelationsService, SpecificationService } from '../../src/services';

jest.mock('../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../src/database/index');

class Client_PG extends MockClient {}

describe('Integration Tests', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = knex({ client: Client_PG }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
		jest.clearAllMocks();
	});

	describe('Services / Specifications', () => {
		describe('oas', () => {
			describe('generate', () => {
				let service: SpecificationService;

				beforeEach(() => {
					service = new SpecificationService({
						knex: db,
						schema: { collections: {}, relations: [] },
					});
				});

				it('returns untyped schema for json fields', async () => {
					jest.spyOn(CollectionsService.prototype, 'readByQuery').mockImplementation(
						jest.fn().mockReturnValue([
							{
								collection: 'test_table',
								meta: {
									accountability: 'all',
									collection: 'test_table',
									group: null,
									hidden: false,
									icon: null,
									item_duplication_fields: null,
									note: null,
									singleton: false,
									translations: null,
								},
								schema: {
									name: 'test_table',
								},
							},
						])
					);

					jest.spyOn(FieldsService.prototype, 'readAll').mockImplementation(
						jest.fn().mockReturnValue([
							{
								collection: 'test_table',
								field: 'id',
								type: 'integer',
								schema: {
									is_nullable: false,
								},
							},
							{
								collection: 'test_table',
								field: 'blob',
								type: 'json',
								schema: {
									is_nullable: true,
								},
							},
						])
					);
					jest.spyOn(RelationsService.prototype, 'readAll').mockImplementation(jest.fn().mockReturnValue([]));

					const spec = await service.oas.generate();
					expect(spec.components?.schemas).toEqual({
						ItemsTestTable: {
							type: 'object',
							properties: {
								id: {
									nullable: false,
									type: 'integer',
								},
								blob: {
									nullable: true,
								},
							},
							'x-collection': 'test_table',
						},
					});
				});
			});
		});
	});
});
