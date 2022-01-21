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
	const tables = [
		{ tableType: 'system', schema: systemSchema, table: 'directus_users' },
		{ tableType: 'user', schema: userSchema, table: 'authors' },
	];

	beforeAll(async () => {
		db = knex({ client: MockClient }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('createOne', () => {
		const item = { id: '6107c897-9182-40f7-b22e-4f044d1258d2', email: 'test@gmail.com', password: 'TestPassword' };

		it.each(tables)(`%s creates one item in collection as an admin, accountability: "null"`, async (table) => {
			const itemsService = new ItemsService(table.table, {
				knex: db,
				accountability: { role: 'admin', admin: true },
				schema: table.schema,
			});

			tracker.on.insert(table.table).responseOnce(item);

			const response = await itemsService.createOne(item, { emitEvents: false });

			expect(tracker.history.insert.length).toBe(1);
			expect(tracker.history.insert[0].bindings).toStrictEqual([item.id]);
			expect(tracker.history.insert[0].sql).toBe(`insert into "${table.table}" ("id") values (?)`);

			expect(response).toBe(item.id);
		});
	});

	describe('readOne', () => {
		const rawItems = [{ id: 1 }, { id: 2 }];

		it.each(tables)('%s it returns one item from table as admin', async (table) => {
			tracker.on.select(table.table).responseOnce(rawItems);

			const itemsService = new ItemsService(table.table, {
				knex: db,
				accountability: { role: 'admin', admin: true },
				schema: table.schema,
			});
			const response = await itemsService.readOne(rawItems[0].id);

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual([rawItems[0].id, 100]);
			expect(tracker.history.select[0].sql).toBe(
				`select "${table.table}"."id" from "${table.table}" where "${table.table}"."id" = ? order by "${table.table}"."id" asc limit ?`
			);

			expect(response).toStrictEqual(rawItems[0]);
		});

		it.each(tables)('%s returns one item from table not as admin but has permissions', async (table) => {
			tracker.on.select(table.table).responseOnce(rawItems);

			const itemsService = new ItemsService(table.table, {
				knex: db,
				accountability: {
					role: 'admin',
					admin: false,
					permissions: [
						{
							id: 1,
							role: 'admin',
							collection: table.table,
							action: 'read',
							permissions: {},
							validation: {},
							presets: {},
							fields: [],
						},
					],
				},
				schema: table.schema,
			});
			const response = await itemsService.readOne(rawItems[0].id);

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual([rawItems[0].id, 100]);
			expect(tracker.history.select[0].sql).toBe(
				`select "${table.table}"."id" from "${table.table}" where ("${table.table}"."id" = ?) order by "${table.table}"."id" asc limit ?`
			);

			expect(response).toStrictEqual(rawItems[0].id);
		});

		it.each(tables)('%s denies item from table not as admin but collection accountability "all"', async (table) => {
			const schema = table.schema;
			schema.collections[table.table].accountability = 'all';

			const itemsService = new ItemsService(table.table, {
				knex: db,
				accountability: {
					role: 'admin',
					admin: false,
				},
				schema: schema,
			});

			expect(() => itemsService.readOne(rawItems[0].id)).rejects.toThrow("You don't have permission to access this.");
			expect(tracker.history.select.length).toBe(0);
		});

		it.each(tables)('%s denies user access when permission action does not match read.', async (table) => {
			const itemsService = new ItemsService(table.table, {
				knex: db,
				accountability: {
					role: 'admin',
					admin: false,
					permissions: [
						{
							id: 1,
							role: 'admin',
							collection: table.table,
							action: 'create',
							permissions: {},
							validation: {},
							presets: {},
							fields: [],
						},
					],
				},
				schema: table.schema,
			});
			expect(() => itemsService.readOne(rawItems[0].id)).rejects.toThrow("You don't have permission to access this.");
			expect(tracker.history.select.length).toBe(0);
		});
	});

	describe('readMany', () => {
		const items = [{ id: 1 }, { id: 2 }];

		it.each(tables)('%s it returns multiple items from table as admin', async (table) => {
			tracker.on.select(table.table).responseOnce(items);

			const itemsService = new ItemsService(table.table, {
				knex: db,
				accountability: { role: 'admin', admin: true },
				schema: table.schema,
			});
			const response = await itemsService.readMany([1, 2]);

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual([1, 2, 100]);
			expect(tracker.history.select[0].sql).toBe(
				`select "${table.table}"."id" from "${table.table}" where ("${table.table}"."id" in (?, ?)) order by "${table.table}"."id" asc limit ?`
			);

			expect(response).toStrictEqual(items);
		});
	});
});
