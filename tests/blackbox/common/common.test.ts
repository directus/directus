import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { collectionName, collectionNameM2O, collectionNameO2M } from './common.seed';
import { getUrl } from './config';
import {
	ClearCaches,
	CreateCollection,
	CreateField,
	CreateFieldM2O,
	CreateFieldO2M,
	CreateItem,
	CreateRole,
	CreateUser,
	DeleteCollection,
	DeleteField,
	DisableTestCachingSetup,
	type OptionsCreateCollection,
	type OptionsCreateField,
	type OptionsCreateFieldM2O,
	type OptionsCreateFieldO2M,
	type OptionsCreateItem,
	type OptionsCreateRole,
	type OptionsCreateUser,
	type OptionsDeleteCollection,
	type OptionsDeleteField,
} from './functions';
import vendors from './get-dbs-to-test';
import { USER, ROLE } from './variables';

describe('Common', () => {
	DisableTestCachingSetup();

	describe('createRole()', () => {
		describe('Creates default admin role', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const roleName = ROLE.ADMIN.NAME;

				const options: OptionsCreateRole = {
					name: roleName,
					appAccessEnabled: true,
					adminAccessEnabled: true,
				};

				// Action
				await CreateRole(vendor, options);

				// Assert
				const response = await request(getUrl(vendor))
					.get(`/roles`)
					.query({
						filter: { name: { _eq: roleName } },
						fields: ['id', 'name', 'app_access', 'admin_access'],
						limit: 1,
					})
					.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data).toEqual([
					{
						id: expect.any(String),
						name: roleName,
						app_access: true,
						admin_access: true,
					},
				]);
			});
		});

		describe('Creates default app access role', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const roleName = ROLE.APP_ACCESS.NAME;

				const options: OptionsCreateRole = {
					name: roleName,
					appAccessEnabled: true,
					adminAccessEnabled: false,
				};

				// Action
				await CreateRole(vendor, options);

				const response = await request(getUrl(vendor))
					.get(`/roles`)
					.query({
						filter: { name: { _eq: roleName } },
						fields: ['id', 'name', 'app_access', 'admin_access'],
						limit: 1,
					})
					.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				// Assert
				expect(response.body.data).toEqual([
					{
						id: expect.any(String),
						name: roleName,
						app_access: true,
						admin_access: false,
					},
				]);
			});
		});

		describe('Creates default API only role', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const roleName = ROLE.API_ONLY.NAME;

				const options: OptionsCreateRole = {
					name: roleName,
					appAccessEnabled: false,
					adminAccessEnabled: false,
				};

				// Action
				await CreateRole(vendor, options);

				const response = await request(getUrl(vendor))
					.get(`/roles`)
					.query({
						filter: { name: { _eq: roleName } },
						fields: ['id', 'name', 'app_access', 'admin_access'],
						limit: 1,
					})
					.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				// Assert
				expect(response.body.data).toEqual([
					{
						id: expect.any(String),
						name: roleName,
						app_access: false,
						admin_access: false,
					},
				]);
			});
		});
	});

	describe('createUser()', () => {
		describe('Creates default admin user', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const token = USER.ADMIN.TOKEN;
				const email = USER.ADMIN.EMAIL;
				const password = USER.ADMIN.PASSWORD;
				const name = USER.ADMIN.NAME;
				const roleName = ROLE.ADMIN.NAME;

				const options: OptionsCreateUser = {
					token,
					email,
					password,
					name,
					roleName,
				};

				// Action
				await CreateUser(vendor, options);

				const response = await request(getUrl(vendor))
					.get(`/users`)
					.query({
						filter: { email: { _eq: email } },
						fields: ['id', 'email', 'token', 'role'],
					})
					.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				// Assert
				expect(response.body.data).toEqual([
					{
						id: expect.any(String),
						email: email,
						token: expect.any(String),
						role: expect.any(String),
					},
				]);
			});
		});

		describe('Creates default app access user', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const token = USER.APP_ACCESS.TOKEN;
				const email = USER.APP_ACCESS.EMAIL;
				const password = USER.APP_ACCESS.PASSWORD;
				const name = USER.APP_ACCESS.NAME;
				const roleName = ROLE.APP_ACCESS.NAME;

				const options: OptionsCreateUser = {
					token,
					email,
					password,
					name,
					roleName,
				};

				// Action
				await CreateUser(vendor, options);

				const response = await request(getUrl(vendor))
					.get(`/users`)
					.query({
						filter: { email: { _eq: email } },
						fields: ['id', 'email', 'token', 'role'],
					})
					.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				// Assert
				expect(response.body.data).toEqual([
					{
						id: expect.any(String),
						email: email,
						token: expect.any(String),
						role: expect.any(String),
					},
				]);
			});
		});

		describe('Creates default API only user', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const token = USER.API_ONLY.TOKEN;
				const email = USER.API_ONLY.EMAIL;
				const password = USER.API_ONLY.PASSWORD;
				const name = USER.API_ONLY.NAME;
				const roleName = ROLE.API_ONLY.NAME;

				const options: OptionsCreateUser = {
					token,
					email,
					password,
					name,
					roleName,
				};

				// Action
				await CreateUser(vendor, options);

				const response = await request(getUrl(vendor))
					.get(`/users`)
					.query({
						filter: { email: { _eq: email } },
						fields: ['id', 'email', 'token', 'role'],
					})
					.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				// Assert
				expect(response.body.data).toEqual([
					{
						id: expect.any(String),
						email: email,
						token: expect.any(String),
						role: expect.any(String),
					},
				]);
			});
		});

		describe('Creates default no-role user', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const token = USER.NO_ROLE.TOKEN;
				const email = USER.NO_ROLE.EMAIL;
				const password = USER.NO_ROLE.PASSWORD;
				const name = USER.NO_ROLE.NAME;

				const options: OptionsCreateUser = {
					token,
					email,
					password,
					name,
				};

				// Action
				await CreateUser(vendor, options);

				const response = await request(getUrl(vendor))
					.get(`/users`)
					.query({
						filter: { email: { _eq: email } },
						fields: ['id', 'email', 'token', 'role'],
					})
					.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				// Assert
				expect(response.body.data).toEqual([
					{
						id: expect.any(String),
						email: email,
						token: expect.any(String),
						role: null,
					},
				]);
			});
		});
	});

	describe('createCollection()', () => {
		describe('Creates a new collection', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const options: OptionsCreateCollection = {
						collection: collectionName,
					};

					const options2: OptionsCreateCollection = {
						collection: collectionNameM2O,
					};

					const options3: OptionsCreateCollection = {
						collection: collectionNameO2M,
					};

					// Action
					await CreateCollection(vendor, options);

					const response = await request(getUrl(vendor))
						.get(`/collections/${collectionName}`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					await CreateCollection(vendor, options2);

					const response2 = await request(getUrl(vendor))
						.get(`/collections/${collectionNameM2O}`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					await CreateCollection(vendor, options3);

					const response3 = await request(getUrl(vendor))
						.get(`/collections/${collectionNameO2M}`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					// Assert
					expect(response.body.data).toEqual({
						collection: collectionName,
						meta: expect.objectContaining({
							collection: collectionName,
						}),
						schema: expect.objectContaining({
							name: collectionName,
						}),
					});

					expect(response2.body.data).toEqual({
						collection: collectionNameM2O,
						meta: expect.objectContaining({
							collection: collectionNameM2O,
						}),
						schema: expect.objectContaining({
							name: collectionNameM2O,
						}),
					});

					expect(response3.body.data).toEqual({
						collection: collectionNameO2M,
						meta: expect.objectContaining({
							collection: collectionNameO2M,
						}),
						schema: expect.objectContaining({
							name: collectionNameO2M,
						}),
					});
				},
				30000
			);
		});
	});

	describe('createField()', () => {
		describe('Creates a new field', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const fieldName = 'sample_field';
					const fieldType = 'string';

					const options: OptionsCreateField = {
						collection: collectionName,
						field: fieldName,
						type: fieldType,
					};

					// Action
					await CreateField(vendor, options);

					const response = await request(getUrl(vendor))
						.get(`/fields/${collectionName}/${fieldName}`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					// Assert
					expect(response.body.data).toEqual({
						collection: collectionName,
						field: fieldName,
						type: fieldType,
						meta: expect.anything(),
						schema: expect.anything(),
					});
				},
				30000
			);
		});
	});

	describe('createFieldM2O()', () => {
		describe('Creates a new M2O field', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const fieldName = 'm2o_field';
					const primaryKeyType = 'integer';

					const collectionOptions: OptionsCreateCollection = {
						collection: collectionNameM2O,
						primaryKeyType,
					};

					await CreateCollection(vendor, collectionOptions);

					const options: OptionsCreateFieldM2O = {
						collection: collectionName,
						field: fieldName,
						otherCollection: collectionNameM2O,
						primaryKeyType: primaryKeyType,
					};

					// Action
					await CreateFieldM2O(vendor, options);

					const response = await request(getUrl(vendor))
						.get(`/fields/${collectionName}/${fieldName}`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					// Assert
					expect(response.body.data).toEqual({
						collection: collectionName,
						field: fieldName,
						type: primaryKeyType,
						meta: expect.objectContaining({
							special: expect.arrayContaining(['m2o']),
						}),
						schema: expect.anything(),
					});
				},
				30000
			);
		});
	});

	describe('createFieldO2M()', () => {
		describe('Creates a new O2M field', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const fieldName = 'o2m_field';
					const otherFieldName = 'm2o_field';
					const primaryKeyType = 'integer';

					const collectionOptions: OptionsCreateCollection = {
						collection: collectionNameO2M,
						primaryKeyType,
					};

					await CreateCollection(vendor, collectionOptions);

					const options: OptionsCreateFieldO2M = {
						collection: collectionName,
						field: fieldName,
						otherField: otherFieldName,
						otherCollection: collectionNameO2M,
						primaryKeyType: primaryKeyType,
					};

					// Action
					await CreateFieldO2M(vendor, options);

					const response = await request(getUrl(vendor))
						.get(`/fields/${collectionName}/${fieldName}`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					// Assert
					expect(response.body.data).toEqual({
						collection: collectionName,
						field: fieldName,
						type: 'alias',
						meta: expect.anything(),
						schema: null,
					});
				},
				30000
			);
		});
	});

	describe('createItem()', () => {
		describe('Creates a new item', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const options: OptionsCreateItem = {
						collection: collectionName,
						item: {
							sample_field: 'sample_value',
						},
					};

					// Action
					const createdItem = await CreateItem(vendor, options);

					const response = await request(getUrl(vendor))
						.get(`/items/${collectionName}/${createdItem.id}`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					// Assert
					expect(response.body.data).toEqual(
						expect.objectContaining({
							id: createdItem.id,
							sample_field: 'sample_value',
						})
					);
				},
				30000
			);
		});

		describe('Creates a new M2O item', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const options: OptionsCreateItem = {
						collection: collectionName,
						item: {
							sample_field: 'sample_value',
							m2o_field: {},
						},
					};

					// Action
					const createdItem = await CreateItem(vendor, options);

					const response = await request(getUrl(vendor))
						.get(`/items/${collectionName}/${createdItem.id}`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					// Assert
					expect(response.body.data).toEqual(
						expect.objectContaining({
							id: createdItem.id,
							sample_field: 'sample_value',
							m2o_field: expect.any(Number),
						})
					);
				},
				30000
			);
		});

		describe('Creates a new O2M item', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const options: OptionsCreateItem = {
						collection: collectionName,
						item: {
							sample_field: 'sample_value',
							o2m_field: {
								create: [{}],
								update: [],
								delete: [],
							},
						},
					};

					// Action
					const createdItem = await CreateItem(vendor, options);

					const response = await request(getUrl(vendor))
						.get(`/items/${collectionName}/${createdItem.id}`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					// Assert
					expect(response.body.data).toEqual(
						expect.objectContaining({
							id: createdItem.id,
							sample_field: 'sample_value',
							o2m_field: [expect.any(Number)],
						})
					);
				},
				30000
			);
		});
	});

	describe('deleteField()', () => {
		describe('Deletes an O2M field', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const fieldName = 'o2m_field';

					const options: OptionsDeleteField = {
						collection: collectionName,
						field: fieldName,
					};

					// Action
					await DeleteField(vendor, options);

					const response = await request(getUrl(vendor))
						.get(`/fields/${collectionName}`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					// Assert
					for (const child of response.body.data) {
						expect(child.field).not.toEqual(fieldName);
					}
				},
				30000
			);
		});

		describe('Deletes other M2O field', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const fieldName = 'm2o_field';

					const options: OptionsDeleteField = {
						collection: collectionNameO2M,
						field: fieldName,
					};

					// Action
					await DeleteField(vendor, options);

					const response = await request(getUrl(vendor))
						.get(`/fields/${collectionNameO2M}`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					// Assert
					for (const child of response.body.data) {
						expect(child.field).not.toEqual(fieldName);
					}
				},
				30000
			);
		});

		describe('Deletes an M2O field', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const fieldName = 'm2o_field';

					const options: OptionsDeleteField = {
						collection: collectionName,
						field: fieldName,
					};

					// Action
					await DeleteField(vendor, options);

					const response = await request(getUrl(vendor))
						.get(`/fields/${collectionName}`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					// Assert
					for (const child of response.body.data) {
						expect(child.field).not.toEqual(fieldName);
					}
				},
				30000
			);
		});

		describe('Deletes a field', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const fieldName = 'sample_field';

					const options: OptionsDeleteField = {
						collection: collectionName,
						field: fieldName,
					};

					// Action
					await DeleteField(vendor, options);

					const response = await request(getUrl(vendor))
						.get(`/fields/${collectionName}`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					// Assert
					for (const child of response.body.data) {
						expect(child.field).not.toEqual(fieldName);
					}
				},
				30000
			);
		});
	});

	describe('deleteCollection()', () => {
		describe('Deletes a collection', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const options: OptionsDeleteCollection = {
						collection: collectionName,
					};

					// Action
					await DeleteCollection(vendor, options);

					const response = await request(getUrl(vendor))
						.get(`/collections`)
						.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					// Assert
					for (const child of response.body.data) {
						expect(child.collection).not.toEqual(collectionName);
					}
				},
				30000
			);
		});
	});

	ClearCaches();
});
