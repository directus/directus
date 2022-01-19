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
	let itemsService: ItemsService;

	beforeAll(async () => {
		db = knex({ client: MockClient });
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	it('it returns one item from directus_users as admin', async () => {
		const schema = systemSchema;
		const table = 'directus_users';

		const rawItem = [{ id: 1 }];
		const item = { id: 1 };

		tracker.on.select('directus_users').responseOnce(rawItem);

		itemsService = new ItemsService(table, {
			knex: db,
			accountability: { role: 'admin', admin: true },
			schema,
		});
		expect(await itemsService.readOne('id')).toStrictEqual(item);
	});
});
