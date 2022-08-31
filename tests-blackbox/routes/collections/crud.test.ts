import config, { getUrl } from '@common/config';
import * as common from '@common/index';
import request from 'supertest';
import vendors from '@common/get-dbs-to-test';
import knex, { Knex } from 'knex';
import { Collection } from '@directus/shared/types';

describe('/collections', () => {
	common.DisableTestCachingSetup();

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

	describe('GET /', () => {
		describe('Returns the correct tables', () => {
			common.TEST_USERS.forEach((userKey) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get('/collections')
							.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

						// Assert
						if (userKey === common.USER.ADMIN.KEY) {
							const responseData = JSON.parse(response.text);
							const tableNames = responseData.data.map((collection: Collection) => collection.collection).sort();

							expect(response.statusCode).toBe(200);
							expect(responseData.data.length).toBeGreaterThanOrEqual(common.DEFAULT_DB_TABLES.length);
							expect(
								common.DEFAULT_DB_TABLES.every((name: string) => {
									return tableNames.indexOf(name) !== -1;
								})
							).toEqual(true);
						} else if (userKey === common.USER.APP_ACCESS.KEY) {
							const responseData = JSON.parse(response.text);
							const tableNames = responseData.data.map((collection: Collection) => collection.collection).sort();
							const appAccessPermissions = [
								'directus_activity',
								'directus_collections',
								'directus_fields',
								'directus_notifications',
								'directus_permissions',
								'directus_presets',
								'directus_relations',
								'directus_roles',
								'directus_settings',
								'directus_shares',
								'directus_users',
							];

							expect(response.statusCode).toBe(200);
							expect(responseData.data.length).toBeGreaterThanOrEqual(appAccessPermissions.length);
							expect(
								appAccessPermissions.every((name: string) => {
									return tableNames.indexOf(name) !== -1;
								})
							).toEqual(true);
						} else {
							expect(response.statusCode).toBe(403);
						}
					});
				});
			});
		});
	});

	describe('POST /', () => {
		let currentVendor = vendors[0];
		const TEST_COLLECTION_NAME = 'test_creation';

		afterEach(async () => {
			const db = databases.get(currentVendor)!;
			await db.schema.dropTableIfExists(TEST_COLLECTION_NAME);
			await db('directus_collections').del().where({ collection: TEST_COLLECTION_NAME });
		});

		describe('Creates a new regular collection', () => {
			common.TEST_USERS.forEach((userKey) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const db = databases.get(vendor)!;
						currentVendor = vendor;

						// Action
						const response = await request(getUrl(vendor))
							.post('/collections')
							.send({ collection: TEST_COLLECTION_NAME, meta: {}, schema: {} })
							.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

						// Assert
						if (userKey === common.USER.ADMIN.KEY) {
							expect(response.statusCode).toBe(200);
							expect(response.body.data).toEqual({
								collection: TEST_COLLECTION_NAME,
								meta: expect.objectContaining({
									collection: TEST_COLLECTION_NAME,
								}),
								schema: expect.objectContaining({
									name: TEST_COLLECTION_NAME,
								}),
							});
							expect(await db.schema.hasTable(TEST_COLLECTION_NAME)).toBe(true);
						} else {
							expect(response.statusCode).toBe(403);
						}
					});
				});
			});
		});

		describe('Creates a new folder', () => {
			common.TEST_USERS.forEach((userKey) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const db = databases.get(vendor)!;
						currentVendor = vendor;

						// Action
						const response = await request(getUrl(vendor))
							.post('/collections')
							.send({ collection: TEST_COLLECTION_NAME, meta: {}, schema: null })
							.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

						// Assert
						if (userKey === common.USER.ADMIN.KEY) {
							expect(response.statusCode).toBe(200);
							expect(response.body.data).toEqual({
								collection: TEST_COLLECTION_NAME,
								meta: expect.objectContaining({
									collection: TEST_COLLECTION_NAME,
								}),
								schema: null,
							});
							expect(await db.schema.hasTable(TEST_COLLECTION_NAME)).toBe(false);
						} else {
							expect(response.statusCode).toBe(403);
						}
					});
				});
			});
		});
	});

	describe('DELETE /', () => {
		let currentVendor = vendors[0];
		const TEST_COLLECTION_NAME = 'test_creation';

		afterEach(async () => {
			const db = databases.get(currentVendor)!;
			await db.schema.dropTableIfExists(TEST_COLLECTION_NAME);
			await db('directus_collections').del().where({ collection: TEST_COLLECTION_NAME });
		});

		describe('Deletes a regular collection', () => {
			common.TEST_USERS.forEach((userKey: string) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const db = databases.get(vendor)!;
						currentVendor = vendor;

						await request(getUrl(vendor))
							.post('/collections')
							.send({ collection: TEST_COLLECTION_NAME, meta: {}, schema: {} })
							.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

						if (userKey === common.USER.ADMIN.KEY) {
							expect(await db.schema.hasTable(TEST_COLLECTION_NAME)).toBe(true);
						}

						// Action
						const response = await request(getUrl(vendor))
							.delete('/collections/' + TEST_COLLECTION_NAME)
							.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

						// Assert
						if (userKey === common.USER.ADMIN.KEY) {
							expect(response.statusCode).toBe(204);
							expect(response.body).toEqual({});
							expect(await db.schema.hasTable(TEST_COLLECTION_NAME)).toBe(false);
						} else {
							expect(response.statusCode).toBe(403);
						}
					});
				});
			});
		});

		describe('Deletes a folder', () => {
			common.TEST_USERS.forEach((userKey: string) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const db = databases.get(vendor)!;
						currentVendor = vendor;

						await request(getUrl(vendor))
							.post('/collections')
							.send({ collection: TEST_COLLECTION_NAME, meta: {}, schema: null })
							.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

						if (userKey === common.USER.ADMIN.KEY) {
							expect(
								await db('directus_collections').select().where({ collection: TEST_COLLECTION_NAME })
							).toHaveLength(1);
						}

						// Action
						const response = await request(getUrl(vendor))
							.delete('/collections/' + TEST_COLLECTION_NAME)
							.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

						// Assert
						if (userKey === common.USER.ADMIN.KEY) {
							expect(response.statusCode).toBe(204);
							expect(response.body).toEqual({});
							expect(
								await db('directus_collections').select().where({ collection: TEST_COLLECTION_NAME })
							).toHaveLength(0);
						} else {
							expect(response.statusCode).toBe(403);
						}
					});
				});
			});
		});
	});

	common.ClearCaches();
});
