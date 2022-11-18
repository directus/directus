import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { CollectionsService, FieldsService, RelationsService, SpecificationService } from '../../src/services';
import { describe, beforeAll, afterEach, it, expect, vi, beforeEach, MockedFunction } from 'vitest';

class Client_PG extends MockClient {}

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = vi.mocked(knex({ client: Client_PG }));
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	describe('Services / Specifications', () => {
		describe('oas', () => {
			describe('generate', () => {
				let service: SpecificationService;

				beforeEach(() => {
					service = new SpecificationService({
						knex: db,
						schema: { collections: {}, relations: [] },
						accountability: { role: 'admin', admin: true },
					});
				});

				describe('schema', () => {
					it('returns untyped schema for json fields', async () => {
						vi.spyOn(CollectionsService.prototype, 'readByQuery').mockImplementation(
							vi.fn().mockReturnValue([
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

						vi.spyOn(FieldsService.prototype, 'readAll').mockImplementation(
							vi.fn().mockReturnValue([
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
						vi.spyOn(RelationsService.prototype, 'readAll').mockImplementation(vi.fn().mockReturnValue([]));

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
							Query: {
								type: 'object',
								properties: {
									fields: {
										type: 'array',
										items: {
											type: 'string',
										},
										description: 'Control what fields are being returned in the object.',
										example: ['*', '*.*'],
									},
									filter: {
										type: 'object',
										example: {
											'<field>': {
												'<operator>': '<value>',
											},
										},
									},
									search: {
										description: 'Filter by items that contain the given search query in one of their fields.',
										type: 'string',
									},
									sort: {
										type: 'array',
										items: {
											type: 'string',
										},
										description: 'How to sort the returned items.',
										example: ['-date_created'],
									},
									limit: {
										type: 'number',
										description: 'Set the maximum number of items that will be returned',
									},
									offset: {
										type: 'number',
										description: 'How many items to skip when fetching data.',
									},
									page: {
										type: 'number',
										description: 'Cursor for use in pagination. Often used in combination with limit.',
									},
									deep: {
										type: 'object',
										description:
											'Deep allows you to set any of the other query parameters on a nested relational dataset.',
										example: {
											related_articles: {
												_limit: 3,
											},
										},
									},
								},
							},
							'x-metadata': {
								type: 'object',
								properties: {
									total_count: {
										description: "Returns the total item count of the collection you're querying.",
										type: 'integer',
									},
									filter_count: {
										description:
											"Returns the item count of the collection you're querying, taking the current filter/search parameters into account.",
										type: 'integer',
									},
								},
							},
						});
					});
				});

				describe('path', () => {
					it('requestBody for CreateItems POST path should not have type in schema', async () => {
						const collection = {
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
						};

						vi.spyOn(CollectionsService.prototype, 'readByQuery').mockImplementation(
							vi.fn().mockReturnValue([collection])
						);

						vi.spyOn(FieldsService.prototype, 'readAll').mockImplementation(
							vi.fn().mockReturnValue([
								{
									collection: collection.collection,
									field: 'id',
									type: 'integer',
									schema: {
										is_nullable: false,
									},
								},
							])
						);
						vi.spyOn(RelationsService.prototype, 'readAll').mockImplementation(vi.fn().mockReturnValue([]));

						const spec = await service.oas.generate();

						const targetSchema =
							spec.paths[`/items/${collection.collection}`].post.requestBody.content['application/json'].schema;

						expect(targetSchema).toHaveProperty('oneOf');
						expect(targetSchema).not.toHaveProperty('type');
					});
				});
			});
		});
	});
});
