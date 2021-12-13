import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { ItemsService } from 'directus';
import { getSchema } from '../../../utils/get-schema';

describe('ItemsService', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;
	let itemsService: ItemsService;

	beforeAll(async () => {
		db = knex({ client: MockClient }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	it('test', async () => {
		tracker.on.insert('directus_users').response(1);
		itemsService = new ItemsService('directus_users', {
			// Use getSchema() to mock schema
			knex: db,
			accountability: { role: 'admin' },
			schema: await getSchema(),
		});
		expect(await itemsService.createOne({ email: 'test@gmail.com', password: 'TestPassword' })).toBe('');
	});
});
