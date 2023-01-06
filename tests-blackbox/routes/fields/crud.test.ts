import config, { getUrl } from '@common/config';
import * as common from '@common/index';
import request from 'supertest';
import vendors from '@common/get-dbs-to-test';
import knex, { Knex } from 'knex';
import { FieldRaw } from '@directus/shared/types';
import { sortedUniq } from 'lodash';
import { collection } from './crud.seed';
import { requestGraphQL } from '@common/index';

describe.each(common.PRIMARY_KEY_TYPES)('/fields', (pkType) => {
	common.DisableTestCachingSetup();

	const databases = new Map<string, Knex>();
	const TEST_COLLECTION_NAME = `${collection}_${pkType}`;
	const TEST_FIELD_NAME = 'test_field';
	const TEST_ALIAS_FIELD_NAME = 'test_alias_field';
	const TEST_UPDATED_NOTE = 'updated-note';

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
			describe('Returns the correct fields', () => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.get('/collections')
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), true, common.USER[userKey].TOKEN, {
								query: {
									fields: {
										field: true,
										collection: true,
									},
								},
							});

							// Assert
							if (userKey === common.USER.ADMIN.KEY) {
								const responseData = JSON.parse(response.text);
								const tableNames = sortedUniq(responseData.data.map((field: FieldRaw) => field.collection));
								const tableNames2 = sortedUniq(
									gqlResponse.body.data['fields'].map((field: FieldRaw) => field.collection)
								);

								expect(response.statusCode).toBe(200);
								expect(tableNames.length).toBeGreaterThanOrEqual(common.DEFAULT_DB_TABLES.length);
								expect(
									common.DEFAULT_DB_TABLES.every((name: string) => {
										return tableNames.indexOf(name) !== -1;
									})
								).toEqual(true);

								expect(gqlResponse.statusCode).toBe(200);
								expect(tableNames2.length).toBeGreaterThanOrEqual(common.DEFAULT_DB_TABLES.length);
								expect(
									common.DEFAULT_DB_TABLES.every((name: string) => {
										return tableNames2.indexOf(name) !== -1;
									})
								).toEqual(true);
							} else if (userKey === common.USER.APP_ACCESS.KEY) {
								const responseData = JSON.parse(response.text);
								const tableNames = sortedUniq(responseData.data.map((field: FieldRaw) => field.collection));
								const tableNames2 = sortedUniq(
									gqlResponse.body.data['fields'].map((field: FieldRaw) => field.collection)
								);
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
								expect(tableNames.length).toBeGreaterThanOrEqual(appAccessPermissions.length);
								expect(
									appAccessPermissions.every((name: string) => {
										return tableNames.indexOf(name) !== -1;
									})
								).toEqual(true);

								expect(gqlResponse.statusCode).toBe(200);
								expect(tableNames2.length).toBeGreaterThanOrEqual(appAccessPermissions.length);
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

		describe('POST /:collection', () => {
			let currentVendor = vendors[0];

			afterEach(async () => {
				const db = databases.get(currentVendor)!;
				if (await db.schema.hasColumn(TEST_COLLECTION_NAME, TEST_FIELD_NAME)) {
					await db.schema.alterTable(TEST_COLLECTION_NAME, (table) => {
						table.dropColumn(TEST_FIELD_NAME);
					});
				}
			});

			describe('Creates a new field', () => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const db = databases.get(vendor)!;
							currentVendor = vendor;

							// Action
							const response = await request(getUrl(vendor))
								.post(`/fields/${TEST_COLLECTION_NAME}`)
								.send({
									collection: TEST_COLLECTION_NAME,
									field: TEST_FIELD_NAME,
									meta: {},
									schema: {},
									type: 'string',
								})
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							// Assert
							if (userKey === common.USER.ADMIN.KEY) {
								expect(response.statusCode).toBe(200);
								expect(response.body.data).toEqual({
									collection: TEST_COLLECTION_NAME,
									field: TEST_FIELD_NAME,
									meta: expect.objectContaining({
										collection: TEST_COLLECTION_NAME,
										field: TEST_FIELD_NAME,
									}),
									schema: expect.objectContaining({
										name: TEST_FIELD_NAME,
										table: TEST_COLLECTION_NAME,
									}),
									type: 'string',
								});
								expect(await db.schema.hasColumn(TEST_COLLECTION_NAME, TEST_FIELD_NAME)).toBe(true);
							} else {
								expect(response.statusCode).toBe(403);
							}
						});
					});
				});
			});

			describe('Creates a new alias field', () => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const db = databases.get(vendor)!;
							currentVendor = vendor;

							// Action
							const response = await request(getUrl(vendor))
								.post(`/fields/${TEST_COLLECTION_NAME}`)
								.send({
									collection: TEST_COLLECTION_NAME,
									field: TEST_ALIAS_FIELD_NAME,
									meta: { interface: 'group-raw', special: ['alias', 'no-data', 'group'] },
									type: 'alias',
								})
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							// Assert
							if (userKey === common.USER.ADMIN.KEY) {
								expect(response.statusCode).toBe(200);
								expect(response.body.data).toEqual({
									collection: TEST_COLLECTION_NAME,
									field: TEST_ALIAS_FIELD_NAME,
									meta: expect.objectContaining({
										collection: TEST_COLLECTION_NAME,
										field: TEST_ALIAS_FIELD_NAME,
										interface: 'group-raw',
										special: ['alias', 'no-data', 'group'],
									}),
									schema: null,
									type: 'alias',
								});
								expect(await db.schema.hasColumn(TEST_COLLECTION_NAME, TEST_ALIAS_FIELD_NAME)).toBe(false);
							} else {
								expect(response.statusCode).toBe(403);
							}
						});
					});
				});
			});
		});

		describe('PATCH /:collection/:field', () => {
			let currentVendor = vendors[0];

			beforeEach(async () => {
				const db = databases.get(currentVendor)!;
				if (!(await db.schema.hasColumn(TEST_COLLECTION_NAME, TEST_FIELD_NAME))) {
					await db.schema.alterTable(TEST_COLLECTION_NAME, (table) => {
						table.string(TEST_FIELD_NAME);
					});
				}
			});

			afterEach(async () => {
				const db = databases.get(currentVendor)!;
				await db('directus_fields')
					.update({ note: null })
					.where({ collection: TEST_COLLECTION_NAME, field: TEST_FIELD_NAME });
				await db('directus_fields')
					.update({ note: null })
					.where({ collection: TEST_COLLECTION_NAME, field: TEST_ALIAS_FIELD_NAME });
			});

			describe('Updates field', () => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							currentVendor = vendor;

							// Action
							const response = await request(getUrl(vendor))
								.patch(`/fields/${TEST_COLLECTION_NAME}/${TEST_FIELD_NAME}`)
								.send({ collection: TEST_COLLECTION_NAME, field: TEST_FIELD_NAME, meta: { note: TEST_UPDATED_NOTE } })
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							// Assert
							if (userKey === common.USER.ADMIN.KEY) {
								expect(response.statusCode).toBe(200);
								expect(response.body.data).toEqual({
									collection: TEST_COLLECTION_NAME,
									field: TEST_FIELD_NAME,
									meta: expect.objectContaining({
										collection: TEST_COLLECTION_NAME,
										field: TEST_FIELD_NAME,
										note: TEST_UPDATED_NOTE,
									}),
									schema: expect.objectContaining({
										name: TEST_FIELD_NAME,
										table: TEST_COLLECTION_NAME,
									}),
									type: 'string',
								});
							} else {
								expect(response.statusCode).toBe(403);
							}
						});
					});
				});
			});

			describe('Updates alias field', () => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							currentVendor = vendor;

							// Action
							const response = await request(getUrl(vendor))
								.patch(`/fields/${TEST_COLLECTION_NAME}/${TEST_ALIAS_FIELD_NAME}`)
								.send({
									collection: TEST_COLLECTION_NAME,
									field: TEST_ALIAS_FIELD_NAME,
									meta: { note: TEST_UPDATED_NOTE },
								})
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							// Assert
							if (userKey === common.USER.ADMIN.KEY) {
								expect(response.statusCode).toBe(200);
								expect(response.body.data).toEqual({
									collection: TEST_COLLECTION_NAME,
									field: TEST_ALIAS_FIELD_NAME,
									meta: expect.objectContaining({
										collection: TEST_COLLECTION_NAME,
										field: TEST_ALIAS_FIELD_NAME,
										note: TEST_UPDATED_NOTE,
									}),
									schema: null,
									type: 'alias',
								});
							} else {
								expect(response.statusCode).toBe(403);
							}
						});
					});
				});
			});
		});

		describe('PATCH /:collection', () => {
			let currentVendor = vendors[0];

			afterEach(async () => {
				const db = databases.get(currentVendor)!;
				await db('directus_fields')
					.update({ note: null })
					.where({ collection: TEST_COLLECTION_NAME, field: TEST_FIELD_NAME });
				await db('directus_fields')
					.update({ note: null })
					.where({ collection: TEST_COLLECTION_NAME, field: TEST_ALIAS_FIELD_NAME });
			});

			describe('Updates multiple fields at once', () => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							currentVendor = vendor;

							// Action
							const response = await request(getUrl(vendor))
								.patch(`/fields/${TEST_COLLECTION_NAME}`)
								.send([
									{ collection: TEST_COLLECTION_NAME, field: TEST_FIELD_NAME, meta: { note: TEST_UPDATED_NOTE } },
									{
										collection: TEST_COLLECTION_NAME,
										field: TEST_ALIAS_FIELD_NAME,
										meta: { note: TEST_UPDATED_NOTE },
									},
								])
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							// Assert
							if (userKey === common.USER.ADMIN.KEY) {
								expect(response.statusCode).toBe(200);
								expect(response.body.data).toEqual([
									{
										collection: TEST_COLLECTION_NAME,
										field: TEST_FIELD_NAME,
										meta: expect.objectContaining({
											collection: TEST_COLLECTION_NAME,
											field: TEST_FIELD_NAME,
											note: TEST_UPDATED_NOTE,
										}),
										schema: expect.objectContaining({
											name: TEST_FIELD_NAME,
											table: TEST_COLLECTION_NAME,
										}),
										type: 'string',
									},
									{
										collection: TEST_COLLECTION_NAME,
										field: TEST_ALIAS_FIELD_NAME,
										meta: expect.objectContaining({
											collection: TEST_COLLECTION_NAME,
											field: TEST_ALIAS_FIELD_NAME,
											note: TEST_UPDATED_NOTE,
										}),
										schema: null,
										type: 'alias',
									},
								]);
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
				if (!(await db.schema.hasColumn(TEST_COLLECTION_NAME, TEST_FIELD_NAME))) {
					await db.schema.alterTable(TEST_COLLECTION_NAME, (table) => {
						table.string(TEST_FIELD_NAME);
					});
				}
			});

			describe('Deletes a field', () => {
				common.TEST_USERS.forEach((userKey: string) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const db = databases.get(vendor)!;
							currentVendor = vendor;

							// Action
							const response = await request(getUrl(vendor))
								.delete(`/fields/${TEST_COLLECTION_NAME}/${TEST_FIELD_NAME}`)
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/fields/${TEST_COLLECTION_NAME}/${TEST_FIELD_NAME}`)
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							// Assert
							if (userKey === common.USER.ADMIN.KEY) {
								expect(response.statusCode).toBe(204);
								expect(response.body).toEqual({});
								expect(await db.schema.hasColumn(TEST_COLLECTION_NAME, TEST_FIELD_NAME)).toBe(false);
							} else {
								expect(response.statusCode).toBe(403);
							}
							expect(response2.statusCode).toBe(403);
						});
					});
				});
			});

			describe('Deletes an alias field', () => {
				common.TEST_USERS.forEach((userKey: string) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const db = databases.get(vendor)!;
							currentVendor = vendor;

							// Action
							const response = await request(getUrl(vendor))
								.delete(`/fields/${TEST_COLLECTION_NAME}/${TEST_ALIAS_FIELD_NAME}`)
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/fields/${TEST_COLLECTION_NAME}/${TEST_ALIAS_FIELD_NAME}`)
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							// Assert
							if (userKey === common.USER.ADMIN.KEY) {
								expect(response.statusCode).toBe(204);
								expect(response.body).toEqual({});
								expect(await db.schema.hasColumn(TEST_COLLECTION_NAME, TEST_ALIAS_FIELD_NAME)).toBe(false);
							} else {
								expect(response.statusCode).toBe(403);
							}
							expect(response2.statusCode).toBe(403);
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
						filter: {
							key: {
								_starts_with: `action-verify-schema/${TEST_COLLECTION_NAME}`,
							},
						},
					})
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toBe(200);
				expect(response.body.data.length).toBe(4);
				for (const log of response.body.data) {
					expect(log.value).toBe('1');
				}
			});
		});
	});
});

common.ClearCaches();
