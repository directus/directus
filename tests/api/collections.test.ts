import request from 'supertest';
import vendors from '../get-dbs-to-test';
import config, { getUrl } from '../config';
import knex, { Knex } from 'knex';
import { Collection } from '@directus/shared/types';

const TABLES_AFTER_SEED = [
	'artists',
	'artists_events',
	'events',
	'guests',
	'guests_events',
	'organizers',
	'tours',
	'tours_components',
	'directus_activity',
	'directus_collections',
	'directus_dashboards',
	'directus_fields',
	'directus_files',
	'directus_folders',
	'directus_migrations',
	'directus_notifications',
	'directus_panels',
	'directus_permissions',
	'directus_presets',
	'directus_relations',
	'directus_revisions',
	'directus_roles',
	'directus_sessions',
	'directus_settings',
	'directus_shares',
	'directus_users',
	'directus_webhooks',
];

describe('/collections', () => {
	const databases = new Map<string, Knex>();

	beforeAll(() => {
		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));
		}
	});

	afterAll(() => {
		for (const [_vendor, connection] of databases) {
			connection.destroy();
		}
	});

	describe.each(vendors)('%s', (vendor) => {
		describe('GET /', () => {
			test('Returns all tables for admin users', async () => {
				const response = await request(getUrl(vendor))
					.get('/collections')
					.set('Authorization', 'Bearer AdminToken')
					.expect(200);

				const responseData = JSON.parse(response.text);
				const tableNames = responseData.data.map((collection: Collection) => collection.collection).sort();

				expect(responseData.data.length).toBe(TABLES_AFTER_SEED.length);
				expect(tableNames).toEqual(TABLES_AFTER_SEED.sort());
			});
		});

		describe('POST /', () => {
			const TEST_COLLECTION_NAME = 'test_creation';

			afterEach(async () => {
				const db = databases.get(vendor)!;
				await db.schema.dropTableIfExists(TEST_COLLECTION_NAME);
				await db('directus_collections').del().where({ collection: TEST_COLLECTION_NAME });
			});

			test('Creates a new regular collection', async () => {
				const db = databases.get(vendor)!;

				const response = await request(getUrl(vendor))
					.post('/collections')
					.send({ collection: TEST_COLLECTION_NAME, meta: {}, schema: {} })
					.set('Authorization', 'Bearer AdminToken')
					.expect(200);

				expect(response.body.data.collection).toBe(TEST_COLLECTION_NAME);
				expect(response.body.data.meta.collection).toBe(TEST_COLLECTION_NAME);
				expect(response.body.data.schema.name).toBe(TEST_COLLECTION_NAME);
				expect(await db.schema.hasTable(TEST_COLLECTION_NAME)).toBe(true);
			});

			test('Creates a new folder', async () => {
				const db = databases.get(vendor)!;

				const response = await request(getUrl(vendor))
					.post('/collections')
					.send({ collection: TEST_COLLECTION_NAME, meta: {}, schema: null })
					.set('Authorization', 'Bearer AdminToken')
					.expect(200);

				expect(response.body.data.collection).toBe(TEST_COLLECTION_NAME);
				expect(response.body.data.schema).toBeNull();
				expect(response.body.data.meta.collection).toBe(TEST_COLLECTION_NAME);
				expect(await db.schema.hasTable(TEST_COLLECTION_NAME)).toBe(false);
			});
		});

		describe('DELETE /', () => {
			const TEST_COLLECTION_NAME = 'test_creation';

			test('Deletes a regular collection', async () => {
				const db = databases.get(vendor)!;

				await request(getUrl(vendor))
					.post('/collections')
					.send({ collection: TEST_COLLECTION_NAME, meta: {}, schema: {} })
					.set('Authorization', 'Bearer AdminToken')
					.expect(200);

				expect(await db.schema.hasTable(TEST_COLLECTION_NAME)).toBe(true);

				const response = await request(getUrl(vendor))
					.delete('/collections/' + TEST_COLLECTION_NAME)
					.set('Authorization', 'Bearer AdminToken')
					.expect(204);

				expect(response.body).toEqual({});
				expect(await db.schema.hasTable(TEST_COLLECTION_NAME)).toBe(false);
			});

			test('Deletes a folder', async () => {
				const db = databases.get(vendor)!;

				await request(getUrl(vendor))
					.post('/collections')
					.send({ collection: TEST_COLLECTION_NAME, meta: {}, schema: null })
					.set('Authorization', 'Bearer AdminToken')
					.expect(200);

				expect(await db('directus_collections').select().where({ collection: TEST_COLLECTION_NAME })).toHaveLength(1);

				const response = await request(getUrl(vendor))
					.delete('/collections/' + TEST_COLLECTION_NAME)
					.set('Authorization', 'Bearer AdminToken')
					.expect(204);

				expect(response.body).toEqual({});
				expect(await db('directus_collections').select().where({ collection: TEST_COLLECTION_NAME })).toHaveLength(0);
			});
		});
	});
});
