import request from 'supertest';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { v4 as uuid } from 'uuid';
import { CreateItem, ReadItem } from '@common/functions';
import { CachedTestsSchema, TestsSchemaVendorValues } from '@query/filter';
import * as common from '@common/index';
import {
	collectionFoods,
	collectionIngredients,
	collectionSuppliers,
	Food,
	Ingredient,
	getTestsSchema,
	seedDBValues,
} from './m2m.seed';
import { CheckQueryFilters } from '@query/filter';
import { findIndex } from 'lodash';
import { requestGraphQL } from '@common/index';

function createFood(pkType: common.PrimaryKeyType) {
	const item: Food = {
		name: 'food-' + uuid(),
		ingredients: [],
	};

	if (pkType === 'string') {
		item.id = 'food-' + uuid();
	}

	return item;
}

function createIngredient(pkType: common.PrimaryKeyType) {
	const item: Ingredient = {
		name: 'ingredient-' + uuid(),
	};

	if (pkType === 'string') {
		item.id = 'ingredient-' + uuid();
	}

	return item;
}

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

describe.each(common.PRIMARY_KEY_TYPES)('/items', (pkType) => {
	const localCollectionFoods = `${collectionFoods}_${pkType}`;
	const localCollectionIngredients = `${collectionIngredients}_${pkType}`;
	const localCollectionSuppliers = `${collectionSuppliers}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('GET /:collection/:id', () => {
			describe(`retrieves a ingredient's food`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const ingredient = createIngredient(pkType);
					const insertedIngredient = await CreateItem(vendor, {
						collection: localCollectionIngredients,
						item: {
							...ingredient,
							foods: {
								create: [{ [`${localCollectionIngredients}_id`]: createFood(pkType) }],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionIngredients}/${insertedIngredient.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[localCollectionIngredients]: {
								__args: {
									filter: {
										id: {
											_eq: insertedIngredient.id,
										},
									},
								},
								foods: {
									id: true,
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.foods).toHaveLength(1);

					expect(gqlResponse.statusCode).toEqual(200);
					expect(gqlResponse.body.data[localCollectionIngredients][0].foods).toHaveLength(1);
				});
			});
		});
		describe('GET /:collection', () => {
			describe(`retrieves a food using the $FOLLOW filter`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const ingredient = createIngredient(pkType);
					const food = createFood(pkType);
					const insertedIngredient = await CreateItem(vendor, {
						collection: localCollectionIngredients,
						item: {
							...ingredient,
							foods: {
								create: [{ [`${localCollectionFoods}_id`]: food }],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}`)
						.query({
							filter: JSON.stringify({
								[`$FOLLOW(${collectionFoods}_ingredients_${pkType},${localCollectionFoods}_id)`]: {
									_some: { [`${localCollectionIngredients}_id`]: { _eq: insertedIngredient.id } },
								},
							}),
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data).toMatchObject([expect.objectContaining({ name: food.name })]);
				});
			});

			describe('filters', () => {
				describe('on top level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const ingredient = createIngredient(pkType);
						ingredient.name = 'ingredient-m2m-top-' + uuid();
						const insertedIngredient = await CreateItem(vendor, {
							collection: localCollectionIngredients,
							item: ingredient,
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionIngredients}`)
							.query({
								filter: { id: { _eq: insertedIngredient.id } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionIngredients}`)
							.query({
								filter: { name: { _eq: insertedIngredient.name } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionIngredients]: {
									__args: {
										filter: {
											id: {
												_eq: insertedIngredient.id,
											},
										},
									},
									id: true,
								},
							},
						});

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionIngredients]: {
									__args: {
										filter: {
											name: {
												_eq: insertedIngredient.name,
											},
										},
									},
									id: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: insertedIngredient.id });
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data);

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(1);
						expect(gqlResponse.body.data[localCollectionIngredients][0]).toMatchObject({
							id: String(insertedIngredient.id),
						});
						expect(gqlResponse2.statusCode).toBe(200);
						expect(gqlResponse.body.data).toEqual(gqlResponse2.body.data);
					});
				});

				describe('on m2m level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const food = createFood(pkType);
						food.name = 'food-m2m-' + uuid();
						const ingredient = createIngredient(pkType);
						ingredient.name = 'ingredient-m2m-' + uuid();
						const insertedIngredient = await CreateItem(vendor, {
							collection: localCollectionIngredients,
							item: {
								...ingredient,
								foods: {
									create: [{ [`${localCollectionFoods}_id`]: food }],
									update: [],
									delete: [],
								},
							},
						});

						const retrievedIngredient = await ReadItem(vendor, {
							collection: localCollectionIngredients,
							fields: '*.*.*',
							filter: { id: { _eq: insertedIngredient.id } },
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionIngredients}`)
							.query({
								filter: JSON.stringify({
									foods: {
										[`${localCollectionFoods}_id`]: {
											id: { _eq: retrievedIngredient[0].foods[0][`${localCollectionFoods}_id`]['id'] },
										},
									},
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionIngredients}`)
							.query({
								filter: JSON.stringify({
									foods: { [`${localCollectionFoods}_id`]: { name: { _eq: food.name } } },
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionIngredients]: {
									__args: {
										filter: {
											foods: {
												[`${localCollectionFoods}_id`]: {
													id: { _eq: retrievedIngredient[0].foods[0][`${localCollectionFoods}_id`]['id'] },
												},
											},
										},
									},
									id: true,
								},
							},
						});

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionIngredients]: {
									__args: {
										filter: {
											foods: { [`${localCollectionFoods}_id`]: { name: { _eq: food.name } } },
										},
									},
									id: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: insertedIngredient.id });
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data);

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(1);
						expect(gqlResponse.body.data[localCollectionIngredients][0]).toMatchObject({
							id: String(insertedIngredient.id),
						});
						expect(gqlResponse2.statusCode).toBe(200);
						expect(gqlResponse.body.data).toEqual(gqlResponse2.body.data);
					});
				});
			});

			describe('filters with functions', () => {
				describe('on top level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const ingredient = createIngredient(pkType);
						ingredient.name = 'ingredient-m2m-top-fn-' + uuid();
						const insertedIngredient = await CreateItem(vendor, {
							collection: localCollectionIngredients,
							item: {
								...ingredient,
								foods: {
									create: [{ [`${localCollectionFoods}_id`]: createFood(pkType) }],
									update: [],
									delete: [],
								},
							},
						});

						const ingredient2 = createIngredient(pkType);
						ingredient2.name = 'ingredient-m2m-top-fn-' + uuid();
						const insertedIngredient2 = await CreateItem(vendor, {
							collection: localCollectionIngredients,
							item: {
								...ingredient2,
								foods: {
									create: [
										{ [`${localCollectionFoods}_id`]: createFood(pkType) },
										{ [`${localCollectionFoods}_id`]: createFood(pkType) },
									],
									update: [],
									delete: [],
								},
							},
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionIngredients}`)
							.query({
								filter: JSON.stringify({
									_and: [{ name: { _starts_with: 'ingredient-m2m-top-fn-' } }, { 'count(foods)': { _eq: 1 } }],
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionIngredients}`)
							.query({
								filter: JSON.stringify({
									_and: [{ name: { _starts_with: 'ingredient-m2m-top-fn-' } }, { 'count(foods)': { _eq: 2 } }],
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionIngredients]: {
									__args: {
										filter: {
											_and: [
												{ name: { _starts_with: 'ingredient-m2m-top-fn-' } },
												{ foods_func: { count: { _eq: 1 } } },
											],
										},
									},
									id: true,
									foods: {
										id: true,
									},
								},
							},
						});

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionIngredients]: {
									__args: {
										filter: {
											_and: [
												{ name: { _starts_with: 'ingredient-m2m-top-fn-' } },
												{ foods_func: { count: { _eq: 2 } } },
											],
										},
									},
									id: true,
									foods: {
										id: true,
									},
								},
							},
						});

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: insertedIngredient.id });
						expect(response.body.data[0].foods.length).toBe(1);
						expect(response2.statusCode).toEqual(200);
						expect(response2.body.data.length).toBe(1);
						expect(response2.body.data[0]).toMatchObject({ id: insertedIngredient2.id });
						expect(response2.body.data[0].foods.length).toBe(2);

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(1);
						expect(gqlResponse.body.data[localCollectionIngredients][0]).toMatchObject({
							id: String(insertedIngredient.id),
						});
						expect(gqlResponse.body.data[localCollectionIngredients][0].foods.length).toBe(1);
						expect(gqlResponse2.statusCode).toBe(200);
						expect(gqlResponse2.body.data[localCollectionIngredients].length).toBe(1);
						expect(gqlResponse2.body.data[localCollectionIngredients][0]).toMatchObject({
							id: String(insertedIngredient2.id),
						});
						expect(gqlResponse2.body.data[localCollectionIngredients][0].foods.length).toBe(2);
					});
				});

				describe('on m2m level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const years = [2000, 2010];
						const retrievedIngredients = [];

						for (const year of years) {
							const food = createFood(pkType);
							food.name = 'food-m2m-fn-' + uuid();
							food.test_datetime = new Date(new Date().setFullYear(year)).toISOString().slice(0, 19);
							const ingredient = createIngredient(pkType);
							ingredient.name = 'ingredient-m2m-fn-' + uuid();
							const insertedIngredient = await CreateItem(vendor, {
								collection: localCollectionIngredients,
								item: {
									...ingredient,
									foods: {
										create: [{ [`${localCollectionFoods}_id`]: food }],
										update: [],
										delete: [],
									},
								},
							});

							const retrievedIngredient = await ReadItem(vendor, {
								collection: localCollectionIngredients,
								fields: '*.*.*',
								filter: { id: { _eq: insertedIngredient.id } },
							});

							retrievedIngredients.push(retrievedIngredient);
						}

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionIngredients}`)
							.query({
								filter: JSON.stringify({
									_and: [
										{ name: { _starts_with: 'ingredient-m2m-fn-' } },
										{
											foods: {
												[`${localCollectionFoods}_id`]: {
													'year(test_datetime)': {
														_eq: years[0],
													},
												},
											},
										},
									],
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionIngredients}`)
							.query({
								filter: JSON.stringify({
									_and: [
										{ name: { _starts_with: 'ingredient-m2m-fn-' } },
										{
											foods: {
												[`${localCollectionFoods}_id`]: {
													'year(test_datetime)': {
														_eq: years[1],
													},
												},
											},
										},
									],
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionIngredients]: {
									__args: {
										filter: {
											_and: [
												{ name: { _starts_with: 'ingredient-m2m-fn-' } },
												{
													foods: {
														[`${localCollectionFoods}_id`]: {
															test_datetime_func: {
																year: {
																	_eq: years[0],
																},
															},
														},
													},
												},
											],
										},
									},
									id: true,
								},
							},
						});

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionIngredients]: {
									__args: {
										filter: {
											_and: [
												{ name: { _starts_with: 'ingredient-m2m-fn-' } },
												{
													foods: {
														[`${localCollectionFoods}_id`]: {
															test_datetime_func: {
																year: {
																	_eq: years[1],
																},
															},
														},
													},
												},
											],
										},
									},
									id: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: retrievedIngredients[0][0].id });
						expect(response2.statusCode).toEqual(200);
						expect(response2.body.data.length).toBe(1);
						expect(response2.body.data[0]).toMatchObject({ id: retrievedIngredients[1][0].id });

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(1);
						expect(gqlResponse.body.data[localCollectionIngredients][0]).toMatchObject({
							id: String(retrievedIngredients[0][0].id),
						});
						expect(gqlResponse2.statusCode).toBe(200);
						expect(gqlResponse2.body.data[localCollectionIngredients].length).toBe(1);
						expect(gqlResponse2.body.data[localCollectionIngredients][0]).toMatchObject({
							id: String(retrievedIngredients[1][0].id),
						});
					});
				});
			});

			describe('sorts', () => {
				describe('on top level', () => {
					beforeAll(async () => {
						for (const vendor of vendors) {
							// Setup
							const sortValues = [4, 2, 3, 5, 1];
							const ingredients = [];

							for (const val of sortValues) {
								const ingredient = createIngredient(pkType);
								ingredient.name = 'ingredient-m2m-top-sort-' + val;
								ingredients.push(ingredient);
							}

							await CreateItem(vendor, {
								collection: localCollectionIngredients,
								item: ingredients,
							});
						}
					});

					describe('without limit', () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: 'name',
									filter: { name: { _starts_with: 'ingredient-m2m-top-sort-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: '-name',
									filter: { name: { _starts_with: 'ingredient-m2m-top-sort-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: 'name',
											filter: { name: { _starts_with: 'ingredient-m2m-top-sort-' } },
										},
										id: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: '-name',
											filter: { name: { _starts_with: 'ingredient-m2m-top-sort-' } },
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response.body.data.length).toBe(5);
							expect(response2.statusCode).toEqual(200);
							expect(response.body.data).toEqual(response2.body.data.reverse());

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(5);
							expect(gqlResponse2.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionIngredients]).toEqual(
								gqlResponse2.body.data[localCollectionIngredients].reverse()
							);
						});
					});

					describe.each([-1, 1, 3])('where limit = %s', (limit) => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const expectedLength = limit === -1 ? 5 : limit;
							const expectedAsc = [1, 2, 3, 4, 5].slice(0, expectedLength);
							const expectedDesc = [5, 4, 3, 2, 1].slice(0, expectedLength);

							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: 'name',
									filter: { name: { _starts_with: 'ingredient-m2m-top-sort-' } },
									limit,
									fields: 'name',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: '-name',
									filter: { name: { _starts_with: 'ingredient-m2m-top-sort-' } },
									limit,
									fields: 'name',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: 'name',
											filter: { name: { _starts_with: 'ingredient-m2m-top-sort-' } },
											limit,
										},
										id: true,
										name: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: '-name',
											filter: { name: { _starts_with: 'ingredient-m2m-top-sort-' } },
											limit,
										},
										id: true,
										name: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response.body.data.length).toBe(expectedLength);
							expect(response2.statusCode).toEqual(200);
							expect(response.body.data).not.toEqual(response2.body.data);
							expect(
								response.body.data.map((item: any) => {
									return parseInt(item.name.slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.name.slice(-1));
								})
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionIngredients]).not.toEqual(
								gqlResponse2.body.data[localCollectionIngredients]
							);
							expect(
								gqlResponse.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(item.name.slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								gqlResponse2.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(item.name.slice(-1));
								})
							).toEqual(expectedDesc);
						});
					});
				});

				describe('on m2m level', () => {
					beforeAll(async () => {
						for (const vendor of vendors) {
							// Setup
							const sortValues = [4, 2, 3, 5, 1];

							for (const val of sortValues) {
								const food = createFood(pkType);
								food.name = 'food-m2m-sort-' + val;
								const ingredient = createIngredient(pkType);
								ingredient.name = 'ingredient-m2m-sort-' + uuid();
								await CreateItem(vendor, {
									collection: localCollectionIngredients,
									item: {
										...ingredient,
										foods: {
											create: [{ [`${localCollectionFoods}_id`]: food }],
											update: [],
											delete: [],
										},
									},
								});
							}
						}
					});

					describe('without limit', () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: `foods.${localCollectionFoods}_id.name`,
									filter: { name: { _starts_with: 'ingredient-m2m-sort-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: `-foods.${localCollectionFoods}_id.name`,
									filter: { name: { _starts_with: 'ingredient-m2m-sort-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: `foods.${localCollectionFoods}_id.name`,
											filter: { name: { _starts_with: 'ingredient-m2m-sort-' } },
										},
										id: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: `-foods.${localCollectionFoods}_id.name`,
											filter: { name: { _starts_with: 'ingredient-m2m-sort-' } },
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response2.statusCode).toEqual(200);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse2.statusCode).toEqual(200);

							// Oddity in MySQL5, looks to be indexing delays resulting in missing values
							if (vendor === 'mysql5') {
								let lastIndex = -1;
								for (const item of response2.body.data.reverse()) {
									const foundIndex = findIndex(response.body.data, { id: item.id });
									if (foundIndex === -1) continue;

									expect(foundIndex).toBeGreaterThan(lastIndex);

									if (foundIndex > lastIndex) {
										lastIndex = foundIndex;
									}
								}

								lastIndex = -1;
								for (const item of gqlResponse2.body.data[localCollectionIngredients].reverse()) {
									const foundIndex = findIndex(gqlResponse.body.data[localCollectionIngredients], { id: item.id });
									if (foundIndex === -1) continue;

									expect(foundIndex).toBeGreaterThan(lastIndex);

									if (foundIndex > lastIndex) {
										lastIndex = foundIndex;
									}
								}
								return;
							}

							expect(response.body.data.length).toBe(5);
							expect(response.body.data).toEqual(response2.body.data.reverse());

							expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(5);
							expect(gqlResponse.body.data[localCollectionIngredients]).toEqual(
								gqlResponse2.body.data[localCollectionIngredients].reverse()
							);
						});
					});

					describe.each([-1, 1, 3])('where limit = %s', (limit) => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const expectedLength = limit === -1 ? 5 : limit;
							const expectedAsc = [1, 2, 3, 4, 5].slice(0, expectedLength);
							const expectedDesc = [5, 4, 3, 2, 1].slice(0, expectedLength);

							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: `foods.${localCollectionFoods}_id.name`,
									filter: { name: { _starts_with: 'ingredient-m2m-sort-' } },
									limit,
									fields: `foods.${localCollectionFoods}_id.name`,
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: `-foods.${localCollectionFoods}_id.name`,
									filter: { name: { _starts_with: 'ingredient-m2m-sort-' } },
									limit,
									fields: `foods.${localCollectionFoods}_id.name`,
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: `foods.${localCollectionFoods}_id.name`,
											filter: { name: { _starts_with: 'ingredient-m2m-sort-' } },
											limit,
										},
										id: true,
										foods: {
											[`${localCollectionFoods}_id`]: {
												name: true,
											},
										},
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: `-foods.${localCollectionFoods}_id.name`,
											filter: { name: { _starts_with: 'ingredient-m2m-sort-' } },
											limit,
										},
										id: true,
										foods: {
											[`${localCollectionFoods}_id`]: {
												name: true,
											},
										},
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response2.statusCode).toEqual(200);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse2.statusCode).toEqual(200);

							// Oddity in MySQL5, looks to be indexing delays resulting in missing values
							if (vendor === 'mysql5') {
								for (const data of [
									{ response: response.body.data, expected: expectedAsc },
									{ response: response2.body.data, expected: expectedDesc },
								]) {
									expect(data.response.length).toBeLessThanOrEqual(expectedLength);

									let lastIndex = -1;
									for (const item of data.response) {
										const foundIndex = data.expected.indexOf(
											parseInt(item.foods[0][`${localCollectionFoods}_id`].name.slice(-1))
										);

										expect(foundIndex).toBeGreaterThan(lastIndex);

										if (foundIndex > lastIndex) {
											lastIndex = foundIndex;
										}
									}
								}

								for (const data of [
									{ response: gqlResponse.body.data[localCollectionIngredients], expected: expectedAsc },
									{ response: gqlResponse2.body.data[localCollectionIngredients], expected: expectedDesc },
								]) {
									expect(data.response.length).toBeLessThanOrEqual(expectedLength);

									let lastIndex = -1;
									for (const item of data.response) {
										const foundIndex = data.expected.indexOf(
											parseInt(item.foods[0][`${localCollectionFoods}_id`].name.slice(-1))
										);

										expect(foundIndex).toBeGreaterThan(lastIndex);

										if (foundIndex > lastIndex) {
											lastIndex = foundIndex;
										}
									}
								}

								return;
							}

							expect(response.body.data.length).toBe(expectedLength);
							expect(response.body.data).not.toEqual(response2.body.data);
							expect(
								response.body.data.map((item: any) => {
									return parseInt(item.foods[0][`${localCollectionFoods}_id`].name.slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.foods[0][`${localCollectionFoods}_id`].name.slice(-1));
								})
							).toEqual(expectedDesc);

							expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(expectedLength);
							expect(gqlResponse.body.data[localCollectionIngredients]).not.toEqual(
								gqlResponse2.body.data[localCollectionIngredients]
							);
							expect(
								gqlResponse.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(item.foods[0][`${localCollectionFoods}_id`].name.slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								gqlResponse2.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(item.foods[0][`${localCollectionFoods}_id`].name.slice(-1));
								})
							).toEqual(expectedDesc);
						});
					});
				});
			});

			describe('sorts with functions', () => {
				describe('on top level', () => {
					beforeAll(async () => {
						for (const vendor of vendors) {
							// Setup
							const sortValues = [4, 2, 3, 5, 1];
							const ingredients = [];

							for (const val of sortValues) {
								const ingredient = createIngredient(pkType);
								ingredient.name = 'ingredient-m2m-top-sort-fn-' + uuid();
								ingredient.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`)))
									.toISOString()
									.slice(0, 19);
								ingredients.push(ingredient);
							}

							await CreateItem(vendor, {
								collection: localCollectionIngredients,
								item: ingredients,
							});
						}
					});

					describe('without limit', () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: 'year(test_datetime)',
									filter: { name: { _starts_with: 'ingredient-m2m-top-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: '-year(test_datetime)',
									filter: { name: { _starts_with: 'ingredient-m2m-top-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: 'year(test_datetime)',
											filter: { name: { _starts_with: 'ingredient-m2m-top-sort-fn-' } },
										},
										id: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: '-year(test_datetime)',
											filter: { name: { _starts_with: 'ingredient-m2m-top-sort-fn-' } },
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response.body.data.length).toBe(5);
							expect(response2.statusCode).toEqual(200);
							expect(response.body.data).toEqual(response2.body.data.reverse());

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(5);
							expect(gqlResponse2.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionIngredients]).toEqual(
								gqlResponse2.body.data[localCollectionIngredients].reverse()
							);
						});
					});

					describe.each([-1, 1, 3])('where limit = %s', (limit) => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const expectedLength = limit === -1 ? 5 : limit;
							const expectedAsc = [1, 2, 3, 4, 5].slice(0, expectedLength);
							const expectedDesc = [5, 4, 3, 2, 1].slice(0, expectedLength);

							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: 'year(test_datetime)',
									filter: { name: { _starts_with: 'ingredient-m2m-top-sort-fn-' } },
									limit,
									fields: 'year(test_datetime)',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: '-year(test_datetime)',
									filter: { name: { _starts_with: 'ingredient-m2m-top-sort-fn-' } },
									limit,
									fields: 'year(test_datetime)',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: 'year(test_datetime)',
											filter: { name: { _starts_with: 'ingredient-m2m-top-sort-fn-' } },
											limit,
										},
										id: true,
										test_datetime_func: {
											year: true,
										},
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: '-year(test_datetime)',
											filter: { name: { _starts_with: 'ingredient-m2m-top-sort-fn-' } },
											limit,
										},
										id: true,
										test_datetime_func: {
											year: true,
										},
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response.body.data.length).toBe(expectedLength);
							expect(response2.statusCode).toEqual(200);
							expect(response.body.data).not.toEqual(response2.body.data);
							expect(
								response.body.data.map((item: any) => {
									return parseInt(item.test_datetime_year.toString().slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.test_datetime_year.toString().slice(-1));
								})
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionIngredients]).not.toEqual(
								gqlResponse2.body.data[localCollectionIngredients]
							);
							expect(
								gqlResponse.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(item.test_datetime_func.year.toString().slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								gqlResponse2.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(item.test_datetime_func.year.toString().slice(-1));
								})
							).toEqual(expectedDesc);
						});
					});
				});

				describe('on m2m level', () => {
					beforeAll(async () => {
						for (const vendor of vendors) {
							// Setup
							const sortValues = [4, 2, 3, 5, 1];

							for (const val of sortValues) {
								const food = createFood(pkType);
								food.name = 'food-m2m-sort-fn-' + uuid();
								food.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`))).toISOString().slice(0, 19);
								const ingredient = createIngredient(pkType);
								ingredient.name = 'ingredient-m2m-sort-fn-' + uuid();
								await CreateItem(vendor, {
									collection: localCollectionIngredients,
									item: {
										...ingredient,
										foods: {
											create: [{ [`${localCollectionFoods}_id`]: food }],
											update: [],
											delete: [],
										},
									},
								});
							}
						}
					});

					describe('without limit', () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: `foods.${localCollectionFoods}_id.year(test_datetime)`,
									filter: { name: { _starts_with: 'ingredient-m2m-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: `-foods.${localCollectionFoods}_id.year(test_datetime)`,
									filter: { name: { _starts_with: 'ingredient-m2m-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: `foods.${localCollectionFoods}_id.year(test_datetime)`,
											filter: { name: { _starts_with: 'ingredient-m2m-sort-fn-' } },
										},
										id: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: `-foods.${localCollectionFoods}_id.year(test_datetime)`,
											filter: { name: { _starts_with: 'ingredient-m2m-sort-fn-' } },
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response2.statusCode).toEqual(200);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse2.statusCode).toEqual(200);

							// Oddity in MySQL5, looks to be indexing delays resulting in missing values
							if (vendor === 'mysql5') {
								let lastIndex = -1;
								for (const item of response2.body.data.reverse()) {
									const foundIndex = findIndex(response.body.data, { id: item.id });
									if (foundIndex === -1) continue;

									expect(foundIndex).toBeGreaterThan(lastIndex);

									if (foundIndex > lastIndex) {
										lastIndex = foundIndex;
									}
								}

								lastIndex = -1;
								for (const item of gqlResponse2.body.data[localCollectionIngredients].reverse()) {
									const foundIndex = findIndex(gqlResponse.body.data[localCollectionIngredients], { id: item.id });
									if (foundIndex === -1) continue;

									expect(foundIndex).toBeGreaterThan(lastIndex);

									if (foundIndex > lastIndex) {
										lastIndex = foundIndex;
									}
								}
								return;
							}

							expect(response.body.data.length).toBe(5);
							expect(response.body.data).toEqual(response2.body.data.reverse());

							expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(5);
							expect(gqlResponse.body.data[localCollectionIngredients]).toEqual(
								gqlResponse2.body.data[localCollectionIngredients].reverse()
							);
						});
					});

					describe.each([-1, 1, 3])('where limit = %s', (limit) => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const expectedLength = limit === -1 ? 5 : limit;
							const expectedAsc = [1, 2, 3, 4, 5].slice(0, expectedLength);
							const expectedDesc = [5, 4, 3, 2, 1].slice(0, expectedLength);

							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: `foods.${localCollectionFoods}_id.year(test_datetime)`,
									filter: { name: { _starts_with: 'ingredient-m2m-sort-fn-' } },
									limit,
									fields: `foods.${localCollectionFoods}_id.year(test_datetime)`,
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: `-foods.${localCollectionFoods}_id.year(test_datetime)`,
									filter: { name: { _starts_with: 'ingredient-m2m-sort-fn-' } },
									limit,
									fields: `foods.${localCollectionFoods}_id.year(test_datetime)`,
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: `foods.${localCollectionFoods}_id.year(test_datetime)`,
											filter: { name: { _starts_with: 'ingredient-m2m-sort-fn-' } },
											limit,
										},
										id: true,
										foods: {
											[`${localCollectionFoods}_id`]: {
												test_datetime_func: {
													year: true,
												},
											},
										},
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionIngredients]: {
										__args: {
											sort: `-foods.${localCollectionFoods}_id.year(test_datetime)`,
											filter: { name: { _starts_with: 'ingredient-m2m-sort-fn-' } },
											limit,
										},
										id: true,
										foods: {
											[`${localCollectionFoods}_id`]: {
												test_datetime_func: {
													year: true,
												},
											},
										},
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response2.statusCode).toEqual(200);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse2.statusCode).toEqual(200);

							// Oddity in MySQL5, looks to be indexing delays resulting in missing values
							if (vendor === 'mysql5') {
								for (const data of [
									{ response: response.body.data, expected: expectedAsc },
									{ response: response2.body.data, expected: expectedDesc },
								]) {
									expect(data.response.length).toBeLessThanOrEqual(expectedLength);

									let lastIndex = -1;
									for (const item of data.response) {
										const foundIndex = data.expected.indexOf(
											parseInt(item.foods[0][`${localCollectionFoods}_id`].test_datetime_year.toString().slice(-1))
										);

										expect(foundIndex).toBeGreaterThan(lastIndex);

										if (foundIndex > lastIndex) {
											lastIndex = foundIndex;
										}
									}
								}

								for (const data of [
									{ response: gqlResponse.body.data[localCollectionIngredients], expected: expectedAsc },
									{ response: gqlResponse2.body.data[localCollectionIngredients], expected: expectedDesc },
								]) {
									expect(data.response.length).toBeLessThanOrEqual(expectedLength);

									let lastIndex = -1;
									for (const item of data.response) {
										const foundIndex = data.expected.indexOf(
											parseInt(item.foods[0][`${localCollectionFoods}_id`].test_datetime_func.year.toString().slice(-1))
										);

										expect(foundIndex).toBeGreaterThan(lastIndex);

										if (foundIndex > lastIndex) {
											lastIndex = foundIndex;
										}
									}
								}

								return;
							}

							expect(response.body.data.length).toBe(expectedLength);
							expect(response.body.data).not.toEqual(response2.body.data);
							expect(
								response.body.data.map((item: any) => {
									return parseInt(item.foods[0][`${localCollectionFoods}_id`].test_datetime_year.toString().slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.foods[0][`${localCollectionFoods}_id`].test_datetime_year.toString().slice(-1));
								})
							).toEqual(expectedDesc);

							expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(expectedLength);
							expect(gqlResponse.body.data[localCollectionIngredients]).not.toEqual(
								gqlResponse2.body.data[localCollectionIngredients]
							);
							expect(
								gqlResponse.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(
										item.foods[0][`${localCollectionFoods}_id`].test_datetime_func.year.toString().slice(-1)
									);
								})
							).toEqual(expectedAsc);
							expect(
								gqlResponse2.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(
										item.foods[0][`${localCollectionFoods}_id`].test_datetime_func.year.toString().slice(-1)
									);
								})
							).toEqual(expectedDesc);
						});
					});
				});
			});

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionFoods}`,
					token: common.USER.ADMIN.TOKEN,
				},
				localCollectionFoods,
				cachedSchema[pkType][localCollectionFoods],
				vendorSchemaValues
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionIngredients}`,
					token: common.USER.ADMIN.TOKEN,
				},
				localCollectionIngredients,
				cachedSchema[pkType][localCollectionIngredients],
				vendorSchemaValues
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionSuppliers}`,
					token: common.USER.ADMIN.TOKEN,
				},
				localCollectionSuppliers,
				cachedSchema[pkType][localCollectionSuppliers],
				vendorSchemaValues
			);
		});
	});
});
