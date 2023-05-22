import request from 'supertest';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { CreateField, DeleteField } from '@common/functions';
import { CachedTestsSchema, TestsSchemaVendorValues } from '@query/filter';
import * as common from '@common/index';
import { collectionCountries, collectionStates, getTestsSchema, seedDBValues } from './change-fields.seed';

const cachedSchema = common.PRIMARY_KEY_TYPES.reduce((acc, pkType) => {
	acc[pkType] = getTestsSchema(pkType);
	return acc;
}, {} as CachedTestsSchema);

const vendorSchemaValues: TestsSchemaVendorValues = {};

beforeAll(async () => {
	await seedDBValues(cachedSchema, vendorSchemaValues);
}, 300000);

describe('Seed Database Values', () => {
	it.each(vendors)('%s', async (vendor) => {
		// Assert
		expect(vendorSchemaValues[vendor]).toBeDefined();
	});
});

describe.each(common.PRIMARY_KEY_TYPES)('/fields', (pkType) => {
	common.DisableTestCachingSetup();

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
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

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
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

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
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

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
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					await request(getUrl(vendor))
						.post(`/relations`)
						.send({
							collection: localCollectionCountries,
							field: fieldName,
							related_collection: 'directus_files',
							meta: { sort_field: null },
							schema: { on_delete: 'SET NULL' },
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/items/${localCollectionStates}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

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
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/fields/${localCollectionCountries}/${fieldName}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response2.statusCode).toEqual(200);

					expect(response2.body.data).toEqual(
						expect.objectContaining({
							field: fieldName,
							type: 'alias',
							collection: localCollectionCountries,
						})
					);
				});
			});
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
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/fields/${localCollectionCountries}/${fieldName}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

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
						})
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
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/fields/${localCollectionCountries}/${fieldName}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

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
						})
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
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					).body.data;

					payload.meta.options = { template: 'updated' };

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/fields/${localCollectionStates}/${fieldName}`)
						.send(payload)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/fields/${localCollectionStates}/${fieldName}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response2.statusCode).toEqual(200);
					expect(response2.body.data).toEqual(payload);
				});
			});
		});
	});

	common.ClearCaches();
});
