import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { ItemsService } from 'directus';
import { FieldNode } from '../../../types/ast';
import { getSchema } from '../../../utils/get-schema';
import { getColumnPreprocessor } from '../../../database/run-ast';

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

	it('it returns one item from [the collection] as admin', async () => {
		// goal: mock the knex return at runAST() to return one fake item
		// via the ItemsService.readOne()
		// Challenges: Mocking the DB throughout the chain of events.
		// Need to mock: DB, .env, maybe permissions?

		// use getSchema() to mock the schema
		// Test multiple permissions via accountability: { role }

		// this test is less black box than I want it to be. Especially without unit tests for getColumnPreprocessor()
		const schema = await getSchema();
		const table = 'directus_users';
		const item = { email: 'test@gmail.com', password: 'TestPassword' };
		const fieldNodes = [
			{ type: 'field', name: 'id', fieldKey: 'id' },
			{ type: 'field', name: 'status', fieldKey: 'status' },
			{ type: 'field', name: 'sort', fieldKey: 'sort' },
			{ type: 'field', name: 'user_created', fieldKey: 'user_created' },
			{ type: 'field', name: 'date_created', fieldKey: 'date_created' },
			{ type: 'field', name: 'user_updated', fieldKey: 'user_updated' },
			{ type: 'field', name: 'date_updated', fieldKey: 'date_updated' },
			{ type: 'field', name: 'name', fieldKey: 'name' },
		] as FieldNode[];

		// how to mock fieldNodes for the query selector?
		const preProcess = getColumnPreprocessor(db, schema, table);
		tracker.on.select(fieldNodes.map(preProcess)).response(item);

		itemsService = new ItemsService(table, {
			knex: db,
			accountability: { role: 'admin' },
			schema,
		});

		expect(
			await itemsService.readOne('id', {
				filter: { id: { _eq: 'cd908105-e086-4dde-b811-f7c18d7c4d3d' } },
				sort: ['id'],
			})
		).toBe(item);
	});
});
