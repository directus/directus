import {
	CreateCollection,
	CreateField,
	CreateFieldM2M,
	CreateFieldM2O,
	CreateFieldO2M,
	CreateItem,
	DeleteCollection,
} from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { SeedFunctions } from '@common/seed-functions';
import type { PrimaryKeyType } from '@common/types';
import { PRIMARY_KEY_TYPES } from '@common/variables';
import { set } from 'lodash-es';
import { expect, it } from 'vitest';
import type { CachedTestsSchema, TestsSchema, TestsSchemaVendorValues } from '../../query/filter';

export const collectionDepartments = 'test_json_filter_departments';
export const collectionCategories = 'test_json_filter_categories';
export const collectionProducts = 'test_json_filter_products';
export const collectionSuppliers = 'test_json_filter_suppliers';

export type Department = {
	id?: number | string;
	name: string;
	metadata?: {
		sector: string;
		budget: number;
	};
};

export type Category = {
	id?: number | string;
	name: string;
	metadata?: {
		color?: string;
	};
	department_id?: number | string | null;
};

export type Product = {
	id?: number | string;
	name: string;
	metadata?: {
		color?: string;
		brand?: string;
		level?: number;
		tags?: string[];
		settings?: {
			theme?: string;
		};
	};
	category_id?: number | string | null;
};

export type Supplier = {
	id?: number | string;
	name: string;
	metadata?: {
		region: string;
		tier: number;
	};
};

export function getTestsSchema(pkType: PrimaryKeyType, seed?: string): TestsSchema {
	const schema: TestsSchema = {
		[`${collectionDepartments}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				isPrimaryKey: true,
				filters: true,
				possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
					quantity: 2,
					seed: `collectionJsonFilterDepartments${seed}`,
					incremental: true,
				}),
			},
			name: {
				field: 'name',
				type: 'string',
				filters: true,
				// Tech Department → sector:'technology', budget:100
				// Consumer Department → sector:'consumer', budget:50
				possibleValues: ['Tech Department', 'Consumer Department'],
			},
			metadata: {
				field: 'metadata',
				type: 'json',
				filters: false,
				possibleValues: [
					{ sector: 'technology', budget: 100 },
					{ sector: 'consumer', budget: 50 },
				],
			},
		},
		[`${collectionCategories}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				isPrimaryKey: true,
				filters: true,
				possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
					quantity: 3,
					seed: `collectionJsonFilterCategories${seed}`,
					incremental: true,
				}),
			},
			name: {
				field: 'name',
				type: 'string',
				filters: true,
				// Tech → Tech Department (0), Sports → Consumer Department (1), Home → Consumer Department (1)
				possibleValues: ['Tech', 'Sports', 'Home'],
			},
			metadata: {
				field: 'metadata',
				type: 'json',
				filters: false,
				possibleValues: [{ color: 'blue' }, { color: 'green' }, { color: 'red' }],
			},
		},
		[`${collectionProducts}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				isPrimaryKey: true,
				filters: true,
				possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
					quantity: 5,
					seed: `collectionJsonFilterProducts${seed}`,
					incremental: true,
				}),
			},
			name: {
				field: 'name',
				type: 'string',
				filters: true,
				// Alpha→Tech, Beta→Sports, Gamma→Tech, Delta→Home, Epsilon→null (no category)
				possibleValues: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'],
			},
			metadata: {
				field: 'metadata',
				type: 'json',
				filters: false,
				possibleValues: [
					{
						color: 'red',
						brand: 'BrandX',
						level: 2,
						tags: ['electronics', 'sale'],
						settings: { theme: 'dark' },
					},
					{
						color: 'blue',
						brand: 'BrandY',
						level: 5,
						tags: ['home', 'new'],
						settings: { theme: 'light' },
					},
					{
						color: 'green',
						brand: 'BrandX',
						level: 8,
						tags: ['outdoor'],
						settings: { theme: 'dark' },
					},
					{
						color: 'yellow',
						brand: 'BrandZ',
						level: 3,
						tags: ['clearance'],
						settings: { theme: 'auto' },
					},
					{
						color: 'black',
						tags: [],
					},
				],
			},
		},
		[`${collectionSuppliers}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				isPrimaryKey: true,
				filters: false,
				possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
					quantity: 2,
					seed: `collectionJsonFilterSuppliers${seed}`,
					incremental: true,
				}),
			},
			name: {
				field: 'name',
				type: 'string',
				filters: false,
				// Supplier A → region:'EU', tier:1
				// Supplier B → region:'US', tier:2
				possibleValues: ['Supplier A', 'Supplier B'],
			},
			metadata: {
				field: 'metadata',
				type: 'json',
				filters: false,
				possibleValues: [
					{ region: 'EU', tier: 1 },
					{ region: 'US', tier: 2 },
				],
			},
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
					const localCollectionDepartments = `${collectionDepartments}_${pkType}`;
					const localCollectionCategories = `${collectionCategories}_${pkType}`;
					const localCollectionProducts = `${collectionProducts}_${pkType}`;
					const localCollectionSuppliers = `${collectionSuppliers}_${pkType}`;
					const junctionCollection = `${collectionProducts}_suppliers_${pkType}`;

					// Delete in FK order: junction first, then products, suppliers, categories, departments
					await DeleteCollection(vendor, { collection: junctionCollection });
					await DeleteCollection(vendor, { collection: localCollectionProducts });
					await DeleteCollection(vendor, { collection: localCollectionSuppliers });
					await DeleteCollection(vendor, { collection: localCollectionCategories });
					await DeleteCollection(vendor, { collection: localCollectionDepartments });

					// Create departments collection
					await CreateCollection(vendor, {
						collection: localCollectionDepartments,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionDepartments,
						field: 'name',
						type: 'string',
					});

					await CreateField(vendor, {
						collection: localCollectionDepartments,
						field: 'metadata',
						type: 'json',
					});

					// Create categories collection
					await CreateCollection(vendor, {
						collection: localCollectionCategories,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionCategories,
						field: 'name',
						type: 'string',
					});

					await CreateField(vendor, {
						collection: localCollectionCategories,
						field: 'metadata',
						type: 'json',
					});

					await CreateFieldM2O(vendor, {
						collection: localCollectionCategories,
						field: 'department_id',
						primaryKeyType: pkType,
						otherCollection: localCollectionDepartments,
					});

					// Create products collection
					await CreateCollection(vendor, {
						collection: localCollectionProducts,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionProducts,
						field: 'name',
						type: 'string',
					});

					await CreateField(vendor, {
						collection: localCollectionProducts,
						field: 'metadata',
						type: 'json',
					});

					// O2M from categories → products; also creates the products.category_id FK field
					await CreateFieldO2M(vendor, {
						collection: localCollectionCategories,
						field: 'products',
						primaryKeyType: pkType,
						otherCollection: localCollectionProducts,
						otherField: 'category_id',
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

					await CreateField(vendor, {
						collection: localCollectionSuppliers,
						field: 'metadata',
						type: 'json',
					});

					// M2M between products and suppliers via junction table
					await CreateFieldM2M(vendor, {
						collection: localCollectionProducts,
						field: 'suppliers',
						otherCollection: localCollectionSuppliers,
						otherField: 'products',
						junctionCollection,
						primaryKeyType: pkType,
					});

					expect(true).toBeTruthy();
				} catch (error) {
					expect(error).toBeFalsy();
				}
			}
		},
		600_000,
	);
};

export const seedDBValues = async (cachedSchema: CachedTestsSchema, vendorSchemaValues: TestsSchemaVendorValues) => {
	await Promise.all(
		vendors.map(async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				const schema = cachedSchema[pkType];

				const localCollectionDepartments = `${collectionDepartments}_${pkType}`;
				const localCollectionCategories = `${collectionCategories}_${pkType}`;
				const localCollectionProducts = `${collectionProducts}_${pkType}`;
				const localCollectionSuppliers = `${collectionSuppliers}_${pkType}`;

				// Seed departments first
				const itemDepartments = [];

				for (let i = 0; i < schema[localCollectionDepartments]!['id']!.possibleValues.length; i++) {
					const department: Department = {
						name: schema[localCollectionDepartments]!['name']!.possibleValues[i],
						metadata: schema[localCollectionDepartments]!['metadata']!.possibleValues[i],
					};

					if (pkType === 'string') {
						department.id = schema[localCollectionDepartments]!['id']!.possibleValues[i];
					}

					itemDepartments.push(department);
				}

				const departments = await CreateItem(vendor, {
					collection: localCollectionDepartments,
					item: itemDepartments,
				});

				const departmentIdByName = Object.fromEntries(departments.map((d: Department) => [d.name as string, d.id]));

				const departmentsIDs = (schema[localCollectionDepartments]!['name']!.possibleValues as string[]).map(
					(name) => departmentIdByName[name]!,
				);

				// Seed categories with department assignments:
				// Tech (0) → Tech Department (dept index 0)
				// Sports (1) → Consumer Department (dept index 1)
				// Home (2) → Consumer Department (dept index 1)
				const categoryDepartmentIndices = [0, 1, 1];

				const itemCategories = [];

				for (let i = 0; i < schema[localCollectionCategories]!['id']!.possibleValues.length; i++) {
					const category: Category = {
						name: schema[localCollectionCategories]!['name']!.possibleValues[i],
						metadata: schema[localCollectionCategories]!['metadata']!.possibleValues[i],
						department_id: departmentsIDs[categoryDepartmentIndices[i]!],
					};

					if (pkType === 'string') {
						category.id = schema[localCollectionCategories]!['id']!.possibleValues[i];
					}

					itemCategories.push(category);
				}

				const categories = await CreateItem(vendor, {
					collection: localCollectionCategories,
					item: itemCategories,
				});

				// Build name→id map for DB-ordering safety
				const categoryIdByName = Object.fromEntries(categories.map((c: Category) => [c.name as string, c.id]));

				const categoriesIDs = (schema[localCollectionCategories]!['name']!.possibleValues as string[]).map(
					(name) => categoryIdByName[name]!,
				);

				// category name order: ['Tech', 'Sports', 'Home'] → indices 0, 1, 2
				// Alpha → Tech (0), Beta → Sports (1), Gamma → Tech (0), Delta → Home (2), Epsilon → null
				const productCategoryIndices = [0, 1, 0, 2, null];

				const itemProducts = [];

				for (let i = 0; i < schema[localCollectionProducts]!['id']!.possibleValues.length; i++) {
					const categoryIndex = productCategoryIndices[i];

					const product: Product = {
						name: schema[localCollectionProducts]!['name']!.possibleValues[i],
						metadata: schema[localCollectionProducts]!['metadata']!.possibleValues[i],
						category_id: categoryIndex !== null ? categoriesIDs[categoryIndex] : null,
					};

					if (pkType === 'string') {
						product.id = schema[localCollectionProducts]!['id']!.possibleValues[i];
					}

					itemProducts.push(product);
				}

				const products = await CreateItem(vendor, {
					collection: localCollectionProducts,
					item: itemProducts,
				});

				// Build name→id map for M2M junction seeding
				const productIdByName = Object.fromEntries(products.map((p: Product) => [p.name as string, p.id]));
				const productsIDs = products.map((p: Product) => p.id);

				// Seed suppliers
				const itemSuppliers = [];

				for (let i = 0; i < schema[localCollectionSuppliers]!['id']!.possibleValues.length; i++) {
					const supplier: Supplier = {
						name: schema[localCollectionSuppliers]!['name']!.possibleValues[i],
						metadata: schema[localCollectionSuppliers]!['metadata']!.possibleValues[i],
					};

					if (pkType === 'string') {
						supplier.id = schema[localCollectionSuppliers]!['id']!.possibleValues[i];
					}

					itemSuppliers.push(supplier);
				}

				const suppliers = await CreateItem(vendor, {
					collection: localCollectionSuppliers,
					item: itemSuppliers,
				});

				const supplierIdByName = Object.fromEntries(suppliers.map((s: Supplier) => [s.name as string, s.id]));

				// Seed M2M junction (products ↔ suppliers):
				// Alpha → Supplier A (EU)
				// Beta  → Supplier A (EU) + Supplier B (US)
				// Gamma → Supplier B (US)
				// Delta, Epsilon → no suppliers
				const junctionCollection = `${collectionProducts}_suppliers_${pkType}`;
				const junctionProductField = `${localCollectionProducts}_id`;
				const junctionSupplierField = `${localCollectionSuppliers}_id`;

				await CreateItem(vendor, {
					collection: junctionCollection,
					item: [
						{
							[junctionProductField]: productIdByName['Alpha'],
							[junctionSupplierField]: supplierIdByName['Supplier A'],
						},
						{
							[junctionProductField]: productIdByName['Beta'],
							[junctionSupplierField]: supplierIdByName['Supplier A'],
						},
						{
							[junctionProductField]: productIdByName['Beta'],
							[junctionSupplierField]: supplierIdByName['Supplier B'],
						},
						{
							[junctionProductField]: productIdByName['Gamma'],
							[junctionSupplierField]: supplierIdByName['Supplier B'],
						},
					],
				});

				set(vendorSchemaValues, `${vendor}.${localCollectionDepartments}.id`, departmentsIDs);
				set(vendorSchemaValues, `${vendor}.${localCollectionCategories}.id`, categoriesIDs);
				set(vendorSchemaValues, `${vendor}.${localCollectionProducts}.id`, productsIDs);
			}
		}),
	);
};
