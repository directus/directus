import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { ItemsService } from '../../../services';
import { systemSchema } from '../utils/schemas';

jest.mock('../../../database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../../database/index');

describe('ItemsService', () => {
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
		expect(response).toBe('6107c897-9182-40f7-b22e-4f044d1258d2');
	});
	it('denies create on directus_users not as an admin, accountability: "all", no permissions', async () => {
		const schema = systemSchema;
		schema.collections.directus_users.accountability = 'all';

		itemsService = new ItemsService('directus_users', {
			knex: db,
			accountability: {
				role: 'user',
				admin: false,
			},
			schema: schema,
		});

		tracker.on.insert('directus_users').responseOnce(item);

		expect(() => itemsService.createOne(item, { emitEvents: false })).rejects.toThrow(
			"You don't have permission to access this."
		);
	});
});
