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
import { TestsSchema } from '@query/filter';
import { seedAllTypes, getTestsAllTypesSchema } from './all-types';

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

export function getTestsSchema(pkType: PrimaryKeyType): TestsSchema {
	return {
		[`${collectionCountries}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				filters: true,
				possibleValues:
					pkType === 'integer'
						? SeedFunctions.generateValues.integer({ quantity: 2, startsAt: 10000 })
						: pkType === 'uuid'
						? SeedFunctions.generateValues.uuid({ quantity: 2 })
						: SeedFunctions.generateValues.string({ quantity: 2 }),
				children: null,
			},
			name: {
				field: 'name',
				type: 'string',
				filters: true,
				possibleValues: ['United States', 'Malaysia'],
				children: null,
			},
			...getTestsAllTypesSchema(),
		},
		[`${collectionStates}_${pkType}`]: {
			id: {
				field: 'id',
				type: pkType,
				filters: false,
				possibleValues:
					pkType === 'integer'
						? SeedFunctions.generateValues.integer({ quantity: 4, startsAt: 10000 })
						: pkType === 'uuid'
						? SeedFunctions.generateValues.uuid({ quantity: 4 })
						: SeedFunctions.generateValues.string({ quantity: 4 }),
				children: null,
			},
			name: {
				field: 'name',
				type: 'string',
				filters: false,
				possibleValues: ['Washington', 'California', 'Johor', 'Sarawak'],
				children: null,
			},
			country_id: {
				field: 'country_id',
				type: 'integer',
				filters: false,
				possibleValues:
					pkType === 'integer'
						? SeedFunctions.generateValues.integer({ quantity: 2, startsAt: 10000 })
						: pkType === 'uuid'
						? SeedFunctions.generateValues.uuid({ quantity: 2 })
						: SeedFunctions.generateValues.string({ quantity: 2 }),
				children: null,
			},
			...getTestsAllTypesSchema(),
		},
		[`${collectionCities}_${pkType}`]: {
			id: {
				field: 'id',
				type: 'integer',
				filters: false,
				possibleValues:
					pkType === 'integer'
						? SeedFunctions.generateValues.integer({ quantity: 8, startsAt: 10000 })
						: pkType === 'uuid'
						? SeedFunctions.generateValues.uuid({ quantity: 8 })
						: SeedFunctions.generateValues.string({ quantity: 8 }),
				children: null,
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
				children: null,
			},
			state_id: {
				field: 'state_id',
				type: 'integer',
				filters: false,
				possibleValues:
					pkType === 'integer'
						? SeedFunctions.generateValues.integer({ quantity: 4, startsAt: 10000 })
						: pkType === 'uuid'
						? SeedFunctions.generateValues.uuid({ quantity: 4 })
						: SeedFunctions.generateValues.string({ quantity: 4 }),
				children: null,
			},
			...getTestsAllTypesSchema(),
		},
	};
}

export const seedDB = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			for (const pkType of PRIMARY_KEY_TYPES) {
				try {
					const schema = getTestsSchema(pkType);

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

					await seedAllTypes(vendor, localCollectionCountries, pkType);
					await seedAllTypes(vendor, localCollectionStates, pkType);
					await seedAllTypes(vendor, localCollectionCities, pkType);

					expect(true).toBeTruthy();
				} catch (error) {
					expect(error).toBeFalsy();
				}
			}
		},
		30000
	);
};
