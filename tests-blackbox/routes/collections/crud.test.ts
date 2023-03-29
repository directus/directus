import config, { getUrl } from '@common/config';
import * as common from '@common/index';
import request from 'supertest';
import vendors from '@common/get-dbs-to-test';
import knex, { Knex } from 'knex';
import { Collection } from '@directus/shared/types';
import { findIndex } from 'lodash';
import { requestGraphQL } from '@common/index';

describe.each(common.PRIMARY_KEY_TYPES)('/collections', (pkType) => {
	common.DisableTestCachingSetup();

	const databases = new Map<string, Knex>();
	const TEST_COLLECTION_NAME = `test_collections_crud_creation_${pkType}`;
	const TEST_FOLDER_NAME = `test_collections_crud_folder_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
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

							const gqlResponse = await requestGraphQL(getUrl(vendor), true, common.USER[userKey].TOKEN, {
								query: {
									collections: {
										collection: true,
									},
								},
							});

							// Assert
							if (userKey === common.USER.ADMIN.KEY) {
								const responseData = JSON.parse(response.text);
								const tableNames = responseData.data.map((collection: Collection) => collection.collection).sort();
								const tableNames2 = gqlResponse.body.data['collections']
									.map((collection: Collection) => collection.collection)
									.sort();

								expect(response.statusCode).toBe(200);
								expect(responseData.data.length).toBeGreaterThanOrEqual(common.DEFAULT_DB_TABLES.length);
								expect(
									common.DEFAULT_DB_TABLES.every((name: string) => {
										return tableNames.indexOf(name) !== -1;
									})
								).toEqual(true);

								expect(gqlResponse.statusCode).toBe(200);
								expect(gqlResponse.body.data['collections'].length).toBeGreaterThanOrEqual(
									common.DEFAULT_DB_TABLES.length
								);
								expect(
									common.DEFAULT_DB_TABLES.every((name: string) => {
										return tableNames2.indexOf(name) !== -1;
									})
								).toEqual(true);
							} else if (userKey === common.USER.APP_ACCESS.KEY) {
								const responseData = JSON.parse(response.text);
								const tableNames = responseData.data.map((collection: Collection) => collection.collection).sort();
								const tableNames2 = gqlResponse.body.data['collections']
									.map((collection: Collection) => collection.collection)
									.sort();
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

								expect(gqlResponse.statusCode).toBe(200);
								expect(gqlResponse.body.data['collections'].length).toBeGreaterThanOrEqual(appAccessPermissions.length);
								expect(
									appAccessPermissions.every((name: string) => {
										return tableNames2.indexOf(name) !== -1;
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
							const fields = [];

							switch (pkType) {
								case 'uuid':
									fields.push({
										field: 'id',
										type: 'uuid',
										meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
										schema: { is_primary_key: true, length: 36, has_auto_increment: false },
									});
									break;
								case 'string':
									fields.push({
										field: 'id',
										type: 'string',
										meta: { hidden: false, readonly: false, interface: 'input' },
										schema: { is_primary_key: true, length: 255, has_auto_increment: false },
									});
									break;
								case 'integer':
									fields.push({
										field: 'id',
										type: 'integer',
										meta: { hidden: true, interface: 'input', readonly: true },
										schema: { is_primary_key: true, has_auto_increment: true },
									});
									break;
							}

							// Action
							const response = await request(getUrl(vendor))
								.post('/collections')
								.send({ collection: TEST_COLLECTION_NAME, meta: {}, schema: {}, fields })
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
								.send({ collection: TEST_FOLDER_NAME, meta: {}, schema: null })
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							// Assert
							if (userKey === common.USER.ADMIN.KEY) {
								expect(response.statusCode).toBe(200);
								expect(response.body.data).toEqual({
									collection: TEST_FOLDER_NAME,
									meta: expect.objectContaining({
										collection: TEST_FOLDER_NAME,
									}),
									schema: null,
								});
								expect(await db.schema.hasTable(TEST_FOLDER_NAME)).toBe(false);
							} else {
								expect(response.statusCode).toBe(403);
							}
						});
					});
				});
			});
		});

		describe('PATCH /', () => {
			let currentVendor = vendors[0];
			const collectionNames = [
				`test_collections_crud_batch_update_${pkType}`,
				`test_collections_crud_batch_update2_${pkType}`,
				`test_collections_crud_batch_update3_${pkType}`,
			];
			const newSortOrder = [3, 1, 2];

			afterEach(async () => {
				const db = databases.get(currentVendor)!;
				for (const collection of collectionNames) {
					await db.schema.dropTableIfExists(collection);
					await db('directus_collections').del().where({ collection });
				}
			});

			describe('Does batch update used for collection sorting', () => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const db = databases.get(vendor)!;
							currentVendor = vendor;

							// Action
							await request(getUrl(vendor))
								.post('/collections')
								.send(
									collectionNames.map((collection) => {
										return { collection, meta: {}, schema: {} };
									})
								)
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							let index = 0;

							const response = await request(getUrl(vendor))
								.patch('/collections')
								.send(
									collectionNames.map((collection) => {
										const sort = newSortOrder[index++];
										return { collection, meta: { sort, note: String(sort) } };
									})
								)
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							// Assert
							if (userKey === common.USER.ADMIN.KEY) {
								expect(response.statusCode).toBe(200);
								for (let i = 0; i < collectionNames.length; i++) {
									const matchedIndex = findIndex(response.body.data, { collection: collectionNames[i] });
									expect(response.body.data[matchedIndex]).toEqual({
										collection: collectionNames[i],
										meta: expect.objectContaining({
											collection: collectionNames[i],
											sort: newSortOrder[i],
											note: String(newSortOrder[i]),
										}),
										schema: expect.objectContaining({
											name: collectionNames[i],
										}),
									});
									expect(await db.schema.hasTable(collectionNames[i])).toBe(true);
								}
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
								.send({ collection: TEST_FOLDER_NAME, meta: {}, schema: null })
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							if (userKey === common.USER.ADMIN.KEY) {
								expect(await db('directus_collections').select().where({ collection: TEST_FOLDER_NAME })).toHaveLength(
									1
								);
							}

							// Action
							const response = await request(getUrl(vendor))
								.delete('/collections/' + TEST_FOLDER_NAME)
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							// Assert
							if (userKey === common.USER.ADMIN.KEY) {
								expect(response.statusCode).toBe(204);
								expect(response.body).toEqual({});
								expect(await db('directus_collections').select().where({ collection: TEST_FOLDER_NAME })).toHaveLength(
									0
								);
							} else {
								expect(response.statusCode).toBe(403);
							}
						});
					});
				});
			});
		});

		describe('Verify schema action hook run', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Action
				const response = await request(getUrl(vendor))
					.get('/items/tests_extensions_log')
					.query({
						filter: JSON.stringify({
							_and: [
								{
									key: {
										_starts_with: 'action-verify-schema/test_collections_crud',
									},
								},
								{
									key: {
										_contains: pkType,
									},
								},
							],
						}),
					})
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toBe(200);
				expect(response.body.data.length).toBe(10);
				for (const log of response.body.data) {
					expect(log.value).toBe('1');
				}
			});
		});
	});
});

common.ClearCaches();
