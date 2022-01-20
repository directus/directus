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
		expect(await itemsService.readMany(['id'])).toStrictEqual(items);
	});
});
