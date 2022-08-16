import request from 'supertest';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { v4 as uuid } from 'uuid';
import { CreateItem } from '@common/functions';
import { CachedTestsSchema, TestsSchemaVendorValues } from '@query/filter';
import * as common from '@common/index';
import {
	collectionFoods,
	collectionIngredients,
	collectionSuppliers,
	Food,
	Ingredient,
	Supplier,
	getTestsSchema,
	seedDBValues,
} from './m2m.seed';
import { CheckQueryFilters } from '@query/filter';

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

function createSupplier(pkType: common.PrimaryKeyType) {
	const item: Supplier = {
		name: 'supplier-' + uuid(),
	};

	if (pkType === 'string') {
		item.id = 'supplier-' + uuid();
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
			describe('retrieves one food', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const food = await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: createFood(pkType),
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}/${food.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: expect.any(String) });
				});
			});

			describe('retrieves one ingredient', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const ingredient = await CreateItem(vendor, {
						collection: localCollectionIngredients,
						item: createIngredient(pkType),
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionIngredients}/${ingredient.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: expect.any(String) });
				});
			});

			describe('retrieves one supplier', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const supplier = await CreateItem(vendor, {
						collection: localCollectionSuppliers,
						item: createSupplier(pkType),
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionSuppliers}/${supplier.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: expect.any(String) });
				});
			});

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

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.foods).toHaveLength(1);
				});
			});

			describe('Error handling', () => {
				describe('returns an error when an invalid id is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionFoods}/invalid_id`)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toBe(403);
					});
				});
				describe('returns an error when an invalid table is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/invalid_table/1`)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.status).toBe(403);
					});
				});
			});
		});
		describe('PATCH /:collection/:id', () => {
			describe(`updates one food's name with no relations`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const insertedArtist = await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: createFood(pkType),
					});
					const body = { name: 'Tommy Cash' };

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionFoods}/${insertedArtist.id}`)
						.send(body)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({
						id: insertedArtist.id,
						name: 'Tommy Cash',
					});
				});
			});
		});
		describe('DELETE /:collection/:id', () => {
			describe('deletes an food with no relations', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const insertedArtist = await CreateItem(vendor, {
						collection: localCollectionFoods,
						item: createFood(pkType),
					});

					// Action
					const response = await request(getUrl(vendor))
						.delete(`/items/${localCollectionFoods}/${insertedArtist.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(204);
					expect(response.body.data).toBe(undefined);
				});
			});
		});
		describe('GET /:collection', () => {
			describe('retrieves all items from food table with no relations', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const foods = [];
					const foodsCount = 50;
					for (let i = 0; i < foodsCount; i++) {
						foods.push(createFood(pkType));
					}
					await CreateItem(vendor, { collection: localCollectionFoods, item: foods });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFoods}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.length).toBeGreaterThanOrEqual(foodsCount);
				});
			});
			describe('Error handling', () => {
				describe('returns an error when an invalid table is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/invalid_table`)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toBe(403);
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

		describe('POST /:collection', () => {
			describe('createOne', () => {
				describe('creates one food', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const food = createFood(pkType);

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/${localCollectionFoods}`)
							.send(food)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toMatchObject({ name: food.name });
					});
				});
			});
			describe('createMany', () => {
				describe('creates 5 foods', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const foods = [];
						const foodsCount = 5;
						for (let i = 0; i < foodsCount; i++) {
							foods.push(createFood(pkType));
						}

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/${localCollectionFoods}`)
							.send(foods)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(foodsCount);
					});
				});
			});
			describe('Error handling', () => {
				describe('returns an error when an invalid table is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const food = createFood(pkType);

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/invalid_table`)
							.send(food)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toBe(403);
					});
				});
			});
		});

		describe('PATCH /:collection', () => {
			describe('updates many foods to a different name', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const foods = [];
					const foodsCount = 5;
					for (let i = 0; i < foodsCount; i++) {
						foods.push(createFood(pkType));
					}

					const insertedFoods = await CreateItem(vendor, { collection: localCollectionFoods, item: foods });
					const keys = Object.values(insertedFoods ?? []).map((item: any) => item.id);

					const body = {
						keys: keys,
						data: { name: 'Johnny Cash' },
					};

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionFoods}?fields=name`)
						.send(body)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					for (let row = 0; row < response.body.data.length; row++) {
						expect(response.body.data[row]).toMatchObject({
							name: 'Johnny Cash',
						});
					}
					expect(response.body.data.length).toBe(keys.length);
				});
			});
		});

		describe('DELETE /:collection', () => {
			describe('deletes many foods with no relations', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const foods = [];
					const foodsCount = 10;
					for (let i = 0; i < foodsCount; i++) {
						foods.push(createFood(pkType));
					}

					const insertedFoods = await CreateItem(vendor, { collection: localCollectionFoods, item: foods });
					const keys = Object.values(insertedFoods ?? []).map((item: any) => item.id);

					// Action
					const response = await request(getUrl(vendor))
						.delete(`/items/${localCollectionFoods}`)
						.send(keys)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(204);
					expect(response.body.data).toBe(undefined);
				});
			});
		});
	});
});
