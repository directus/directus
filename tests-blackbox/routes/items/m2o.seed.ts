import vendors from '@common/get-dbs-to-test';
import {
	CreateCollection,
	CreateField,
	CreateFieldM2O,
	CreateItem,
	DeleteCollection,
	SeedFunctions,
	PrimaryKeyType,
	PRIMARY_KEY_TYPES,
} from '@common/index';
import { CachedTestsSchema, TestsSchema } from '@query/filter';
import { seedAllFieldTypesStructure, seedAllFieldTypesValues, getTestsAllTypesSchema } from './seed-all-field-types';
import { seedRelationalFields } from './seed-relational-fields';

export const collectionCountries = 'test_items_m2o_countries';
export const collectionStates = 'test_items_m2o_states';
export const collectionCities = 'test_items_m2o_cities';

export type Country = {
	id?: number | string;
	name: string;
};

export type State = {
	id?: number | string;
	name: string;
	country_id?: number | string | null;
};

export type City = {
	id?: number | string;
	name: string;
	state_id?: number | string | null;
};

export function getTestsSchema(pkType: PrimaryKeyType, seed?: string): TestsSchema {
	const schema: TestsSchema = {
		[`${collectionCountries}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				isPrimaryKey: true,
				filters: true,
				possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
					quantity: 2,
					seed: `collectionCountries${seed}`,
					incremental: true,
				}),
			},
			name: {
				field: 'name',
				type: 'string',
				filters: true,
				possibleValues: ['United States', 'Malaysia'],
			},
			...getTestsAllTypesSchema(),
		},
	};

	schema[`${collectionStates}_${pkType}`] = {
		id: {
			field: 'id',
			type: pkType,
			isPrimaryKey: true,
			filters: false,
			possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
				quantity: 4,
				seed: `collectionStates${seed}`,
				incremental: true,
			}),
		},
		name: {
			field: 'name',
			type: 'string',
			filters: false,
			possibleValues: ['Washington', 'California', 'Johor', 'Sarawak'],
		},
		country_id: {
			field: 'country_id',
			type: 'integer',
			filters: false,
			possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
				quantity: 2,
				seed: `collectionCountries${seed}`,
				incremental: true,
			}),
			children: schema[`${collectionCountries}_${pkType}`],
			relatedCollection: `${collectionCountries}_${pkType}`,
		},
	};

	schema[`${collectionCities}_${pkType}`] = {
		id: {
			field: 'id',
			type: 'integer',
			isPrimaryKey: true,
			filters: false,
			possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
				quantity: 8,
				seed: `collectionCities${seed}`,
				incremental: true,
			}),
		},
		name: {
			field: 'name',
			type: 'string',
			filters: false,
			possibleValues: [
				'Seattle',
				'Spokane',
				'Los Angeles',
				'San Francisco',
				'Johor Bahru',
				'Muar',
				'Kota Kinabalu',
				'Sandakan',
			],
		},
		state_id: {
			field: 'state_id',
			type: 'integer',
			filters: false,
			possibleValues: SeedFunctions.generatePrimaryKeys(pkType, {
				quantity: 4,
				seed: `collectionCountries${seed}`,
				incremental: true,
			}),
			children: schema[`${collectionStates}_${pkType}`],
			relatedCollection: `${collectionStates}_${pkType}`,
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
					const localCollectionCountries = `${collectionCountries}_${pkType}`;
					const localCollectionStates = `${collectionStates}_${pkType}`;
					const localCollectionCities = `${collectionCities}_${pkType}`;

					// Delete existing collections
					await DeleteCollection(vendor, { collection: localCollectionCities });
					await DeleteCollection(vendor, { collection: localCollectionStates });
					await DeleteCollection(vendor, { collection: localCollectionCountries });

					// Create countries collection
					await CreateCollection(vendor, {
						collection: localCollectionCountries,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionCountries,
						field: 'name',
						type: 'string',
					});

					// Create states collection
					await CreateCollection(vendor, {
						collection: localCollectionStates,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionStates,
						field: 'name',
						type: 'string',
					});

					await CreateFieldM2O(vendor, {
						collection: localCollectionStates,
						field: 'country_id',
						primaryKeyType: pkType,
						otherCollection: localCollectionCountries,
					});

					// Create cities collection
					await CreateCollection(vendor, {
						collection: localCollectionCities,
						primaryKeyType: pkType,
					});

					await CreateField(vendor, {
						collection: localCollectionCities,
						field: 'name',
						type: 'string',
					});

					await CreateFieldM2O(vendor, {
						collection: localCollectionCities,
						field: 'state_id',
						primaryKeyType: pkType,
						otherCollection: localCollectionStates,
					});

					await seedAllFieldTypesStructure(vendor, localCollectionCountries);
					await seedAllFieldTypesStructure(vendor, localCollectionStates);
					await seedAllFieldTypesStructure(vendor, localCollectionCities);

					expect(true).toBeTruthy();
				} catch (error) {
					expect(error).toBeFalsy();
				}
			}
		},
		300000
	);
};

export const seedDBValues = (cachedSchema: CachedTestsSchema) => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				try {
					const schema = cachedSchema[pkType];

					const localCollectionCountries = `${collectionCountries}_${pkType}`;
					const localCollectionStates = `${collectionStates}_${pkType}`;
					const localCollectionCities = `${collectionCities}_${pkType}`;

					// Create countries
					await CreateItem(vendor, {
						collection: localCollectionCountries,
						item: [
							{
								id: schema[localCollectionCountries].id.possibleValues[0],
								name: schema[localCollectionCountries].name.possibleValues[0],
							},
							{
								id: schema[localCollectionCountries].id.possibleValues[1],
								name: schema[localCollectionCountries].name.possibleValues[1],
							},
						] as Country[],
					});

					// Create states
					await CreateItem(vendor, {
						collection: localCollectionStates,
						item: [
							{
								id: schema[localCollectionStates].id.possibleValues[0],
								name: schema[localCollectionStates].name.possibleValues[0],
								country_id: schema[localCollectionCountries].id.possibleValues[0],
							},
							{
								id: schema[localCollectionStates].id.possibleValues[1],
								name: schema[localCollectionStates].name.possibleValues[1],
								country_id: schema[localCollectionCountries].id.possibleValues[0],
							},
							{
								id: schema[localCollectionStates].id.possibleValues[2],
								name: schema[localCollectionStates].name.possibleValues[2],
								country_id: schema[localCollectionCountries].id.possibleValues[1],
							},
							{
								id: schema[localCollectionStates].id.possibleValues[3],
								name: schema[localCollectionStates].name.possibleValues[3],
								country_id: schema[localCollectionCountries].id.possibleValues[1],
							},
						] as State[],
					});

					// Create cities
					await CreateItem(vendor, {
						collection: localCollectionCities,
						item: [
							{
								id: schema[localCollectionCities].id.possibleValues[0],
								name: schema[localCollectionCities].id.possibleValues[0],
								state_id: schema[localCollectionStates].id.possibleValues[0],
							},
							{
								id: schema[localCollectionCities].id.possibleValues[1],
								name: schema[localCollectionCities].id.possibleValues[1],
								state_id: schema[localCollectionStates].id.possibleValues[0],
							},
							{
								id: schema[localCollectionCities].id.possibleValues[2],
								name: schema[localCollectionCities].id.possibleValues[2],
								state_id: schema[localCollectionStates].id.possibleValues[1],
							},
							{
								id: schema[localCollectionCities].id.possibleValues[3],
								name: schema[localCollectionCities].id.possibleValues[3],
								state_id: schema[localCollectionStates].id.possibleValues[1],
							},
							{
								id: schema[localCollectionCities].id.possibleValues[4],
								name: schema[localCollectionCities].id.possibleValues[4],
								state_id: schema[localCollectionStates].id.possibleValues[2],
							},
							{
								id: schema[localCollectionCities].id.possibleValues[5],
								name: schema[localCollectionCities].id.possibleValues[5],
								state_id: schema[localCollectionStates].id.possibleValues[2],
							},
							{
								id: schema[localCollectionCities].id.possibleValues[6],
								name: schema[localCollectionCities].id.possibleValues[6],
								state_id: schema[localCollectionStates].id.possibleValues[3],
							},
							{
								id: schema[localCollectionCities].id.possibleValues[7],
								name: schema[localCollectionCities].id.possibleValues[7],
								state_id: schema[localCollectionStates].id.possibleValues[3],
							},
						] as City[],
					});

					await seedAllFieldTypesValues(vendor, localCollectionCountries, pkType);
					await seedAllFieldTypesValues(vendor, localCollectionStates, pkType);
					await seedAllFieldTypesValues(vendor, localCollectionCities, pkType);

					await seedRelationalFields(vendor, localCollectionStates, pkType, schema[localCollectionStates]);
					await seedRelationalFields(vendor, localCollectionCities, pkType, schema[localCollectionCities]);

					expect(true).toBeTruthy();
				} catch (error) {
					expect(error).toBeFalsy();
				}
			}
		},
		300000
	);
};
