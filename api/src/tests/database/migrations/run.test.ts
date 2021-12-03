import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import run from '../../../database/migrations/run';

describe('run', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;

	beforeAll(() => {
		db = knex({ client: MockClient }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('when passed the argument up', () => {
		it('returns "Nothing To Updage" if no directus_migrations', async () => {
			tracker.on.select('directus_migrations').response(['hello']);
			expect(await run(db, 'up')).rejects.toEqual('Nothing to upgrade');
		});
	});
});
