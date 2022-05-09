import vendors from '@common/get-dbs-to-test';
import { CreateCollection, CreateField, CreateFieldM2O, CreateItem, DeleteCollection } from '@common/functions';
import { TestsSchema } from '@query/filter';
import { range } from 'lodash';

export const collectionCountries = 'test_items_m2o_countries';
export const collectionStates = 'test_items_m2o_states';
export const collectionCities = 'test_items_m2o_cities';

export type Country = {
	id?: number;
	name: string;
};

export type State = {
	id?: number;
	name: string;
	country_id?: number;
};

export type City = {
	id?: number;
	name: string;
	state_id?: number;
};

export const seedSchema: TestsSchema = {
	[collectionCountries]: [
		{
			field: 'id',
			type: 'integer',
			filters: true,
			possibleValues: range(10000, 10002),
			children: null,
		},
		{
			field: 'name',
			type: 'string',
			filters: true,
			possibleValues: ['United States', 'Malaysia'],
			children: null,
		},
	],
	[collectionStates]: [
		{
			field: 'id',
			type: 'integer',
			filters: false,
			possibleValues: range(10000, 10004),
			children: null,
		},
		{
			field: 'name',
			type: 'string',
			filters: false,
			possibleValues: ['Washington', 'California', 'Johor', 'Sarawak'],
			children: null,
		},
		{
			field: 'country_id',
			type: 'integer',
			filters: false,
			possibleValues: range(10000, 10002),
			children: null,
		},
	],
	[collectionCities]: [
		{
			field: 'id',
			type: 'integer',
			filters: false,
			possibleValues: range(10000, 10008),
			children: null,
		},
		{
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
		{
			field: 'state_id',
			type: 'integer',
			filters: false,
			possibleValues: range(10000, 10004),
			children: null,
		},
	],
};

export const seedDB = () => {
	it.each(vendors)('%s', async (vendor) => {
		try {
			// Delete existing collections
			await DeleteCollection(vendor, { collection: collectionCities });
			await DeleteCollection(vendor, { collection: collectionStates });
			await DeleteCollection(vendor, { collection: collectionCountries });

			// Create countries collection
			await CreateCollection(vendor, {
				collection: collectionCountries,
			});

			await CreateField(vendor, {
				collection: collectionCountries,
				field: 'name',
				type: 'string',
			});

			// Create states collection
			await CreateCollection(vendor, {
				collection: collectionStates,
			});

			await CreateField(vendor, {
				collection: collectionStates,
				field: 'name',
				type: 'string',
			});

			await CreateFieldM2O(vendor, {
				collection: collectionStates,
				field: 'country_id',
				primaryKeyType: 'integer',
				otherCollection: collectionCountries,
			});

			// Create cities collection
			await CreateCollection(vendor, {
				collection: collectionCities,
			});

			await CreateField(vendor, {
				collection: collectionCities,
				field: 'name',
				type: 'string',
			});

			await CreateFieldM2O(vendor, {
				collection: collectionCities,
				field: 'state_id',
				primaryKeyType: 'integer',
				otherCollection: collectionStates,
			});

			// Create countries
			await CreateItem(vendor, {
				collection: collectionCountries,
				item: [
					{
						id: 10000,
						name: 'United States',
					},
					{
						id: 10001,
						name: 'Malaysia',
					},
				] as Country[],
			});

			// Create states
			await CreateItem(vendor, {
				collection: collectionStates,
				item: [
					{
						id: 10000,
						name: 'Washington',
						country_id: 10000,
					},
					{
						id: 10001,
						name: 'California',
						country_id: 10000,
					},
					{
						id: 10002,
						name: 'Johor',
						country_id: 10001,
					},
					{
						id: 10003,
						name: 'Sabah',
						country_id: 10001,
					},
				] as State[],
			});

			// Create cities
			await CreateItem(vendor, {
				collection: collectionCities,
				item: [
					{
						id: 10000,
						name: 'Seattle',
						state_id: 10000,
					},
					{
						id: 10001,
						name: 'Spokane',
						state_id: 10000,
					},
					{
						id: 10002,
						name: 'Los Angeles',
						state_id: 10001,
					},
					{
						id: 10003,
						name: 'San Francisco',
						state_id: 10001,
					},
					{
						id: 10004,
						name: 'Johor Bahru',
						state_id: 10002,
					},
					{
						id: 10005,
						name: 'Muar',
						state_id: 10002,
					},
					{
						id: 10006,
						name: 'Kota Kinabalu',
						state_id: 10003,
					},
					{
						id: 10007,
						name: 'Sandakan',
						state_id: 10003,
					},
				] as City[],
			});
			expect(true).toBeTruthy();
		} catch (error) {
			expect(error).toBeFalsy();
		}
	});
};
