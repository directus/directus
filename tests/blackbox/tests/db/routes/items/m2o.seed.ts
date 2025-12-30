import { getTestsAllTypesSchema, seedAllFieldTypesStructure, seedAllFieldTypesValues } from './seed-all-field-types';
import { seedRelationalFields } from './seed-relational-fields';
import type { CachedTestsSchema, TestsSchema, TestsSchemaVendorValues } from '../../query/filter';
import { CreateCollection, CreateField, CreateFieldM2O, CreateItem, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { SeedFunctions } from '@common/seed-functions';
import type { PrimaryKeyType } from '@common/types';
import { PRIMARY_KEY_TYPES } from '@common/variables';
import { set } from 'lodash-es';
import { expect, it } from 'vitest';

export const collectionCountries = 'test_items_m2o_countries';
export const collectionStates = 'test_items_m2o_states';
export const collectionCities = 'test_items_m2o_cities';

export type Country = {
	id?: number | string;
	name: string;
	test_datetime?: string;
};

export type State = {
	id?: number | string;
	name: string;
	country_id?: number | string | null;
	test_datetime?: string;
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
			type: pkType,
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
			type: pkType,
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
			type: pkType,
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
		600_000,
	);
};

export const seedDBValues = async (cachedSchema: CachedTestsSchema, vendorSchemaValues: TestsSchemaVendorValues) => {
	await Promise.all(
		vendors.map(async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				const schema = cachedSchema[pkType];

				const localCollectionCountries = `${collectionCountries}_${pkType}`;
				const localCollectionStates = `${collectionStates}_${pkType}`;
				const localCollectionCities = `${collectionCities}_${pkType}`;

				// Create countries
				const itemCountries = [];

				for (let i = 0; i < schema[localCollectionCountries].id.possibleValues.length; i++) {
					const country: Country = {
						name: schema[localCollectionCountries].name.possibleValues[i],
					};

					if (pkType === 'string') {
						country.id = schema[localCollectionCountries].id.possibleValues[i];
					}

					itemCountries.push(country);
				}

				const countries = await CreateItem(vendor, {
					collection: localCollectionCountries,
					item: itemCountries,
				});

				const countriesIDs = countries.map((country: Country) => country.id);

				set(vendorSchemaValues, `${vendor}.${localCollectionCountries}.id`, countriesIDs);

				// Create states
				const itemStates = [];

				for (let i = 0; i < schema[localCollectionStates].id.possibleValues.length; i++) {
					const state: State = {
						name: schema[localCollectionStates].name.possibleValues[i],
						country_id: countriesIDs[i % countriesIDs.length],
					};

					if (pkType === 'string') {
						state.id = schema[localCollectionStates].id.possibleValues[i];
					}

					itemStates.push(state);
				}

				const states = await CreateItem(vendor, {
					collection: localCollectionStates,
					item: itemStates,
				});

				const statesIDs = states.map((state: State) => state.id);

				set(vendorSchemaValues, `${vendor}.${localCollectionStates}.id`, statesIDs);
				set(vendorSchemaValues, `${vendor}.${localCollectionStates}.country_id.id`, countriesIDs);

				// Create cities
				const itemCities = [];

				for (let i = 0; i < schema[localCollectionCities].id.possibleValues.length; i++) {
					const city: City = {
						name: schema[localCollectionCities].name.possibleValues[i],
						state_id: statesIDs[i % statesIDs.length],
					};

					if (pkType === 'string') {
						city.id = schema[localCollectionCities].id.possibleValues[i];
					}

					itemCities.push(city);
				}

				const cities = await CreateItem(vendor, {
					collection: localCollectionCities,
					item: itemCities,
				});

				const citiesIDs = cities.map((city: City) => city.id);

				set(vendorSchemaValues, `${vendor}.${localCollectionCities}.id`, citiesIDs);
				set(vendorSchemaValues, `${vendor}.${localCollectionCities}.state_id.id`, statesIDs);
				set(vendorSchemaValues, `${vendor}.${localCollectionCities}.state_id.country_id.id`, countriesIDs);

				await seedAllFieldTypesValues(vendor, localCollectionCountries, pkType);
				await seedAllFieldTypesValues(vendor, localCollectionStates, pkType);
				await seedAllFieldTypesValues(vendor, localCollectionCities, pkType);

				await seedRelationalFields(vendor, localCollectionStates, pkType, schema[localCollectionStates]);
				await seedRelationalFields(vendor, localCollectionCities, pkType, schema[localCollectionCities]);
			}
		}),
	);
};
