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
			// note the difference between an empty array and ['Empty']
			tracker.on.select('directus_migrations').response(['Empty']);
			await run(db, 'up').catch((e: Error) => {
				expect(e).toBeInstanceOf(Error);
				expect(e.message).toBe('Nothing to upgrade');
			});
		});
	});
});
