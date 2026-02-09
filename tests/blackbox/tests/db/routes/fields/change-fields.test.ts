import { getUrl } from '@common/config';
import { ClearCaches, CreateField, DeleteField, DisableTestCachingSetup } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { CachedTestsSchema, TestsSchemaVendorValues } from '../../query/filter';
import { collectionCountries, collectionStates, getTestsSchema, seedDBValues } from './change-fields.seed';

const cachedSchema = PRIMARY_KEY_TYPES.reduce((acc, pkType) => {
	acc[pkType] = getTestsSchema(pkType);
	return acc;
}, {} as CachedTestsSchema);

const vendorSchemaValues: TestsSchemaVendorValues = {};

beforeAll(async () => {
	await seedDBValues(cachedSchema, vendorSchemaValues);
}, 300_000);

describe('Seed Database Values', () => {
	it.each(vendors)('%s', async (vendor) => {
		// Assert
		expect(vendorSchemaValues[vendor]).toBeDefined();
	});
});

describe.each(PRIMARY_KEY_TYPES)('/fields', (pkType) => {
	DisableTestCachingSetup();

	const localCollectionCountries = `${collectionCountries}_${pkType}`;
	const localCollectionStates = `${collectionStates}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('DELETE /:collection/:field', () => {
			describe('with foreign key constraints does not clear existing data', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const newFieldName = 'to_be_deleted';

					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionStates}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const existingData = response.body.data;

					// Action
					await CreateField(vendor, {
						collection: localCollectionCountries,
						field: newFieldName,
						type: 'string',
					});

					await DeleteField(vendor, {
						collection: localCollectionCountries,
						field: newFieldName,
					});

					const response2 = await request(getUrl(vendor))
						.get(`/items/${localCollectionStates}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const updatedData = response2.body.data;

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response2.statusCode).toEqual(200);
					expect(existingData).toHaveLength(4);
					expect(existingData).toStrictEqual(updatedData);
				});
			});
		});

		describe('POST /:collection', () => {
			describe('with new relations does not clear existing data', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const fieldName = 'flag_image';

					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionStates}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const existingData = response.body.data;

					// Action
					await request(getUrl(vendor))
						.post(`/fields/${localCollectionCountries}`)
						.send({
							field: fieldName,
							type: 'uuid',
							schema: {},
							meta: { interface: 'file-image', special: ['file'] },
							collection: localCollectionCountries,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					await request(getUrl(vendor))
						.post(`/relations`)
						.send({
							collection: localCollectionCountries,
							field: fieldName,
							related_collection: 'directus_files',
							meta: { sort_field: null },
							schema: { on_delete: 'SET NULL' },
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/items/${localCollectionStates}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const updatedData = response2.body.data;

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response2.statusCode).toEqual(200);
					expect(existingData).toHaveLength(4);
					expect(existingData).toStrictEqual(updatedData);
				});
			});

			describe('can create new virtual alias field', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const fieldName = 'test_divider';

					// Action
					const response = await request(getUrl(vendor))
						.post(`/fields/${localCollectionCountries}`)
						.send({
							field: fieldName,
							type: 'alias',
							meta: {
								interface: 'presentation-divider',
								special: ['alias', 'no-data'],
								options: { title: 'Test Divider' },
							},
							collection: localCollectionCountries,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/fields/${localCollectionCountries}/${fieldName}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response2.statusCode).toEqual(200);

					expect(response2.body.data).toEqual(
						expect.objectContaining({
							field: fieldName,
							type: 'alias',
							collection: localCollectionCountries,
						}),
					);
				});
			});

			if (pkType === 'uuid') {
				describe('can create new field in system collection', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const systemUsersCollection = 'directus_users';
						const fieldName = 'user_field_test';

						// Action
						const response = await request(getUrl(vendor))
							.post(`/fields/${systemUsersCollection}`)
							.send({
								field: fieldName,
								type: 'string',
								meta: {
									interface: 'input',
									special: null,
								},
								collection: systemUsersCollection,
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/fields/${systemUsersCollection}/${fieldName}`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response2.statusCode).toEqual(200);

						expect(response2.body.data).toEqual(
							expect.objectContaining({
								field: fieldName,
								type: 'string',
								collection: systemUsersCollection,
							}),
						);
					});
				});
			}
		});

		describe('PATCH /:collection', () => {
			describe('can sort virtual alias field', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const fieldName = 'test_divider';
					const updatedSort = 100;

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/fields/${localCollectionCountries}`)
						.send([{ field: 'test_divider', meta: { sort: updatedSort, group: null } }])
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/fields/${localCollectionCountries}/${fieldName}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response2.statusCode).toEqual(200);

					expect(response2.body.data).toEqual(
						expect.objectContaining({
							field: fieldName,
							type: 'alias',
							meta: expect.objectContaining({
								sort: updatedSort,
							}),
							collection: localCollectionCountries,
						}),
					);
				});
			});
		});

		describe('PATCH /:collection/:field', () => {
			describe('can update virtual alias field', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const fieldName = 'test_divider';
					const updatedTitle = 'Updated Divider';

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/fields/${localCollectionCountries}/${fieldName}`)
						.send({
							collection: localCollectionCountries,
							field: fieldName,
							type: 'alias',
							schema: null,
							meta: {
								options: { title: updatedTitle },
							},
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/fields/${localCollectionCountries}/${fieldName}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response2.statusCode).toEqual(200);

					expect(response2.body.data).toEqual(
						expect.objectContaining({
							field: fieldName,
							type: 'alias',
							meta: expect.objectContaining({
								options: expect.objectContaining({ title: updatedTitle }),
							}),
							collection: localCollectionCountries,
						}),
					);
				});
			});

			describe('can update meta only without schema changes for relational field', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const fieldName = 'country_id';

					const payload = (
						await request(getUrl(vendor))
							.get(`/fields/${localCollectionStates}/${fieldName}`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					).body.data;

					payload.meta.options = { template: 'updated' };

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/fields/${localCollectionStates}/${fieldName}`)
						.send(payload)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/fields/${localCollectionStates}/${fieldName}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response2.statusCode).toEqual(200);
					expect(response2.body.data).toEqual(payload);
				});
			});

			if (pkType === 'uuid') {
				describe('can update user created field on system collection', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const systemUsersCollection = 'directus_users';
						const fieldName = 'user_field_test';
						const updatedValue = 'Updated';

						// Action
						const response = await request(getUrl(vendor))
							.patch(`/fields/${systemUsersCollection}/${fieldName}`)
							.send({
								collection: systemUsersCollection,
								field: fieldName,
								type: 'string',
								schema: { default_value: updatedValue },
								meta: {
									options: { placeholder: updatedValue },
								},
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/fields/${systemUsersCollection}/${fieldName}`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response2.statusCode).toEqual(200);

						expect(response2.body.data).toEqual(
							expect.objectContaining({
								field: fieldName,
								type: 'string',
								meta: expect.objectContaining({
									options: expect.objectContaining({ placeholder: updatedValue }),
								}),
								collection: systemUsersCollection,
							}),
						);
					});
				});

				describe('can update system field index', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const systemUsersCollection = 'directus_users';
						const fieldName = 'first_name';
						const updatedValue = true;

						// Action
						const response = await request(getUrl(vendor))
							.patch(`/fields/${systemUsersCollection}/${fieldName}`)
							.send({
								collection: systemUsersCollection,
								field: fieldName,
								schema: { is_indexed: updatedValue },
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/fields/${systemUsersCollection}/${fieldName}`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response2.statusCode).toEqual(200);

						expect(response2.body.data).toEqual(
							expect.objectContaining({
								field: fieldName,
								type: 'string',
								schema: expect.objectContaining({
									is_indexed: updatedValue,
								}),
								collection: systemUsersCollection,
							}),
						);
					});
				});

				describe('can update system field index concurrently', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const systemUsersCollection = 'directus_users';
						const fieldName = 'first_name';
						const updatedValue = true;

						// Action
						const response = await request(getUrl(vendor))
							.patch(`/fields/${systemUsersCollection}/${fieldName}?concurrentIndexCreation`)
							.send({
								collection: systemUsersCollection,
								field: fieldName,
								schema: { is_indexed: updatedValue },
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/fields/${systemUsersCollection}/${fieldName}`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response2.statusCode).toEqual(200);

						expect(response2.body.data).toEqual(
							expect.objectContaining({
								field: fieldName,
								type: 'string',
								schema: expect.objectContaining({
									is_indexed: updatedValue,
								}),
								collection: systemUsersCollection,
							}),
						);
					});
				});

				describe('errors for invalid updates to system field', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const systemUsersCollection = 'directus_users';
						const fieldName = 'first_name';

						// Action
						const response = await request(getUrl(vendor))
							.patch(`/fields/${systemUsersCollection}/${fieldName}`)
							.send({
								collection: systemUsersCollection,
								field: fieldName,
								type: 'string',
								schema: { is_nullable: false },
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.patch(`/fields/${systemUsersCollection}/${fieldName}`)
							.send({
								collection: systemUsersCollection,
								field: fieldName,
								type: 'string',
								meta: {
									options: { placeholder: 'Updated' },
								},
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(400);
						expect(response2.statusCode).toEqual(400);
						expect(response.body.errors[0].message).toContain('Invalid payload.');
						expect(response2.body.errors[0].message).toContain('Invalid payload.');
					});
				});
			}
		});

		describe('DELETE /:collection/:field', () => {
			describe('can delete virtual alias field', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const fieldName = 'test_divider';

					// Action
					const response = await request(getUrl(vendor))
						.get(`/fields/${localCollectionCountries}/${fieldName}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.delete(`/fields/${localCollectionCountries}/${fieldName}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response3 = await request(getUrl(vendor))
						.get(`/fields/${localCollectionCountries}/${fieldName}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response2.statusCode).toEqual(204);
					expect(response3.statusCode).toEqual(403);
				});
			});

			if (pkType === 'uuid') {
				describe('can delete user created field on system collection', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const systemUsersCollection = 'directus_users';
						const fieldName = 'user_field_test';

						// Action
						const response = await request(getUrl(vendor))
							.get(`/fields/${systemUsersCollection}/${fieldName}`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.delete(`/fields/${systemUsersCollection}/${fieldName}`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response3 = await request(getUrl(vendor))
							.get(`/fields/${systemUsersCollection}/${fieldName}`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response2.statusCode).toEqual(204);
						expect(response3.statusCode).toEqual(403);
					});
				});

				describe('cannot delete system field', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const systemUsersCollection = 'directus_users';
						const fieldName = 'description';

						// Action
						const response = await request(getUrl(vendor))
							.get(`/fields/${systemUsersCollection}/${fieldName}`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.delete(`/fields/${systemUsersCollection}/${fieldName}`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response3 = await request(getUrl(vendor))
							.get(`/fields/${systemUsersCollection}/${fieldName}`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response2.statusCode).toEqual(403);
						expect(response3.statusCode).toEqual(200);
					});
				});
			}
		});
	});

	ClearCaches();
});
