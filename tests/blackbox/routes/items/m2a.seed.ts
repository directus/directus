import { CreateCollection, CreateField, CreateFieldM2A, CreateItem, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { SeedFunctions } from '@common/seed-functions';
import type { PrimaryKeyType } from '@common/types';
import { PRIMARY_KEY_TYPES } from '@common/variables';
import type { CachedTestsSchema, TestsSchema, TestsSchemaVendorValues } from '@query/filter';
import { set } from 'lodash-es';
import { expect, it } from 'vitest';
import {
	getTestsAllTypesSchema,
	seedAllFieldTypesStructure,
	seedAllFieldTypesValues,
	seedM2AAliasAllFieldTypesValues,
} from './seed-all-field-types';

export const collectionShapes = 'test_items_m2a_shapes';
export const collectionCircles = 'test_items_m2a_circles';
export const collectionSquares = 'test_items_m2a_squares';

export type Shape = {
	id?: number | string;
	name: string;
	test_datetime?: string;
};

export type Circle = {
	id?: number | string;
	name: string;
	radius: number;
	test_datetime?: string;
};

export type Square = {
	id?: number | string;
	name: string;
	width: number;
};

export function getTestsSchema(pkType: PrimaryKeyType, seed?: string): TestsSchema {
	const schema: TestsSchema = {
		[`${collectionShapes}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				isPrimaryKey: true,
				filters: true,
				possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
					quantity: 4,
					seed: `${collectionShapes}_${seed}`,
					incremental: true,
				}),
			},
			name: {
				field: 'name',
				type: 'string',
				filters: true,
				possibleValues: ['Shape A', 'Shape B', 'Shape C', 'Shape D'],
			},
		},
	};

	schema[`${collectionCircles}_${pkType}`] = {
		id: {
			field: 'id',
			type: pkType,
			isPrimaryKey: true,
			filters: false,
			possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
				quantity: 4,
				seed: `${collectionCircles}_${seed}`,
				incremental: true,
			}),
		},
		name: {
			field: 'name',
			type: 'string',
			filters: false,
			possibleValues: ['Small Circle', 'Medium Circle', 'Large Circle', 'Extra Large Circle'],
		},
		radius: {
			field: 'radius',
			type: 'decimal',
			filters: false,
			possibleValues: [1.1, 2.2, 3.3, 4.4],
		},
		...getTestsAllTypesSchema(),
	};

	schema[`${collectionSquares}_${pkType}`] = {
		id: {
			field: 'id',
			type: pkType,
			isPrimaryKey: true,
			filters: false,
			possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
				quantity: 4,
				seed: `${collectionSquares}_${seed}`,
				incremental: true,
			}),
		},
		name: {
			field: 'name',
			type: 'string',
			filters: false,
			possibleValues: ['Small Square', 'Medium Square', 'Large Square', 'Extra Large Square'],
		},
		width: {
			field: 'width',
			type: 'decimal',
			filters: false,
			possibleValues: [5.5, 6.6, 7.7, 8.8],
		},
		...getTestsAllTypesSchema(),
	};

	schema[`${collectionShapes}_${pkType}`]['children'] = {
		field: 'children',
		type: 'alias',
		filters: false,
		possibleValues: [],
		relatedCollection: `${collectionShapes}_children_${pkType}`,
	};

	schema[`${collectionShapes}_${pkType}`]['children'].children = {
		[`item:${collectionCircles}_${pkType}`]: {
			field: `item:${collectionCircles}_${pkType}`,
			type: 'alias',
			filters: false,
			possibleValues: schema[`${collectionCircles}_${pkType}`].id.possibleValues,
			children: schema[`${collectionCircles}_${pkType}`],
			relatedCollection: `${collectionCircles}_${pkType}`,
		},
		[`item:${collectionSquares}_${pkType}`]: {
			field: `item:${collectionSquares}_${pkType}`,
			type: 'alias',
			filters: false,
			possibleValues: schema[`${collectionSquares}_${pkType}`].id.possibleValues,
			children: schema[`${collectionSquares}_${pkType}`],
			relatedCollection: `${collectionSquares}_${pkType}`,
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
					const localCollectionShapes = `${collectionShapes}_${pkType}`;
					const localCollectionCircles = `${collectionCircles}_${pkType}`;
					const localCollectionSquares = `${collectionSquares}_${pkType}`;
					const localJunctionShapesChildren = `${collectionShapes}_children_${pkType}`;

					// Delete existing collections
					await DeleteCollection(vendor, { collection: localJunctionShapesChildren });
					await DeleteCollection(vendor, { collection: localCollectionSquares });
					await DeleteCollection(vendor, { collection: localCollectionCircles });
					await DeleteCollection(vendor, { collection: localCollectionShapes });

					// Create shapes collection
					await CreateCollection(vendor, {
						collection: localCollectionShapes,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionShapes,
						field: 'name',
						type: 'string',
					});

					// Create circles collection
					await CreateCollection(vendor, {
						collection: localCollectionCircles,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionCircles,
						field: 'name',
						type: 'string',
					});

					await CreateField(vendor, {
						collection: localCollectionCircles,
						field: 'radius',
						type: 'float',
					});

					// Create squares collection
					await CreateCollection(vendor, {
						collection: localCollectionSquares,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionSquares,
						field: 'name',
						type: 'string',
					});

					await CreateField(vendor, {
						collection: localCollectionSquares,
						field: 'width',
						type: 'float',
					});

					// Create M2A relationships
					await CreateFieldM2A(vendor, {
						collection: localCollectionShapes,
						field: 'children',
						junctionCollection: localJunctionShapesChildren,
						relatedCollections: [localCollectionCircles, localCollectionSquares],
						primaryKeyType: pkType,
					});

					await seedAllFieldTypesStructure(vendor, localCollectionShapes);
					await seedAllFieldTypesStructure(vendor, localCollectionCircles);
					await seedAllFieldTypesStructure(vendor, localCollectionSquares);

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

				const localCollectionShapes = `${collectionShapes}_${pkType}`;
				const localCollectionCircles = `${collectionCircles}_${pkType}`;
				const localCollectionSquares = `${collectionSquares}_${pkType}`;

				// Create shapes
				const itemShapes = [];

				for (let i = 0; i < schema[localCollectionShapes].id.possibleValues.length; i++) {
					const shape: Shape = {
						name: schema[localCollectionShapes].name.possibleValues[i],
					};

					if (pkType === 'string') {
						shape.id = schema[localCollectionShapes].id.possibleValues[i];
					}

					itemShapes.push(shape);
				}

				const shapes = await CreateItem(vendor, {
					collection: localCollectionShapes,
					item: itemShapes,
				});

				const shapesIDs = shapes.map((shape: Shape) => shape.id);

				set(vendorSchemaValues, `${vendor}.${localCollectionShapes}.id`, shapesIDs);

				// Create circles
				const itemCircles = [];

				for (let i = 0; i < schema[localCollectionCircles].id.possibleValues.length; i++) {
					const circle: Circle = {
						name: schema[localCollectionCircles].name.possibleValues[i],
						radius: schema[localCollectionCircles].radius.possibleValues[i],
					};

					if (pkType === 'string') {
						circle.id = schema[localCollectionCircles].id.possibleValues[i];
					}

					itemCircles.push(circle);
				}

				const circles = await CreateItem(vendor, {
					collection: localCollectionCircles,
					item: itemCircles,
				});

				const circlesIDs = circles.map((circle: Circle) => circle.id);

				set(vendorSchemaValues, `${vendor}.${localCollectionCircles}.id`, circlesIDs);

				// Create squares
				const itemSquares = [];

				for (let i = 0; i < schema[localCollectionSquares].id.possibleValues.length; i++) {
					const square: Square = {
						name: schema[localCollectionSquares].name.possibleValues[i],
						width: schema[localCollectionSquares].width.possibleValues[i],
					};

					if (pkType === 'string') {
						square.id = schema[localCollectionSquares].id.possibleValues[i];
					}

					itemSquares.push(square);
				}

				const squares = await CreateItem(vendor, {
					collection: localCollectionSquares,
					item: itemSquares,
				});

				const squaresIDs = squares.map((square: Square) => square.id);

				set(vendorSchemaValues, `${vendor}.${localCollectionSquares}.id`, squaresIDs);

				const junctionCollectionName = `${collectionShapes}_children_${pkType}`;
				const junctionFieldName = `${junctionCollectionName}_id`;
				const childrenEntries = [];

				if (circlesIDs.length !== squaresIDs.length) throw new Error('Circles and squares must be of equal length');

				for (let i = 0; i < circlesIDs.length; i++) {
					childrenEntries.push(
						{
							[junctionFieldName]: shapesIDs[Math.floor(i / 2) % 2],
							collection: localCollectionCircles,
							item: circlesIDs[i].toString(),
						},
						{
							[junctionFieldName]: shapesIDs[Math.floor(i / 2) % 2],
							collection: localCollectionSquares,
							item: squaresIDs[i].toString(),
						},
					);
				}

				await CreateItem(vendor, {
					collection: junctionCollectionName,
					item: childrenEntries,
				});

				await seedAllFieldTypesValues(vendor, localCollectionShapes, pkType);
				await seedAllFieldTypesValues(vendor, localCollectionCircles, pkType);
				await seedAllFieldTypesValues(vendor, localCollectionSquares, pkType);

				await seedM2AAliasAllFieldTypesValues(
					vendor,
					localCollectionShapes,
					junctionCollectionName,
					localCollectionCircles,
					shapesIDs,
					circlesIDs,
				);

				await seedM2AAliasAllFieldTypesValues(
					vendor,
					localCollectionShapes,
					junctionCollectionName,
					localCollectionSquares,
					shapesIDs,
					squaresIDs,
				);
			}
		}),
	);
};
