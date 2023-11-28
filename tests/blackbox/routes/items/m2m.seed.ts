import vendors from '@common/get-dbs-to-test';
import type { CachedTestsSchema, TestsSchema, TestsSchemaVendorValues } from '@query/filter';
import {
	seedAllFieldTypesStructure,
	seedAllFieldTypesValues,
	getTestsAllTypesSchema,
	seedM2MAliasAllFieldTypesValues,
} from './seed-all-field-types';
import { set } from 'lodash-es';
import { expect, it } from 'vitest';
import { DeleteCollection, CreateCollection, CreateField, CreateFieldM2M, CreateItem } from '@common/functions';
import { SeedFunctions } from '@common/seed-functions';
import type { PrimaryKeyType } from '@common/types';
import { PRIMARY_KEY_TYPES } from '@common/variables';

export const collectionFoods = 'test_items_m2m_foods';
export const collectionIngredients = 'test_items_m2m_ingredients';
export const collectionSuppliers = 'test_items_m2m_suppliers';

export type Food = {
	id?: number | string;
	name: string;
	test_datetime?: string;
	ingredients?: Ingredient[];
};

export type Ingredient = {
	id?: number | string;
	name: string;
	suppliers?: Supplier[];
	test_datetime?: string;
};

export type Supplier = {
	id?: number | string;
	name: string;
};

export function getTestsSchema(pkType: PrimaryKeyType, seed?: string): TestsSchema {
	const schema: TestsSchema = {
		[`${collectionFoods}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				isPrimaryKey: true,
				filters: true,
				possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
					quantity: 2,
					seed: `${collectionFoods}_${seed}`,
					incremental: true,
				}),
			},
			name: {
				field: 'name',
				type: 'string',
				filters: true,
				possibleValues: ['Chicken Rice', 'Fish & Chips'],
			},
		},
	};

	schema[`${collectionIngredients}_${pkType}`] = {
		id: {
			field: 'id',
			type: pkType,
			isPrimaryKey: true,
			filters: false,
			possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
				quantity: 4,
				seed: `${collectionIngredients}_${seed}`,
				incremental: true,
			}),
		},
		name: {
			field: 'name',
			type: 'string',
			filters: false,
			possibleValues: ['Chicken', 'Rice', 'Fish', 'Potato'],
		},
		...getTestsAllTypesSchema(),
	};

	schema[`${collectionSuppliers}_${pkType}`] = {
		id: {
			field: 'id',
			type: pkType,
			isPrimaryKey: true,
			filters: false,
			possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
				quantity: 8,
				seed: `${collectionSuppliers}_${seed}`,
				incremental: true,
			}),
		},
		name: {
			field: 'name',
			type: 'string',
			filters: false,
			possibleValues: ['A Impex', 'B Impex', 'C Impex', 'D Impex', 'E Impex', 'F Impex', 'G Impex', 'H Impex'],
		},
		...getTestsAllTypesSchema(),
	};

	schema[`${collectionFoods}_${pkType}`]['ingredients'] = {
		field: 'ingredients',
		type: 'alias',
		filters: false,
		possibleValues: schema[`${collectionIngredients}_${pkType}`].id.possibleValues,
		relatedCollection: `${collectionIngredients}_${pkType}`,
	};

	schema[`${collectionFoods}_${pkType}`]['ingredients'].children = {
		ingredients_id: {
			field: `${collectionIngredients}_${pkType}_id`,
			type: 'alias',
			filters: false,
			possibleValues: schema[`${collectionIngredients}_${pkType}`].id.possibleValues,
			children: schema[`${collectionIngredients}_${pkType}`],
			relatedCollection: `${collectionIngredients}_${pkType}`,
		},
	};

	schema[`${collectionIngredients}_${pkType}`]['suppliers'] = {
		field: 'suppliers',
		type: 'alias',
		filters: false,
		possibleValues: schema[`${collectionSuppliers}_${pkType}`].id.possibleValues,
		relatedCollection: `${collectionSuppliers}_${pkType}`,
	};

	schema[`${collectionIngredients}_${pkType}`]['suppliers'].children = {
		suppliers_id: {
			field: `${collectionSuppliers}_${pkType}_id`,
			type: 'alias',
			filters: false,
			possibleValues: schema[`${collectionSuppliers}_${pkType}`].id.possibleValues,
			children: schema[`${collectionSuppliers}_${pkType}`],
			relatedCollection: `${collectionSuppliers}_${pkType}`,
		},
	};

	return schema;
}

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				try {
					const localCollectionFoods = `${collectionFoods}_${pkType}`;
					const localCollectionIngredients = `${collectionIngredients}_${pkType}`;
					const localCollectionSuppliers = `${collectionSuppliers}_${pkType}`;
					const localJunctionFoodsIngredients = `${collectionFoods}_ingredients_${pkType}`;
					const localJunctionIngredientsSuppliers = `${collectionIngredients}_suppliers_${pkType}`;

					// Delete existing collections
					await DeleteCollection(vendor, { collection: localJunctionIngredientsSuppliers });
					await DeleteCollection(vendor, { collection: localJunctionFoodsIngredients });
					await DeleteCollection(vendor, { collection: localCollectionSuppliers });
					await DeleteCollection(vendor, { collection: localCollectionIngredients });
					await DeleteCollection(vendor, { collection: localCollectionFoods });

					// Create foods collection
					await CreateCollection(vendor, {
						collection: localCollectionFoods,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionFoods,
						field: 'name',
						type: 'string',
					});

					// Create ingredients collection
					await CreateCollection(vendor, {
						collection: localCollectionIngredients,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionIngredients,
						field: 'name',
						type: 'string',
					});

					// Create suppliers collection
					await CreateCollection(vendor, {
						collection: localCollectionSuppliers,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionSuppliers,
						field: 'name',
						type: 'string',
					});

					// Create M2M relationships
					await CreateFieldM2M(vendor, {
						collection: localCollectionFoods,
						field: 'ingredients',
						otherCollection: localCollectionIngredients,
						otherField: 'foods',
						junctionCollection: localJunctionFoodsIngredients,
						primaryKeyType: pkType,
					});

					await CreateFieldM2M(vendor, {
						collection: localCollectionIngredients,
						field: 'suppliers',
						otherCollection: localCollectionSuppliers,
						otherField: 'ingredients',
						junctionCollection: localJunctionIngredientsSuppliers,
						primaryKeyType: pkType,
					});

					await seedAllFieldTypesStructure(vendor, localCollectionFoods);
					await seedAllFieldTypesStructure(vendor, localCollectionIngredients);
					await seedAllFieldTypesStructure(vendor, localCollectionSuppliers);

					expect(true).toBeTruthy();
				} catch (error) {
					expect(error).toBeFalsy();
				}
			}
		},
		300000,
	);
};

export const seedDBValues = async (cachedSchema: CachedTestsSchema, vendorSchemaValues: TestsSchemaVendorValues) => {
	await Promise.all(
		vendors.map(async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				const schema = cachedSchema[pkType];

				const localCollectionFoods = `${collectionFoods}_${pkType}`;
				const localCollectionIngredients = `${collectionIngredients}_${pkType}`;
				const localCollectionSuppliers = `${collectionSuppliers}_${pkType}`;

				// Create foods
				const itemFoods = [];

				for (let i = 0; i < schema[localCollectionFoods].id.possibleValues.length; i++) {
					const food: Food = {
						name: schema[localCollectionFoods].name.possibleValues[i],
					};

					if (pkType === 'string') {
						food.id = schema[localCollectionFoods].id.possibleValues[i];
					}

					itemFoods.push(food);
				}

				const foods = await CreateItem(vendor, {
					collection: localCollectionFoods,
					item: itemFoods,
				});

				const foodsIDs = foods.map((food: Food) => food.id);

				set(vendorSchemaValues, `${vendor}.${localCollectionFoods}.id`, foodsIDs);

				// Create ingredients
				const itemIngredients = [];

				for (let i = 0; i < schema[localCollectionIngredients].id.possibleValues.length; i++) {
					const ingredient: Ingredient = {
						name: schema[localCollectionIngredients].name.possibleValues[i],
					};

					if (pkType === 'string') {
						ingredient.id = schema[localCollectionIngredients].id.possibleValues[i];
					}

					itemIngredients.push(ingredient);
				}

				const ingredients = await CreateItem(vendor, {
					collection: localCollectionIngredients,
					item: itemIngredients,
				});

				const ingredientsIDs = ingredients.map((ingredient: Ingredient) => ingredient.id);

				set(vendorSchemaValues, `${vendor}.${localCollectionIngredients}.id`, ingredientsIDs);

				// Create suppliers
				const itemSuppliers = [];

				for (let i = 0; i < schema[localCollectionSuppliers].id.possibleValues.length; i++) {
					const supplier: Supplier = {
						name: schema[localCollectionSuppliers].name.possibleValues[i],
					};

					if (pkType === 'string') {
						supplier.id = schema[localCollectionSuppliers].id.possibleValues[i];
					}

					itemSuppliers.push(supplier);
				}

				const suppliers = await CreateItem(vendor, {
					collection: localCollectionSuppliers,
					item: itemSuppliers,
				});

				const suppliersIDs = suppliers.map((supplier: Supplier) => supplier.id);

				set(vendorSchemaValues, `${vendor}.${localCollectionSuppliers}.id`, suppliersIDs);

				const junctionCollectionFoodsIngredients = `${collectionFoods}_ingredients_${pkType}`;
				const junctionCollectionIngredientsSuppliers = `${collectionIngredients}_suppliers_${pkType}`;
				const junctionCollectionFoodsID = `${localCollectionFoods}_id`;
				const junctionCollectionIngredientsID = `${localCollectionIngredients}_id`;
				const junctionCollectionSuppliersID = `${localCollectionSuppliers}_id`;
				const foodsIngredientsEntries = [];
				const ingredientsSuppliersEntries = [];

				for (let i = 0; i < ingredientsIDs.length; i++) {
					foodsIngredientsEntries.push({
						[junctionCollectionFoodsID]: foodsIDs[Math.floor(i / 2) % 2],
						[junctionCollectionIngredientsID]: ingredientsIDs[i],
					});
				}

				await CreateItem(vendor, {
					collection: junctionCollectionFoodsIngredients,
					item: foodsIngredientsEntries,
				});

				for (let i = 0; i < suppliersIDs.length; i++) {
					ingredientsSuppliersEntries.push({
						[junctionCollectionIngredientsID]: ingredientsIDs[Math.floor(i / 2) % 4],
						[junctionCollectionSuppliersID]: suppliersIDs[i],
					});
				}

				await CreateItem(vendor, {
					collection: junctionCollectionIngredientsSuppliers,
					item: ingredientsSuppliersEntries,
				});

				await seedAllFieldTypesValues(vendor, localCollectionFoods, pkType);
				await seedAllFieldTypesValues(vendor, localCollectionIngredients, pkType);
				await seedAllFieldTypesValues(vendor, localCollectionSuppliers, pkType);

				await seedM2MAliasAllFieldTypesValues(
					vendor,
					localCollectionFoods,
					localCollectionIngredients,
					junctionCollectionFoodsIngredients,
					junctionCollectionFoodsID,
					junctionCollectionIngredientsID,
					foodsIDs,
					ingredientsIDs,
				);

				await seedM2MAliasAllFieldTypesValues(
					vendor,
					localCollectionIngredients,
					localCollectionSuppliers,
					junctionCollectionIngredientsSuppliers,
					junctionCollectionIngredientsID,
					junctionCollectionSuppliersID,
					ingredientsIDs,
					suppliersIDs,
				);
			}
		}),
	);
};
