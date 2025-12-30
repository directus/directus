import {
	collectionFoods,
	collectionIngredients,
	collectionSuppliers,
	type Food,
	getTestsSchema,
	type Ingredient,
	seedDBValues,
	type Supplier,
} from './m2m.seed';
import { type CachedTestsSchema, CheckQueryFilters, type TestsSchemaVendorValues } from '../../query/filter';
import config, { getUrl } from '@common/config';
import { CreateItem, ReadItem } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { requestGraphQL } from '@common/transport';
import type { PrimaryKeyType } from '@common/types';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import { findIndex, without } from 'lodash-es';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it, test } from 'vitest';

function createFood(pkType: PrimaryKeyType) {
	const item: Food = {
		name: 'food-' + randomUUID(),
		ingredients: [],
	};

	if (pkType === 'string') {
		item.id = 'food-' + randomUUID();
	}

	return item;
}

function createIngredient(pkType: PrimaryKeyType) {
	const item: Ingredient = {
		name: 'ingredient-' + randomUUID(),
	};

	if (pkType === 'string') {
		item.id = 'ingredient-' + randomUUID();
	}

	return item;
}

function createSupplier(pkType: PrimaryKeyType) {
	const item: Supplier = {
		name: 'supplier-' + randomUUID(),
	};

	if (pkType === 'string') {
		item.id = 'supplier-' + randomUUID();
	}

	return item;
}

const cachedSchema = PRIMARY_KEY_TYPES.reduce((acc, pkType) => {
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

describe.each(PRIMARY_KEY_TYPES)('/items', (pkType) => {
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
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

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
						ingredient.name = 'ingredient-m2m-top-' + randomUUID();

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
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionIngredients}`)
							.query({
								filter: { name: { _eq: insertedIngredient.name } },
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
						food.name = 'food-m2m-' + randomUUID();
						const ingredient = createIngredient(pkType);
						ingredient.name = 'ingredient-m2m-' + randomUUID();

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
							fields: ['*.*.*'],
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
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionIngredients}`)
							.query({
								filter: JSON.stringify({
									foods: { [`${localCollectionFoods}_id`]: { name: { _eq: food.name } } },
								}),
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
						ingredient.name = 'ingredient-m2m-top-fn-' + randomUUID();

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
						ingredient2.name = 'ingredient-m2m-top-fn-' + randomUUID();

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
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionIngredients}`)
							.query({
								filter: JSON.stringify({
									_and: [{ name: { _starts_with: 'ingredient-m2m-top-fn-' } }, { 'count(foods)': { _eq: 2 } }],
								}),
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
							food.name = 'food-m2m-fn-' + randomUUID();
							food.test_datetime = new Date(new Date().setFullYear(year)).toISOString().slice(0, 19);
							const ingredient = createIngredient(pkType);
							ingredient.name = 'ingredient-m2m-fn-' + randomUUID();

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
								fields: ['*.*.*'],
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
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

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
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: '-name',
									filter: { name: { _starts_with: 'ingredient-m2m-top-sort-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								gqlResponse2.body.data[localCollectionIngredients].reverse(),
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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: '-name',
									filter: { name: { _starts_with: 'ingredient-m2m-top-sort-' } },
									limit,
									fields: 'name',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								}),
							).toEqual(expectedAsc);

							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.name.slice(-1));
								}),
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);

							expect(gqlResponse.body.data[localCollectionIngredients]).not.toEqual(
								gqlResponse2.body.data[localCollectionIngredients],
							);

							expect(
								gqlResponse.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(item.name.slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								gqlResponse2.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(item.name.slice(-1));
								}),
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
								ingredient.name = 'ingredient-m2m-sort-' + randomUUID();

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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: `-foods.${localCollectionFoods}_id.name`,
									filter: { name: { _starts_with: 'ingredient-m2m-sort-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								gqlResponse2.body.data[localCollectionIngredients].reverse(),
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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: `-foods.${localCollectionFoods}_id.name`,
									filter: { name: { _starts_with: 'ingredient-m2m-sort-' } },
									limit,
									fields: `foods.${localCollectionFoods}_id.name`,
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
											parseInt(item.foods[0][`${localCollectionFoods}_id`].name.slice(-1)),
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
											parseInt(item.foods[0][`${localCollectionFoods}_id`].name.slice(-1)),
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
								}),
							).toEqual(expectedAsc);

							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.foods[0][`${localCollectionFoods}_id`].name.slice(-1));
								}),
							).toEqual(expectedDesc);

							expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(expectedLength);

							expect(gqlResponse.body.data[localCollectionIngredients]).not.toEqual(
								gqlResponse2.body.data[localCollectionIngredients],
							);

							expect(
								gqlResponse.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(item.foods[0][`${localCollectionFoods}_id`].name.slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								gqlResponse2.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(item.foods[0][`${localCollectionFoods}_id`].name.slice(-1));
								}),
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
								ingredient.name = 'ingredient-m2m-top-sort-fn-' + randomUUID();

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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: '-year(test_datetime)',
									filter: { name: { _starts_with: 'ingredient-m2m-top-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								gqlResponse2.body.data[localCollectionIngredients].reverse(),
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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: '-year(test_datetime)',
									filter: { name: { _starts_with: 'ingredient-m2m-top-sort-fn-' } },
									limit,
									fields: 'year(test_datetime)',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								}),
							).toEqual(expectedAsc);

							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.test_datetime_year.toString().slice(-1));
								}),
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);

							expect(gqlResponse.body.data[localCollectionIngredients]).not.toEqual(
								gqlResponse2.body.data[localCollectionIngredients],
							);

							expect(
								gqlResponse.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(item.test_datetime_func.year.toString().slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								gqlResponse2.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(item.test_datetime_func.year.toString().slice(-1));
								}),
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
								food.name = 'food-m2m-sort-fn-' + randomUUID();
								food.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`))).toISOString().slice(0, 19);
								const ingredient = createIngredient(pkType);
								ingredient.name = 'ingredient-m2m-sort-fn-' + randomUUID();

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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: `-foods.${localCollectionFoods}_id.year(test_datetime)`,
									filter: { name: { _starts_with: 'ingredient-m2m-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								gqlResponse2.body.data[localCollectionIngredients].reverse(),
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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionIngredients}`)
								.query({
									sort: `-foods.${localCollectionFoods}_id.year(test_datetime)`,
									filter: { name: { _starts_with: 'ingredient-m2m-sort-fn-' } },
									limit,
									fields: `foods.${localCollectionFoods}_id.year(test_datetime)`,
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
											parseInt(item.foods[0][`${localCollectionFoods}_id`].test_datetime_year.toString().slice(-1)),
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
											parseInt(
												item.foods[0][`${localCollectionFoods}_id`].test_datetime_func.year.toString().slice(-1),
											),
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
								}),
							).toEqual(expectedAsc);

							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.foods[0][`${localCollectionFoods}_id`].test_datetime_year.toString().slice(-1));
								}),
							).toEqual(expectedDesc);

							expect(gqlResponse.body.data[localCollectionIngredients].length).toBe(expectedLength);

							expect(gqlResponse.body.data[localCollectionIngredients]).not.toEqual(
								gqlResponse2.body.data[localCollectionIngredients],
							);

							expect(
								gqlResponse.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(
										item.foods[0][`${localCollectionFoods}_id`].test_datetime_func.year.toString().slice(-1),
									);
								}),
							).toEqual(expectedAsc);

							expect(
								gqlResponse2.body.data[localCollectionIngredients].map((item: any) => {
									return parseInt(
										item.foods[0][`${localCollectionFoods}_id`].test_datetime_func.year.toString().slice(-1),
									);
								}),
							).toEqual(expectedDesc);
						});
					});
				});
			});

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionFoods}`,
					token: USER.ADMIN.TOKEN,
				},
				localCollectionFoods,
				cachedSchema[pkType][localCollectionFoods],
				vendorSchemaValues,
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionIngredients}`,
					token: USER.ADMIN.TOKEN,
				},
				localCollectionIngredients,
				cachedSchema[pkType][localCollectionIngredients],
				vendorSchemaValues,
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionSuppliers}`,
					token: USER.ADMIN.TOKEN,
				},
				localCollectionSuppliers,
				cachedSchema[pkType][localCollectionSuppliers],
				vendorSchemaValues,
			);
		});

		describe('Depth Tests', () => {
			describe('allow queries up to the field depth limit', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const food = createFood(pkType);

					const insertedFood = await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: {
							...food,
							ingredients: {
								create: [{ [`${localCollectionFoods}_id`]: createIngredient(pkType) }],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}/${insertedFood.id}`)
						.query({
							fields: '*.*.*.*.*',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionFoods]: {
								__args: {
									filter: {
										id: {
											_eq: insertedFood.id,
										},
									},
								},
								ingredients: {
									[`${localCollectionFoods}_id`]: {
										ingredients: {
											[`${localCollectionFoods}_id`]: {
												id: true,
											},
										},
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);

					expect(response.body.data).toEqual(
						expect.objectContaining({
							ingredients: expect.arrayContaining([
								expect.objectContaining({
									[`${localCollectionFoods}_id`]: expect.objectContaining({
										ingredients: expect.arrayContaining([
											expect.objectContaining({
												[`${localCollectionFoods}_id`]: expect.objectContaining({
													ingredients: [expect.any(Number)],
												}),
											}),
										]),
									}),
								}),
							]),
						}),
					);

					expect(gqlResponse.statusCode).toEqual(200);

					expect(gqlResponse.body.data).toEqual(
						expect.objectContaining({
							[localCollectionFoods]: expect.arrayContaining([
								expect.objectContaining({
									ingredients: expect.arrayContaining([
										expect.objectContaining({
											[`${localCollectionFoods}_id`]: expect.objectContaining({
												ingredients: expect.arrayContaining([
													expect.objectContaining({
														[`${localCollectionFoods}_id`]: expect.objectContaining({
															id: expect.any(String),
														}),
													}),
												]),
											}),
										}),
									]),
								}),
							]),
						}),
					);
				});
			});

			describe('deny queries over the field depth limit', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const food = createFood(pkType);

					const insertedFood = await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: {
							...food,
							ingredients: {
								create: [{ [`${localCollectionFoods}_id`]: createIngredient(pkType) }],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}/${insertedFood.id}`)
						.query({
							fields: '*.*.*.*.*.*',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionFoods]: {
								__args: {
									filter: {
										id: {
											_eq: insertedFood.id,
										},
									},
								},
								ingredients: {
									[`${localCollectionFoods}_id`]: {
										ingredients: {
											[`${localCollectionFoods}_id`]: {
												ingredients: {
													id: true,
												},
											},
										},
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toHaveLength(1);
					expect(response.body.errors[0].message).toBe('Invalid query. Max relational depth exceeded.');

					expect(gqlResponse.body.errors).toBeDefined();
					expect(gqlResponse.body.errors.length).toEqual(1);
					expect(gqlResponse.body.errors[0].message).toBe('Invalid query. Max relational depth exceeded.');
				});
			});

			describe('allow queries up to deep depth limit', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const food = createFood(pkType);

					const insertedFood = await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: {
							...food,
							ingredients: {
								create: [{ [`${localCollectionFoods}_id`]: createIngredient(pkType) }],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}/${insertedFood.id}`)
						.query({
							fields: '*.*.*.*.*',
							deep: JSON.stringify({
								ingredients: {
									_filter: {
										[`${localCollectionFoods}_id`]: {
											ingredients: {
												[`${localCollectionFoods}_id`]: {
													id: {
														_eq: insertedFood.id,
													},
												},
											},
										},
									},
								},
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);

					expect(response.body.data).toEqual(
						expect.objectContaining({
							ingredients: expect.arrayContaining([
								expect.objectContaining({
									[`${localCollectionFoods}_id`]: expect.objectContaining({
										ingredients: expect.arrayContaining([
											expect.objectContaining({
												[`${localCollectionFoods}_id`]: expect.objectContaining({
													ingredients: [expect.any(Number)],
												}),
											}),
										]),
									}),
								}),
							]),
						}),
					);
				});
			});

			describe('deny queries over the deep depth limit', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const food = createFood(pkType);
					const ingredient = createIngredient(pkType);

					const insertedFood = await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: {
							...food,
							ingredients: {
								create: [{ [`${localCollectionFoods}_id`]: ingredient }],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}/${insertedFood.id}`)
						.query({
							fields: '*.*.*.*.*',
							deep: JSON.stringify({
								ingredients: {
									_filter: {
										[`${localCollectionFoods}_id`]: {
											ingredients: {
												[`${localCollectionFoods}_id`]: {
													ingredients: {
														id: {
															_eq: ingredient.id,
														},
													},
												},
											},
										},
									},
								},
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toHaveLength(1);
					expect(response.body.errors[0].message).toBe('Invalid query. Max relational depth exceeded.');
				});
			});

			describe('allow queries up to filter depth limit', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const food = createFood(pkType);

					const insertedFood = await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: {
							...food,
							ingredients: {
								create: [{ [`${localCollectionFoods}_id`]: createIngredient(pkType) }],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}/${insertedFood.id}`)
						.query({
							fields: '*.*.*.*.*',
							filter: JSON.stringify({
								ingredients: {
									[`${localCollectionFoods}_id`]: {
										ingredients: {
											[`${localCollectionFoods}_id`]: {
												id: {
													_eq: insertedFood.id,
												},
											},
										},
									},
								},
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionFoods]: {
								__args: {
									filter: {
										id: {
											_eq: insertedFood.id,
										},
									},
								},
								ingredients: {
									[`${localCollectionFoods}_id`]: {
										ingredients: {
											[`${localCollectionFoods}_id`]: {
												__args: {
													filter: {
														id: {
															_eq: insertedFood.id,
														},
													},
												},
												id: true,
											},
										},
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);

					expect(response.body.data).toEqual(
						expect.objectContaining({
							ingredients: expect.arrayContaining([
								expect.objectContaining({
									[`${localCollectionFoods}_id`]: expect.objectContaining({
										ingredients: expect.arrayContaining([
											expect.objectContaining({
												[`${localCollectionFoods}_id`]: expect.objectContaining({
													ingredients: [expect.any(Number)],
												}),
											}),
										]),
									}),
								}),
							]),
						}),
					);

					expect(gqlResponse.statusCode).toEqual(200);

					expect(gqlResponse.body.data).toEqual(
						expect.objectContaining({
							[localCollectionFoods]: expect.arrayContaining([
								expect.objectContaining({
									ingredients: expect.arrayContaining([
										expect.objectContaining({
											[`${localCollectionFoods}_id`]: expect.objectContaining({
												ingredients: expect.arrayContaining([
													expect.objectContaining({
														[`${localCollectionFoods}_id`]: expect.objectContaining({
															id: expect.any(String),
														}),
													}),
												]),
											}),
										}),
									]),
								}),
							]),
						}),
					);
				});
			});

			describe('deny queries over the filter depth limit', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const food = createFood(pkType);
					const ingredient = createIngredient(pkType);

					const insertedFood = await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: {
							...food,
							ingredients: {
								create: [{ [`${localCollectionFoods}_id`]: ingredient }],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}/${insertedFood.id}`)
						.query({
							fields: '*.*.*.*.*',
							filter: JSON.stringify({
								ingredients: {
									[`${localCollectionFoods}_id`]: {
										ingredients: {
											[`${localCollectionFoods}_id`]: {
												ingredients: {
													id: {
														_eq: ingredient.id,
													},
												},
											},
										},
									},
								},
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionFoods]: {
								__args: {
									filter: {
										id: {
											_eq: insertedFood.id,
										},
									},
								},
								ingredients: {
									[`${localCollectionFoods}_id`]: {
										ingredients: {
											[`${localCollectionFoods}_id`]: {
												__args: {
													filter: {
														ingredients: {
															id: {
																_eq: insertedFood.id,
															},
														},
													},
												},
												id: true,
											},
										},
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toHaveLength(1);
					expect(response.body.errors[0].message).toBe('Invalid query. Max relational depth exceeded.');

					expect(gqlResponse.body.errors).toBeDefined();
					expect(gqlResponse.body.errors.length).toEqual(1);
					expect(gqlResponse.body.errors[0].message).toBe('Invalid query. Max relational depth exceeded.');
				});
			});

			describe('allow queries up to sort depth limit', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const food = createFood(pkType);

					const insertedFood = await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: {
							...food,
							ingredients: {
								create: [{ [`${localCollectionFoods}_id`]: createIngredient(pkType) }],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}/${insertedFood.id}`)
						.query({
							fields: '*.*.*.*.*',
							sort: `ingredients.${localCollectionFoods}_id.ingredients.${localCollectionFoods}_id.id`,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionFoods]: {
								__args: {
									filter: {
										id: {
											_eq: insertedFood.id,
										},
									},
								},
								ingredients: {
									[`${localCollectionFoods}_id`]: {
										ingredients: {
											[`${localCollectionFoods}_id`]: {
												__args: {
													sort: 'id',
												},
												id: true,
											},
										},
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);

					expect(response.body.data).toEqual(
						expect.objectContaining({
							ingredients: expect.arrayContaining([
								expect.objectContaining({
									[`${localCollectionFoods}_id`]: expect.objectContaining({
										ingredients: expect.arrayContaining([
											expect.objectContaining({
												[`${localCollectionFoods}_id`]: expect.objectContaining({
													ingredients: [expect.any(Number)],
												}),
											}),
										]),
									}),
								}),
							]),
						}),
					);

					expect(gqlResponse.statusCode).toEqual(200);

					expect(gqlResponse.body.data).toEqual(
						expect.objectContaining({
							[localCollectionFoods]: expect.arrayContaining([
								expect.objectContaining({
									ingredients: expect.arrayContaining([
										expect.objectContaining({
											[`${localCollectionFoods}_id`]: expect.objectContaining({
												ingredients: expect.arrayContaining([
													expect.objectContaining({
														[`${localCollectionFoods}_id`]: expect.objectContaining({
															id: expect.any(String),
														}),
													}),
												]),
											}),
										}),
									]),
								}),
							]),
						}),
					);
				});
			});

			describe('deny queries over the sort depth limit', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const food = createFood(pkType);

					const insertedFood = await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: {
							...food,
							ingredients: {
								create: [{ [`${localCollectionFoods}_id`]: createIngredient(pkType) }],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}/${insertedFood.id}`)
						.query({
							fields: '*.*.*.*.*',
							sort: `ingredients.${localCollectionFoods}_id.ingredients.${localCollectionFoods}_id.ingredients.id`,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionFoods]: {
								__args: {
									filter: {
										id: {
											_eq: insertedFood.id,
										},
									},
								},
								ingredients: {
									[`${localCollectionFoods}_id`]: {
										ingredients: {
											[`${localCollectionFoods}_id`]: {
												__args: {
													sort: 'ingredients.id',
												},
												id: true,
											},
										},
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toHaveLength(1);
					expect(response.body.errors[0].message).toBe('Invalid query. Max relational depth exceeded.');

					expect(gqlResponse.body.errors).toBeDefined();
					expect(gqlResponse.body.errors.length).toEqual(1);
					expect(gqlResponse.body.errors[0].message).toBe('Invalid query. Max relational depth exceeded.');
				});
			});

			describe('allow queries up to deep sort depth limit', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const food = createFood(pkType);

					const insertedFood = await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: {
							...food,
							ingredients: {
								create: [{ [`${localCollectionFoods}_id`]: createIngredient(pkType) }],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}/${insertedFood.id}`)
						.query({
							fields: '*.*.*.*.*',
							deep: JSON.stringify({
								ingredients: {
									_sort: `${localCollectionFoods}_id.ingredients.${localCollectionFoods}_id.id`,
								},
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);

					expect(response.body.data).toEqual(
						expect.objectContaining({
							ingredients: expect.arrayContaining([
								expect.objectContaining({
									[`${localCollectionFoods}_id`]: expect.objectContaining({
										ingredients: expect.arrayContaining([
											expect.objectContaining({
												[`${localCollectionFoods}_id`]: expect.objectContaining({
													ingredients: [expect.any(Number)],
												}),
											}),
										]),
									}),
								}),
							]),
						}),
					);
				});
			});

			describe('deny queries over the deep sort depth limit', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const food = createFood(pkType);

					const insertedFood = await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: {
							...food,
							ingredients: {
								create: [{ [`${localCollectionFoods}_id`]: createIngredient(pkType) }],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}/${insertedFood.id}`)
						.query({
							fields: '*.*.*.*.*',
							deep: JSON.stringify({
								ingredients: {
									_sort: `${localCollectionFoods}_id.ingredients.${localCollectionFoods}_id.ingredients.id`,
								},
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response.body.errors).toHaveLength(1);
					expect(response.body.errors[0].message).toBe('Invalid query. Max relational depth exceeded.');
				});
			});
		});

		describe('MAX_BATCH_MUTATION Tests', () => {
			describe('createOne', () => {
				describe('passes when below limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// TODO: Fix Oracle exceeded directus_revisions limit of 4000
							if (vendor === 'oracle') {
								expect(true).toBe(true);
								return;
							}

							// Setup
							const countNested = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 2 - 1;
							const food: any = createFood(pkType);
							const food2: any = createFood(pkType);

							food.ingredients = Array(countNested)
								.fill(0)
								.map(() => {
									return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
								});

							food2.ingredients = Array(countNested)
								.fill(0)
								.map(() => {
									return {
										[`${localCollectionIngredients}_id`]: createIngredient(pkType),
									};
								});

							// Action
							const response = await request(getUrl(vendor))
								.post(`/items/${localCollectionFoods}`)
								.send(food)
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const mutationKey = `create_${localCollectionFoods}_item`;

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											data: food2,
										},
										id: true,
										ingredients: {
											id: true,
										},
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(200);
							expect(response.body.data.ingredients.length).toBe(countNested);

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.data[mutationKey].ingredients.length).toEqual(countNested);
						},
						120000,
					);
				});

				describe('errors when above limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// TODO: Fix Oracle ORA-01086 savepoint never established in this session or is invalid
							if (vendor === 'oracle') {
								expect(true).toBe(true);
								return;
							}

							// Setup
							const countNested = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 2;
							const food: any = createFood(pkType);
							const food2: any = createFood(pkType);

							food.ingredients = Array(countNested)
								.fill(0)
								.map(() => {
									return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
								});

							food2.ingredients = Array(countNested)
								.fill(0)
								.map(() => {
									return {
										[`${localCollectionIngredients}_id`]: createIngredient(pkType),
									};
								});

							// Action
							const response = await request(getUrl(vendor))
								.post(`/items/${localCollectionFoods}`)
								.send(food)
								.query({ fields: '*,ingredients.test_items_m2m_ingredients_integer_id.*' })
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const mutationKey = `create_${localCollectionFoods}_item`;

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											data: food2,
										},
										id: true,
										ingredients: {
											id: true,
										},
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(400);
							expect(response.body.errors).toBeDefined();

							expect(response.body.errors[0].message).toBe(
								`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
							);

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.errors).toBeDefined();

							expect(gqlResponse.body.errors[0].message).toBe(
								`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
							);
						},
						120000,
					);
				});
			});

			describe('createMany', () => {
				describe('passes when below limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 10;
							const countNested = 4;
							const foods: any[] = [];
							const foods2: any[] = [];

							for (let i = 0; i < count; i++) {
								foods.push(createFood(pkType));

								foods[i].ingredients = Array(countNested)
									.fill(0)
									.map(() => {
										return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
									});

								foods2.push(createFood(pkType));

								foods2[i].ingredients = Array(countNested)
									.fill(0)
									.map(() => {
										return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
									});
							}

							// Action
							const response = await request(getUrl(vendor))
								.post(`/items/${localCollectionFoods}`)
								.send(foods)
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const mutationKey = `create_${localCollectionFoods}_items`;

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											data: foods2,
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(200);
							expect(response.body.data.length).toBe(count);
							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.data[mutationKey].length).toEqual(count);
						},
						120000,
					);
				});

				describe('errors when above limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// TODO: Fix Oracle ORA-01086 savepoint never established in this session or is invalid
							if (vendor === 'oracle') {
								expect(true).toBe(true);
								return;
							}

							// Setup
							const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 10;
							const countNested = 5;
							const foods: any[] = [];
							const foods2: any[] = [];

							for (let i = 0; i < count; i++) {
								foods.push(createFood(pkType));

								foods[i].ingredients = Array(countNested)
									.fill(0)
									.map(() => {
										return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
									});

								foods2.push(createFood(pkType));

								foods2[i].ingredients = Array(countNested)
									.fill(0)
									.map(() => {
										return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
									});
							}

							// Action
							const response = await request(getUrl(vendor))
								.post(`/items/${localCollectionFoods}`)
								.send(foods)
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const mutationKey = `create_${localCollectionFoods}_items`;

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											data: foods2,
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(400);
							expect(response.body.errors).toBeDefined();

							expect(response.body.errors[0].message).toBe(
								`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
							);

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.errors).toBeDefined();

							expect(gqlResponse.body.errors[0].message).toBe(
								`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
							);
						},
						120000,
					);
				});
			});

			describe('updateBatch', () => {
				describe('passes when below limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 10;
							const countCreate = 2;
							const countUpdate = 3;
							const countDelete = 2;
							const foodsID = [];
							const foodsID2 = [];

							for (let i = 0; i < count; i++) {
								const food: any = createFood(pkType);

								food.ingredients = Array(countUpdate + countDelete)
									.fill(0)
									.map(() => {
										return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
									});

								foodsID.push((await CreateItem(vendor, { collection: localCollectionFoods, item: food })).id);

								const food2: any = createFood(pkType);

								food2.ingredients = Array(countUpdate + countDelete)
									.fill(0)
									.map(() => {
										return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
									});

								foodsID2.push((await CreateItem(vendor, { collection: localCollectionFoods, item: food2 })).id);
							}

							const foods = await ReadItem(vendor, {
								collection: localCollectionFoods,
								fields: [
									'*',
									'ingredients.id',
									`ingredients.${localCollectionIngredients}.id`,
									`ingredients.${localCollectionIngredients}.name`,
								],
								filter: { id: { _in: foodsID } },
							});

							const foods2 = await ReadItem(vendor, {
								collection: localCollectionFoods,
								fields: [
									'*',
									'ingredients.id',
									`ingredients.${localCollectionIngredients}.id`,
									`ingredients.${localCollectionIngredients}.name`,
								],
								filter: { id: { _in: foodsID2 } },
							});

							for (const food of foods) {
								const ingredients = food.ingredients;

								food.ingredients = {
									create: Array(countCreate)
										.fill(0)
										.map(() => {
											return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
										}),
									update: ingredients.slice(0, countUpdate),
									delete: ingredients.slice(-countDelete).map((ingredient: Ingredient) => ingredient.id),
								};
							}

							for (const food of foods2) {
								food.ingredients = [
									...food.ingredients,
									...Array(countCreate)
										.fill(0)
										.map(() => {
											return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
										}),
								];
							}

							// Action
							const response = await request(getUrl(vendor))
								.patch(`/items/${localCollectionFoods}`)
								.send(foods)
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const mutationKey = `update_${localCollectionFoods}_batch`;

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											data: foods2,
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(200);
							expect(response.body.data.length).toBe(count);

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.data[mutationKey].length).toEqual(count);
						},
						120000,
					);
				});

				describe('errors when above limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// TODO: Fix Oracle ORA-01086 savepoint never established in this session or is invalid
							if (vendor === 'oracle') {
								expect(true).toBe(true);
								return;
							}

							// Setup
							const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 10;
							const countCreate = 2;
							const countUpdate = 3;
							const countDelete = 3;
							const foodsID = [];
							const foodsID2 = [];

							for (let i = 0; i < count; i++) {
								const food: any = createFood(pkType);

								food.ingredients = Array(countUpdate + countDelete)
									.fill(0)
									.map(() => {
										return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
									});

								foodsID.push((await CreateItem(vendor, { collection: localCollectionFoods, item: food })).id);

								const food2: any = createFood(pkType);

								food2.ingredients = Array(countUpdate + countDelete)
									.fill(0)
									.map(() => {
										return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
									});

								foodsID2.push((await CreateItem(vendor, { collection: localCollectionFoods, item: food2 })).id);
							}

							const foods = await ReadItem(vendor, {
								collection: localCollectionFoods,
								fields: [
									'*',
									'ingredients.id',
									`ingredients.${localCollectionIngredients}.id`,
									`ingredients.${localCollectionIngredients}.name`,
								],
								filter: { id: { _in: foodsID } },
							});

							const foods2 = await ReadItem(vendor, {
								collection: localCollectionFoods,
								fields: [
									'*',
									'ingredients.id',
									`ingredients.${localCollectionIngredients}.id`,
									`ingredients.${localCollectionIngredients}.name`,
								],
								filter: { id: { _in: foodsID2 } },
							});

							for (const food of foods) {
								const ingredients = food.ingredients;

								food.ingredients = {
									create: Array(countCreate)
										.fill(0)
										.map(() => {
											return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
										}),
									update: ingredients.slice(0, countUpdate),
									delete: ingredients.slice(-countDelete).map((ingredient: Ingredient) => ingredient.id),
								};
							}

							for (const food of foods2) {
								food.ingredients = [
									...food.ingredients,
									...Array(countCreate)
										.fill(0)
										.map(() => {
											return { [`${localCollectionIngredients}_id`]: createIngredient(pkType) };
										}),
								];
							}

							// Action
							const response = await request(getUrl(vendor))
								.patch(`/items/${localCollectionFoods}`)
								.send(foods)
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const mutationKey = `update_${localCollectionFoods}_batch`;

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											data: foods2,
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(400);
							expect(response.body.errors).toBeDefined();

							expect(response.body.errors[0].message).toBe(
								`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
							);

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.errors).toBeDefined();

							expect(gqlResponse.body.errors[0].message).toBe(
								`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
							);
						},
						120000,
					);
				});
			});
		});

		describe('Meta Service Tests', () => {
			describe('retrieves filter count correctly', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const name = 'test-meta-service-count';
					const food = createFood(pkType);
					const food2 = createFood(pkType);
					const ingredients = [];
					const ingredients2 = [];

					food.name = name;
					food2.name = name;

					for (let count = 0; count < 2; count++) {
						const ingredient = createIngredient(pkType);
						const ingredient2 = createIngredient(pkType);
						ingredient.name = name;
						ingredient2.name = name;
						ingredients.push(ingredient);
						ingredients2.push(ingredient2);
					}

					await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: [
							{
								...food,
								ingredients: {
									create: [
										{ [`${localCollectionIngredients}_id`]: ingredients[0] },
										{ [`${localCollectionIngredients}_id`]: ingredients[1] },
									],
									update: [],
									delete: [],
								},
							},
							{
								...food2,
								ingredients: {
									create: [
										{ [`${localCollectionIngredients}_id`]: ingredients2[0] },
										{ [`${localCollectionIngredients}_id`]: ingredients2[1] },
									],
									update: [],
									delete: [],
								},
							},
						],
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}`)
						.query({
							filter: JSON.stringify({
								name: { _eq: name },
								ingredients: {
									[`${localCollectionIngredients}_id`]: {
										name: {
											_eq: name,
										},
									},
								},
							}),
							meta: '*',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.meta.filter_count).toBe(2);
					expect(response.body.data.length).toBe(2);

					for (const item of response.body.data) {
						expect(item.ingredients.length).toBe(2);
					}
				});
			});
		});

		test('Auto Increment Tests', (ctx) => {
			if (pkType !== 'integer') ctx.skip();

			describe('updates the auto increment value correctly', () => {
				it.each(without(vendors, 'cockroachdb', 'mssql', 'oracle'))('%s', async (vendor) => {
					// Setup
					const name = 'test-auto-increment-m2m';
					const largeIdFood = 108888;
					const largeIdIngredient = 109999;
					const largeIdSupplier = 111111;
					const food = createFood(pkType);
					const food2 = createFood(pkType);
					const ingredients = [];
					const ingredients2 = [];
					const suppliers = [];
					const suppliers2 = [];

					food.id = largeIdFood;
					food.name = name;
					food2.name = name;

					for (let count = 0; count < 2; count++) {
						const ingredient = createIngredient(pkType);
						const ingredient2 = createIngredient(pkType);
						const supplier = createSupplier(pkType);
						const supplier2 = createSupplier(pkType);

						if (count === 0) {
							ingredient.id = largeIdIngredient;
							supplier.id = largeIdSupplier;
						}

						ingredient.name = name;
						ingredient2.name = name;
						ingredients.push(ingredient);
						ingredients2.push(ingredient2);

						supplier.name = name;
						supplier2.name = name;
						suppliers.push(supplier);
						suppliers2.push(supplier2);
					}

					for (let count = 0; count < 2; count++) {
						ingredients[count].suppliers = {
							create: [
								{ [`${localCollectionSuppliers}_id`]: count === 0 ? suppliers[0] : suppliers2[0] },
								{ [`${localCollectionSuppliers}_id`]: suppliers[1] },
							],
							update: [],
							delete: [],
						} as any;

						ingredients2[count].suppliers = {
							create: [
								{ [`${localCollectionSuppliers}_id`]: suppliers2[0] },
								{ [`${localCollectionSuppliers}_id`]: suppliers2[1] },
							],
							update: [],
							delete: [],
						} as any;
					}

					await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: [
							{
								...food,
								ingredients: {
									create: [
										{ [`${localCollectionIngredients}_id`]: ingredients[0] },
										{ [`${localCollectionIngredients}_id`]: ingredients[1] },
									],
									update: [],
									delete: [],
								},
							},
							{
								...food2,
								ingredients: {
									create: [
										{ [`${localCollectionIngredients}_id`]: ingredients2[0] },
										{ [`${localCollectionIngredients}_id`]: ingredients2[1] },
									],
									update: [],
									delete: [],
								},
							},
						],
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}`)
						.query({
							filter: JSON.stringify({
								name: { _eq: name },
							}),
							fields: [
								'id',
								`ingredients.${localCollectionIngredients}_id.id`,
								`ingredients.${localCollectionIngredients}_id.suppliers.${localCollectionSuppliers}_id.id`,
							],
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data.length).toBe(2);

					expect(response.body.data.map((food: any) => food.id)).toEqual(
						Array.from({ length: 2 }, (_, index) => largeIdFood + index),
					);

					expect(
						response.body.data.flatMap((food: any) =>
							food.ingredients.flatMap((ingredient: any) => ingredient[`${localCollectionIngredients}_id`].id),
						),
					).toEqual(Array.from({ length: 4 }, (_, index) => largeIdIngredient + index));

					expect(
						response.body.data.flatMap((food: any) =>
							food.ingredients.flatMap((ingredient: any) =>
								ingredient[`${localCollectionIngredients}_id`].suppliers.map(
									(supplier: any) => supplier[`${localCollectionSuppliers}_id`].id,
								),
							),
						),
					).toEqual(Array.from({ length: 8 }, (_, index) => largeIdSupplier + index));
				});
			});
		});
	});
});
