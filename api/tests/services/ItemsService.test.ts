import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { ItemsService } from '../../src/services';
import { systemSchema } from '../__test-utils__/schemas';

jest.mock('../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../src/database/index');

describe('createOne', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;
	let itemsService: ItemsService;
	const item = { id: '6107c897-9182-40f7-b22e-4f044d1258d2', email: 'test@gmail.com', password: 'TestPassword' };

	beforeAll(async () => {
		db = knex({ client: MockClient }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	it('creates one item in collection directus_users as nn admin, accountability: "null"', async () => {
		itemsService = new ItemsService('directus_users', {
			knex: db,
			accountability: { role: 'admin', admin: true },
			schema: systemSchema,
		});

		tracker.on.insert('directus_users').responseOnce(item);

		const response = await itemsService.createOne(item, { emitEvents: false });

		expect(tracker.history.insert.length).toBe(1);
		expect(tracker.history.insert[0].bindings).toStrictEqual([item.id]);
		expect(tracker.history.insert[0].sql).toBe('insert into "directus_users" ("id") values (?)');

		expect(response).toBe(item.id);
	});
});

describe('readOne', () => {
	let db: Knex;
	let tracker: Tracker;
	const rawItem = [{ id: 1 }];

	beforeAll(async () => {
		db = knex({ client: MockClient });
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	it('it returns one item from directus_users as admin', async () => {
		tracker.on.select('directus_users').responseOnce(rawItem);

		const itemsService = new ItemsService('directus_users', {
			knex: db,
			accountability: { role: 'admin', admin: true },
			schema: systemSchema,
		});
		expect(await itemsService.readOne('id')).toStrictEqual(rawItem[0]);
	});

	it('returns one item from directus_users not as admin but has permissions', async () => {
		tracker.on.select('directus_users').responseOnce(rawItem);

		const itemsService = new ItemsService('directus_users', {
			knex: db,
			accountability: {
				role: 'admin',
				admin: false,
				permissions: [
					{
						id: 1,
						role: 'admin',
						collection: 'directus_users',
						action: 'read',
						permissions: {},
						validation: {},
						presets: {},
						fields: [],
					},
				],
			},
			schema: systemSchema,
		});
		const response = await itemsService.readOne(1);

		// Test DB input with the sql submitted
		expect(tracker.history.select.length).toBe(1);
		expect(tracker.history.select[0].bindings).toStrictEqual([1, 100]);
		expect(tracker.history.select[0].sql).toBe(
			'select "directus_users"."id" from "directus_users" where ("directus_users"."id" = ?) order by "directus_users"."id" asc limit ?'
		);

		// Test that the returned item is processed correctly.
		expect(response).toStrictEqual(rawItem[0].id);
	});

	it('denies item from directus_users not as admin but collection accountability "all"', async () => {
		const schema = systemSchema;
		schema.collections.directus_users.accountability = 'all';

		const itemsService = new ItemsService('directus_users', {
			knex: db,
			accountability: {
				role: 'admin',
				admin: false,
			},
			schema: schema,
		});

		expect(() => itemsService.readOne(1)).rejects.toThrow("You don't have permission to access this.");
		expect(tracker.history.select.length).toBe(0);
	});

	it('denies user access when permission action does not match read.', async () => {
		const itemsService = new ItemsService('directus_users', {
			knex: db,
			accountability: {
				role: 'admin',
				admin: false,
				permissions: [
					{
						id: 1,
						role: 'admin',
						collection: 'directus_users',
						action: 'create',
						permissions: {},
						validation: {},
						presets: {},
						fields: [],
					},
				],
			},
			schema: systemSchema,
		});
		expect(() => itemsService.readOne(1)).rejects.toThrow("You don't have permission to access this.");
		expect(tracker.history.select.length).toBe(0);
	});
});

describe('readMany', () => {
	let db: Knex;
	let tracker: Tracker;

	beforeAll(async () => {
		db = knex({ client: MockClient });
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	it('it returns multiple items from directus_users as admin', async () => {
		const items = [{ id: 1 }, { id: 2 }];

		tracker.on.select('directus_users').responseOnce(items);

		const itemsService = new ItemsService('directus_users', {
			knex: db,
			accountability: { role: 'admin', admin: true },
			schema: systemSchema,
		});
		const response = await itemsService.readMany([1, 2]);

		expect(tracker.history.select.length).toBe(1);
		expect(tracker.history.select[0].bindings).toStrictEqual([1, 2, 100]);
		expect(tracker.history.select[0].sql).toBe(
			'select "directus_users"."id" from "directus_users" where ("directus_users"."id" in (?, ?)) order by "directus_users"."id" asc limit ?'
		);

		expect(response).toStrictEqual(items);
	});
});
