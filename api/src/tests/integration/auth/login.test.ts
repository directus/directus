import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { AuthenticationService } from 'directus';

// need to mock auth provider
describe('AuthenticationService', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;
	let authService: any;

	beforeAll(async () => {
		db = knex({ client: MockClient }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	it('test', async () => {
		authService = new AuthenticationService({
			knex: db,
			accountability: { role: 'admin' },
			schema: { collections: {}, relations: [] },
		});
		expect(await authService.login('default', { email: 'test@gmail.com', password: 'TestPassword' })).toBe('');
	});
});
