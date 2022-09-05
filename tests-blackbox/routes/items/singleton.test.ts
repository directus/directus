import request from 'supertest';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import * as common from '@common/index';
import { collectionSingleton, collectionSingletonO2M, seedDBValues } from './singleton.seed';
import { SeedFunctions } from '@common/index';

let isSeeded = false;

beforeAll(async () => {
	isSeeded = await seedDBValues();
}, 300000);

test('Seed Database Values', () => {
	expect(isSeeded).toStrictEqual(true);
});

describe.each(common.PRIMARY_KEY_TYPES)('/items', (pkType) => {
	const localCollectionSingleton = `${collectionSingleton}_${pkType}`;
	const localCollectionSingletonO2M = `${collectionSingletonO2M}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('GET /:collection', () => {
			describe('retrieves singleton', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionSingleton}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: 'parent', o2m: expect.anything() });
				});
			});

			describe('Error handling', () => {
				describe('returns an error when an invalid id is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionSingleton}/invalid_id`)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toBe(403);
					});
				});
			});
		});

		describe('PATCH /:collection', () => {
			describe(`updates singleton's name with no relations`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const newName = 'parent_updated';

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionSingleton}`)
						.send({ name: newName })
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({
						name: newName,
					});
				});
			});

			describe('updates o2m items', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const existingItem = (
						await request(getUrl(vendor))
							.get(`/items/${localCollectionSingleton}`)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					).body.data;

					const o2mNameNew = 'child_o2m_new';
					const o2mNameUpdated = 'child_o2m_updated';

					const body = {
						o2m: {
							create: [
								{
									id:
										pkType === 'string'
											? SeedFunctions.generatePrimaryKeys(pkType, {
													quantity: 1,
													seed: `${localCollectionSingletonO2M}_update_o2m`,
											  })[0]
											: undefined,
									name: o2mNameNew,
								},
							],
							update: [
								{
									id: existingItem.o2m[0],
									name: o2mNameUpdated,
								},
							],
							delete: [],
						},
					};

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionSingleton}?fields=*.*`)
						.send(body)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.o2m).toBeDefined();
					expect(response.body.data.o2m.length).toBe(2);
					expect(response.body.data.o2m.map((item: any) => item.name)).toEqual(
						expect.arrayContaining([o2mNameNew, o2mNameUpdated])
					);
				});
			});
		});
	});
});
