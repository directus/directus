import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CollectionsService, FieldsService, RelationsService, SpecificationService } from '../../src/services';
import { Collection } from '../types';

vi.mock('../../src/database/index', async () => {
	const actual = await vi.importActual('@directus/shared/utils/node');

	return {
		...(actual as object),
		getDatabaseClient: vi.fn().mockReturnValue('postgres'),
	};
});

class Client_PG extends MockClient {}

describe('Integration Tests', () => {
	let db: Knex;
	let tracker: Tracker;

	beforeAll(async () => {
		db = knex({ client: Client_PG });
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
						vi.spyOn(CollectionsService.prototype, 'readByQuery').mockResolvedValue([
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
						] as any[]);

						vi.spyOn(FieldsService.prototype, 'readAll').mockResolvedValue([
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
						]);
						vi.spyOn(RelationsService.prototype, 'readAll').mockResolvedValue([]);

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

				describe('path', () => {
					it('requestBody for CreateItems POST path should not have type in schema', async () => {
						const collection: Collection = {
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
								translations: {},
							},
							schema: {
								name: 'test_table',
							},
						};

						vi.spyOn(CollectionsService.prototype, 'readByQuery').mockResolvedValue([collection]);

						vi.spyOn(FieldsService.prototype, 'readAll').mockResolvedValue([
							{
								collection: collection.collection,
								field: 'id',
								type: 'integer',
								schema: {
									is_nullable: false,
								},
							},
						]);
						vi.spyOn(RelationsService.prototype, 'readAll').mockResolvedValue([]);

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
