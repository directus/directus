import knex, { Knex } from 'knex';
import request from 'supertest';
import config, { getUrl } from '../config';
import vendors from '../get-dbs-to-test';

describe('/fields', () => {
	const databases = new Map<string, Knex>();
	const TEST_COLLECTION_ONE = 'test_collection_a';
	const TEST_COLLECTION_TWO = 'test_collection_b';
	const TEST_FIELD_NAME = 'test_field';
	const TEST_FIELD_TYPE = 'integer';

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
		beforeAll(async () => {
			const db = databases.get(vendor)!;
			await db.schema.createTable(TEST_COLLECTION_ONE, function (table) {
				table.increments('id');
			});
			await db.schema.createTable(TEST_COLLECTION_TWO, function (table) {
				table.increments('id');
			});
		});

		afterAll(async () => {
			const db = databases.get(vendor)!;
			await db.schema.dropTableIfExists(TEST_COLLECTION_ONE);
			await db.schema.dropTableIfExists(TEST_COLLECTION_TWO);
		});

		describe('POST /:collection', () => {
			test('Creates a new field', async () => {
				const response = await request(getUrl(vendor))
					.post(`/fields/${TEST_COLLECTION_ONE}`)
					.send({
						collection: TEST_COLLECTION_ONE,
						field: TEST_FIELD_NAME,
						type: 'integer',
						schema: {},
						meta: {
							interface: 'select-dropdown-m2o',
							special: ['m2o'],
						},
					})
					.set('Authorization', 'Bearer AdminToken')
					.expect(200);

				const { data } = response.body;

				expect(data.collection).toBe(TEST_COLLECTION_ONE);
				expect(data.field).toBe(TEST_FIELD_NAME);
				expect(data.type).toBe(TEST_FIELD_TYPE);
			});
		});

		describe('GET /', () => {
			test('Returns all fields for admin users', async () => {
				const response = await request(getUrl(vendor))
					.get('/fields')
					.set('Authorization', 'Bearer AdminToken')
					.expect(200);

				const { data } = response.body;

				expect(data).toBeInstanceOf(Array);
				expect(data.length).toBeGreaterThan(0);
			});
		});

		describe('GET /:collection', () => {
			test('Returns all fields in "test_collection_a" collection for admin users', async () => {
				const response = await request(getUrl(vendor))
					.get(`/fields/${TEST_COLLECTION_ONE}`)
					.set('Authorization', 'Bearer AdminToken')
					.expect(200);

				const { data } = response.body;

				// "id" field and the newly created "test_field" field
				expect(data.length).toBe(2);
			});
		});

		describe('GET /:collection/:field', () => {
			test('Returns "test_field" field in "test_collection_a" collection for admin users', async () => {
				const response = await request(getUrl(vendor))
					.get(`/fields/${TEST_COLLECTION_ONE}/${TEST_FIELD_NAME}`)
					.set('Authorization', 'Bearer AdminToken')
					.expect(200);

				const { data } = response.body;

				expect(data.collection).toBe(TEST_COLLECTION_ONE);
				expect(data.field).toBe(TEST_FIELD_NAME);
				expect(data.type).toBe(TEST_FIELD_TYPE);
			});
		});

		describe('PATCH /:collection/:field', () => {
			// This specifically tests for updating M2O field to an increments id field on MySQL
			// as MySQL creates unsigned integer field for increments()
			test('Update "test_field" field is_nullable to false', async () => {
				const response = await request(getUrl(vendor))
					.patch(`/fields/${TEST_COLLECTION_ONE}/${TEST_FIELD_NAME}`)
					.set('Authorization', 'Bearer AdminToken')
					.send({
						collection: TEST_COLLECTION_ONE,
						field: TEST_FIELD_NAME,
						type: 'integer',
						schema: {
							is_nullable: false,
						},
					})
					.expect(200);

				const { data } = response.body;

				expect(data.collection).toBe(TEST_COLLECTION_ONE);
				expect(data.field).toBe(TEST_FIELD_NAME);
				expect(data.type).toBe(TEST_FIELD_TYPE);
			});
		});

		describe('DELETE /:collection/:field', () => {
			test('Deletes a field', async () => {
				const db = databases.get(vendor)!;

				await request(getUrl(vendor))
					.delete(`/fields/${TEST_COLLECTION_ONE}/${TEST_FIELD_NAME}`)
					.set('Authorization', 'Bearer AdminToken')
					.expect(204);

				const hasColumnResult = await db.schema.hasColumn(TEST_COLLECTION_ONE, TEST_FIELD_NAME);
				expect(hasColumnResult).toBe(false);

				const fieldWhereResult = await db('directus_fields').select().where({ field: TEST_FIELD_NAME });
				expect(fieldWhereResult.length).toBe(0);
			});
		});
	});
});
