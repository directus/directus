import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { ItemsService } from '../../../services';
import { getSchema } from '../../../utils/get-schema';

describe('ItemsService', () => {
	let db: Knex;
	let tracker: Tracker;
	let itemsService: ItemsService;

	beforeAll(async () => {
		// This causes getDatabaseClient to fail
		db = knex({ client: MockClient });
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	it('it returns one item from directus_users as admin', async () => {
		const schema = await getSchema();
		const table = 'directus_users';

		const rawItem = [
			{
				id: 1,
				many_collection: 'items',
				many_field: 'user_created',
				one_collection: 'directus_users',
				one_field: null,
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: null,
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		];
		const item = { id: 1 };

		tracker.on.select('directus_users').response(rawItem);

		itemsService = new ItemsService(table, {
			knex: db,
			accountability: { role: 'admin', admin: true },
			schema,
		});
		expect(await itemsService.readOne('id')).toStrictEqual(item);
	});
});
