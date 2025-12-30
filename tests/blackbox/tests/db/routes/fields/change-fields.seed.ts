import type { CachedTestsSchema, TestsSchema, TestsSchemaVendorValues } from '../../query/filter';
import { CreateCollection, CreateField, CreateFieldO2M, CreateItem, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { SeedFunctions } from '@common/seed-functions';
import type { PrimaryKeyType } from '@common/types';
import { PRIMARY_KEY_TYPES } from '@common/variables';
import { set } from 'lodash-es';
import { expect, it } from 'vitest';

export const collectionCountries = 'test_fields_change_field_countries';
export const collectionStates = 'test_fields_change_field_states';

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
					seed: `${collectionCountries}${seed}`,
					incremental: true,
				}),
			},
			name: {
				field: 'name',
				type: 'string',
				filters: true,
				possibleValues: ['United States', 'Malaysia'],
			},
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
				seed: `${collectionStates}${seed}`,
				incremental: true,
			}),
		},
		name: {
			field: 'name',
			type: 'string',
			filters: false,
			possibleValues: ['Washington', 'California', 'Johor', 'Sarawak'],
		},
	};

	schema[`${collectionCountries}_${pkType}`]['states'] = {
		field: 'states',
		type: 'alias',
		filters: false,
		possibleValues: schema[`${collectionStates}_${pkType}`].id.possibleValues,
		children: schema[`${collectionStates}_${pkType}`],
		relatedCollection: `${collectionStates}_${pkType}`,
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

					// Delete existing collections
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

					// Create O2M relationships
					await CreateFieldO2M(vendor, {
						collection: localCollectionCountries,
						field: 'states',
						otherCollection: localCollectionStates,
						otherField: 'country_id',
						primaryKeyType: pkType,
					});

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

				const localCollectionCountries = `${collectionCountries}_${pkType}`;
				const localCollectionStates = `${collectionStates}_${pkType}`;

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
			}
		}),
	);
};
