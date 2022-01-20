import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { ItemsService } from '../../../services';
import { systemSchema } from '../utils/schemas';

jest.mock('../../../database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../../database/index');

describe('ItemsService', () => {
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
		expect(await itemsService.readOne('id')).toStrictEqual(rawItem[0].id);
	});

	it('denies item from directus_users not as admin but collection accountability "all"', async () => {
		const schema = systemSchema;
		schema.collections.directus_users.accountability = 'all';

		tracker.on.select('directus_users').responseOnce(rawItem);

		const itemsService = new ItemsService('directus_users', {
			knex: db,
			accountability: {
				role: 'admin',
				admin: false,
			},
			schema: schema,
		});
		expect(() => itemsService.readOne('id')).rejects.toThrow("You don't have permission to access this.");
	});

	it('denies user access when permission action does not match read.', async () => {
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
		expect(() => itemsService.readOne('id')).rejects.toThrow("You don't have permission to access this.");
	});
});
