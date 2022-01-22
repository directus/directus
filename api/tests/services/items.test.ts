import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { ItemsService } from '../../src/services';
import { systemSchema, userSchema } from '../__test-utils__/schemas';

jest.mock('../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../src/database/index');

describe('Integration Tests', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;

	const schemas: Record<string, any> = {
		system: { schema: systemSchema, table: 'directus_users' },
		user: { schema: userSchema, table: 'authors' },
	};

	beforeAll(async () => {
		db = knex({ client: MockClient }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('createOne', () => {
		const item = { id: '6107c897-9182-40f7-b22e-4f044d1258d2', email: 'test@gmail.com', password: 'TestPassword' };

		it.each(Object.keys(schemas))(
			`%s creates one item in collection as an admin, accountability: "null"`,
			async (schema) => {
				const itemsService = new ItemsService(schemas[schema].table, {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: schemas[schema].schema,
				});

				tracker.on.insert(schemas[schema].table).responseOnce(item);

				const response = await itemsService.createOne(item, { emitEvents: false });

				expect(tracker.history.insert.length).toBe(1);
				expect(tracker.history.insert[0].bindings).toStrictEqual([item.id]);
				expect(tracker.history.insert[0].sql).toBe(`insert into "${schemas[schema].table}" ("id") values (?)`);

				expect(response).toBe(item.id);
			}
		);
	});

	describe('readOne', () => {
		const rawItems = [{ id: 1 }, { id: 2 }];

		describe('Permissions, Authorization, Roles', () => {
			it.each(Object.keys(schemas))('%s it returns one item from table as admin', async (schema) => {
				tracker.on.select(schemas[schema].table).responseOnce(rawItems);

				const itemsService = new ItemsService(schemas[schema].table, {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: schemas[schema].schema,
				});
				const response = await itemsService.readOne(rawItems[0].id);

				expect(tracker.history.select.length).toBe(1);
				expect(tracker.history.select[0].bindings).toStrictEqual([rawItems[0].id, 100]);
				expect(tracker.history.select[0].sql).toBe(
					`select "${schemas[schema].table}"."id" from "${schemas[schema].table}" where "${schemas[schema].table}"."id" = ? order by "${schemas[schema].table}"."id" asc limit ?`
				);

				expect(response).toStrictEqual(rawItems[0]);
			});

			it.each(Object.keys(schemas))(
				'%s returns one item from table not as admin but has permissions',
				async (schema) => {
					tracker.on.select(schemas[schema].table).responseOnce(rawItems);

					const itemsService = new ItemsService(schemas[schema].table, {
						knex: db,
						accountability: {
							role: 'admin',
							admin: false,
							permissions: [
								{
									id: 1,
									role: 'admin',
									collection: schemas[schema].table,
									action: 'read',
									permissions: {},
									validation: {},
									presets: {},
									fields: [],
								},
							],
						},
						schema: schemas[schema].schema,
					});
					const response = await itemsService.readOne(rawItems[0].id);

					expect(tracker.history.select.length).toBe(1);
					expect(tracker.history.select[0].bindings).toStrictEqual([rawItems[0].id, 100]);
					expect(tracker.history.select[0].sql).toBe(
						`select "${schemas[schema].table}"."id" from "${schemas[schema].table}" where ("${schemas[schema].table}"."id" = ?) order by "${schemas[schema].table}"."id" asc limit ?`
					);

					expect(response).toStrictEqual(rawItems[0].id);
				}
			);

			it.each(Object.keys(schemas))(
				'%s denies item from table not as admin but collection accountability "all"',
				async (schema) => {
					const customSchema = schemas[schema].schema;
					customSchema.collections[schemas[schema].table].accountability = 'all';

					const itemsService = new ItemsService(schemas[schema].table, {
						knex: db,
						accountability: {
							role: 'admin',
							admin: false,
						},
						schema: customSchema,
					});

					expect(() => itemsService.readOne(rawItems[0].id)).rejects.toThrow(
						"You don't have permission to access this."
					);
					expect(tracker.history.select.length).toBe(0);
				}
			);

			it.each(Object.keys(schemas))(
				'%s denies user access when permission action does not match read.',
				async (schema) => {
					const itemsService = new ItemsService(schemas[schema].table, {
						knex: db,
						accountability: {
							role: 'admin',
							admin: false,
							permissions: [
								{
									id: 1,
									role: 'admin',
									collection: schemas[schema].table,
									action: 'create',
									permissions: {},
									validation: {},
									presets: {},
									fields: [],
								},
							],
						},
						schema: schemas[schema].schema,
					});
					expect(() => itemsService.readOne(rawItems[0].id)).rejects.toThrow(
						"You don't have permission to access this."
					);
					expect(tracker.history.select.length).toBe(0);
				}
			);
		});
	});

	describe('readMany', () => {
		const items = [{ id: 1 }, { id: 2 }];

		it.each(Object.keys(schemas))('%s it returns multiple items from table as admin', async (schema) => {
			tracker.on.select(schemas[schema].table).responseOnce(items);

			const itemsService = new ItemsService(schemas[schema].table, {
				knex: db,
				accountability: { role: 'admin', admin: true },
				schema: schemas[schema].schema,
			});
			const response = await itemsService.readMany([1, 2]);

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual([1, 2, 100]);
			expect(tracker.history.select[0].sql).toBe(
				`select "${schemas[schema].table}"."id" from "${schemas[schema].table}" where ("${schemas[schema].table}"."id" in (?, ?)) order by "${schemas[schema].table}"."id" asc limit ?`
			);

			expect(response).toStrictEqual(items);
		});

		describe('Global Query Params', () => {
			it.each(Object.keys(schemas))(`Filter: %s {id: {_eq: ${items[1].id}}}`, async (schema) => {
				tracker.on.select(schemas[schema].table).responseOnce([items[1]]);

				const itemsService = new ItemsService(schemas[schema].table, {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: schemas[schema].schema,
				});
				const response = await itemsService.readMany([], { filter: { id: { _eq: items[1].id } } });

				expect(tracker.history.select.length).toBe(1);
				expect(tracker.history.select[0].bindings).toStrictEqual([0, items[1].id, 100]);
				expect(tracker.history.select[0].sql).toBe(
					`select "${schemas[schema].table}"."id" from "${schemas[schema].table}" where (1 = ? and "${schemas[schema].table}"."id" = ?) order by "${schemas[schema].table}"."id" asc limit ?`
				);

				expect(response).toStrictEqual([items[1]]);
			});
		});
	});
});
