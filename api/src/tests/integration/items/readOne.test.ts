import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { ItemsService } from 'directus';
import { getSchema } from '../../../utils/get-schema';

jest.mock;

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

	it('it returns one item from [the collection]', async () => {
		// goal: mock the knex return at runAST() to return one fake item
		// via the ItemsService.readOne()
		// Challenges: Mocking the DB throughout the chain of events.
		// Need to mock: DB, .env, maybe permissions?

		// use getSchema() to mock the schema
		// Test multiple permissions via accountability: {role}
		// need to get past the authentication error by mocking the call in runAST.run()
		// Right now having process.env.DB_USER = "postgres" throws an error
		tracker.on.select('*').response({ email: '', user: '' });
		itemsService = new ItemsService('test', {
			knex: db,
			accountability: { role: 'admin' },
			schema: await getSchema(),
		});
		expect(await itemsService.readOne('id')).toBe('');
	});
});
