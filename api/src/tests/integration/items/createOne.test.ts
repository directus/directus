import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { ItemsService } from '../../../services';
import { getSchema } from '../../../utils/get-schema';
import { UUID_REGEX } from '../../../constants';

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

	it('creates one item in collection directus_users as an admin', async () => {
		tracker.on.insert('directus_users').response(1);
		tracker.on.insert('directus_activity').responseOnce(1);
		tracker.on.select('directus_activity').responseOnce(1);
		tracker.on.insert('directus_revisions').responseOnce(1);
		tracker.on.select('directus_revisions').responseOnce(1);

		const item = { email: 'test@gmail.com', password: 'TestPassword' };

		itemsService = new ItemsService('directus_users', {
			knex: db,
			accountability: { role: 'admin', admin: true },
			schema: await getSchema(),
		});

		const response = await itemsService.createOne(item);
		const rEx = new RegExp(UUID_REGEX);

		const uuidChecker = typeof response === 'string' ? rEx.test(response) : false;
		expect(uuidChecker).toBe(true);
	});
});
