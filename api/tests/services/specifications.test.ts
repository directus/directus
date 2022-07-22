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

				it('returns correct schema for repeater fields', async () => {
					const readByQueryCollectionSpy = jest.spyOn(CollectionsService.prototype, 'readByQuery').mockImplementation(
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
					const readAllFieldsSpy = jest.spyOn(FieldsService.prototype, 'readAll').mockImplementation(
						jest.fn().mockReturnValue([
							{
								collection: 'test_table',
								field: 'id',
								type: 'integer',
								schema: {
									name: 'id',
									table: 'test_table',
									data_type: 'integer',
									is_nullable: false,
									generation_expression: null,
									default_value: 'nextval(\'"Test_id_seq"\'::regclass)',
									is_generated: false,
									max_length: null,
									numeric_precision: 32,
									numeric_scale: 0,
									is_unique: true,
									is_primary_key: true,
									has_auto_increment: true,
									foreign_key_table: null,
									foreign_key_column: null,
								},
								meta: {
									id: 1,
									collection: 'test_table',
									field: 'id',
									group: null,
									hidden: true,
									interface: 'input',
									display: null,
									options: null,
									display_options: null,
									readonly: true,
									required: false,
									sort: null,
									special: null,
									translations: null,
									width: 'full',
									note: null,
									conditions: null,
									validation: null,
									validation_message: null,
								},
							},
							{
								collection: 'test_table',
								field: 'repeater',
								type: 'json',
								schema: {
									name: 'repeater',
									table: 'test_table',
									data_type: 'json',
									is_nullable: true,
									generation_expression: null,
									default_value: null,
									is_generated: false,
									max_length: null,
									numeric_precision: null,
									numeric_scale: null,
									is_unique: false,
									is_primary_key: false,
									has_auto_increment: false,
									foreign_key_table: null,
									foreign_key_column: null,
								},
								meta: {
									id: 2,
									collection: 'test_table',
									field: 'repeater',
									group: null,
									hidden: false,
									interface: 'list',
									display: null,
									options: {
										fields: [
											{
												field: 'field_one',
												name: 'field_one',
												type: 'string',
												meta: {
													field: 'field_one',
													type: 'string',
													interface: 'input',
												},
											},
											{
												field: 'field_two',
												name: 'field_two',
												type: 'integer',
												meta: {
													field: 'field_two',
													type: 'integer',
													interface: 'slider',
													options: {
														minValue: 0,
														maxValue: 10,
													},
												},
											},
										],
									},
									display_options: null,
									readonly: false,
									required: false,
									sort: null,
									special: ['cast-json'],
									translations: null,
									width: 'full',
									note: null,
									conditions: null,
									validation: null,
									validation_message: null,
								},
							},
						])
					);
					const readAlRelationsSpy = jest
						.spyOn(RelationsService.prototype, 'readAll')
						.mockImplementation(jest.fn().mockReturnValue([]));

					const spec = await service.oas.generate();
					expect(spec.components?.schemas).toEqual({
						ItemsTestTable: {
							type: 'object',
							properties: {
								id: {
									description: undefined,
									nullable: false,
									type: 'integer',
								},
								repeater: {
									description: undefined,
									nullable: true,
									type: 'array',
									items: {
										type: 'object',
										properties: {
											field_one: {
												type: 'string',
											},
											field_two: {
												type: 'integer',
												minimum: 0,
												maximum: 10,
											},
										},
									},
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
