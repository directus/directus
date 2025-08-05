import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { SeedFunctions } from '@common/seed-functions';
import { requestGraphQL } from '@common/transport';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it, test } from 'vitest';
import { collectionSingleton, collectionSingletonO2M, seedDBValues } from './singleton.seed';

let isSeeded = false;

beforeAll(async () => {
	isSeeded = await seedDBValues();
}, 300_000);

test('Seed Database Values', () => {
	expect(isSeeded).toStrictEqual(true);
});

describe.each(PRIMARY_KEY_TYPES)('/items', (pkType) => {
	const localCollectionSingleton = `${collectionSingleton}_${pkType}`;
	const localCollectionSingletonO2M = `${collectionSingletonO2M}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('GET /:collection', () => {
			describe('retrieves singleton', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionSingleton}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionSingleton]: {
								name: true,
								o2m: {
									id: true,
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: 'parent', o2m: expect.anything() });

					expect(gqlResponse.statusCode).toEqual(200);

					expect(gqlResponse.body.data).toMatchObject({
						[localCollectionSingleton]: { name: 'parent', o2m: expect.anything() },
					});
				});
			});

			describe('Error handling', () => {
				describe('returns an error when an invalid id is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionSingleton}/invalid_id`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
							query: {
								[localCollectionSingleton]: {
									__args: {
										filter: {
											id: {
												_eq: 'invalid_id',
											},
										},
									},
									name: true,
									o2m: {
										id: true,
									},
								},
							},
						});

						// Assert
						expect(response.statusCode).toBe(403);
						expect(gqlResponse.statusCode).toBe(400);
					});
				});
			});
		});

		describe('PATCH /:collection', () => {
			describe(`updates singleton's name with no relations`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const newName = 'parent_updated';
					const newName2 = 'parent_updated2';

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionSingleton}`)
						.send({ name: newName })
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const mutationKey = `update_${localCollectionSingleton}`;

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						mutation: {
							[mutationKey]: {
								__args: {
									data: {
										name: newName2,
									},
								},
								name: true,
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);

					expect(response.body.data).toMatchObject({
						name: newName,
					});

					expect(gqlResponse.statusCode).toBe(200);

					expect(gqlResponse.body.data[mutationKey]).toEqual({
						name: newName2,
					});
				});
			});

			describe('updates o2m items', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const existingItem = (
						await request(getUrl(vendor))
							.get(`/items/${localCollectionSingleton}`)
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					).body.data;

					const o2mNameNew = 'child_o2m_new';
					const o2mNameNew2 = 'child_o2m_new2';
					const o2mNameUpdated = 'child_o2m_updated';
					const o2mNameUpdated2 = 'child_o2m_updated2';

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
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponsePre = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionSingleton]: {
								o2m: {
									id: true,
									name: true,
								},
							},
						},
					});

					const updatedO2M = gqlResponsePre.body.data[localCollectionSingleton].o2m;
					const newO2mItem: any = { name: o2mNameNew2 };

					if (pkType === 'string') {
						newO2mItem.id = SeedFunctions.generatePrimaryKeys(pkType, {
							quantity: 1,
							seed: `${localCollectionSingletonO2M}_update_o2m2`,
						})[0];
					}

					updatedO2M.push(newO2mItem);
					updatedO2M[0].name = o2mNameUpdated2;

					const mutationKey = `update_${localCollectionSingleton}`;

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						mutation: {
							[mutationKey]: {
								__args: {
									data: {
										o2m: updatedO2M,
									},
								},
								o2m: {
									name: true,
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.o2m).toBeDefined();
					expect(response.body.data.o2m.length).toBe(2);

					expect(response.body.data.o2m.map((item: any) => item.name)).toEqual(
						expect.arrayContaining([o2mNameNew, o2mNameUpdated]),
					);

					expect(gqlResponse.statusCode).toEqual(200);
					expect(gqlResponse.body.data[mutationKey].o2m).toBeDefined();
					expect(gqlResponse.body.data[mutationKey].o2m.length).toBe(3);

					expect(gqlResponse.body.data[mutationKey].o2m.map((item: any) => item.name)).toEqual(
						expect.arrayContaining([o2mNameNew2, o2mNameUpdated2]),
					);
				});
			});
		});
	});
});
