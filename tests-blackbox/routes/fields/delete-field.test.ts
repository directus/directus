import request from 'supertest';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { CreateField, DeleteField } from '@common/functions';
import { CachedTestsSchema, TestsSchemaVendorValues } from '@query/filter';
import * as common from '@common/index';
import { collectionCountries, collectionStates, getTestsSchema, seedDBValues } from './delete-field.seed';

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
	});

	common.ClearCaches();
});
