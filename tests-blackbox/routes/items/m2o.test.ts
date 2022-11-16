import request from 'supertest';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { v4 as uuid } from 'uuid';
import { CreateItem } from '@common/functions';
import { CachedTestsSchema, TestsSchemaVendorValues } from '@query/filter';
import * as common from '@common/index';
import {
	collectionCountries,
	collectionStates,
	collectionCities,
	Country,
	State,
	City,
	getTestsSchema,
	seedDBValues,
} from './m2o.seed';
import { CheckQueryFilters } from '@query/filter';

function createCountry(pkType: common.PrimaryKeyType) {
	const item: Country = {
		name: 'country-' + uuid(),
	};

	if (pkType === 'string') {
		item.id = 'country-' + uuid();
	}

	return item;
}

function createState(pkType: common.PrimaryKeyType) {
	const item: State = {
		name: 'state-' + uuid(),
	};

	if (pkType === 'string') {
		item.id = 'state-' + uuid();
	}

	return item;
}

function createCity(pkType: common.PrimaryKeyType) {
	const item: City = {
		name: 'city-' + uuid(),
	};

	if (pkType === 'string') {
		item.id = 'city-' + uuid();
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
	const localCollectionCountries = `${collectionCountries}_${pkType}`;
	const localCollectionStates = `${collectionStates}_${pkType}`;
	const localCollectionCities = `${collectionCities}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('GET /:collection/:id', () => {
			describe('retrieves one country', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const country = await CreateItem(vendor, {
						collection: localCollectionCountries,
						item: createCountry(pkType),
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionCountries}/${country.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: expect.any(String) });
				});
			});

			describe('retrieves one state', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const state = await CreateItem(vendor, { collection: localCollectionStates, item: createState(pkType) });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionStates}/${state.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: expect.any(String) });
				});
			});

			describe('retrieves one city', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const city = await CreateItem(vendor, { collection: localCollectionCities, item: createCity(pkType) });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionCities}/${city.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: expect.any(String) });
				});
			});

			describe(`retrieves a state's country`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const insertedCountry = await CreateItem(vendor, {
						collection: localCollectionCountries,
						item: createCountry(pkType),
					});
					const state = createState(pkType);
					state.country_id = insertedCountry.id;
					const insertedState = await CreateItem(vendor, { collection: localCollectionStates, item: state });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionStates}/${insertedState.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ country_id: insertedCountry.id });
				});
			});

			describe('Error handling', () => {
				describe('returns an error when an invalid id is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionCountries}/invalid_id`)
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
			describe(`updates one country's name with no relations`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const insertedArtist = await CreateItem(vendor, {
						collection: localCollectionCountries,
						item: createCountry(pkType),
					});
					const body = { name: 'Tommy Cash' };

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionCountries}/${insertedArtist.id}`)
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
			describe('deletes an country with no relations', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const insertedArtist = await CreateItem(vendor, {
						collection: localCollectionCountries,
						item: createCountry(pkType),
					});

					// Action
					const response = await request(getUrl(vendor))
						.delete(`/items/${localCollectionCountries}/${insertedArtist.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(204);
					expect(response.body.data).toBe(undefined);
				});
			});
		});
		describe('GET /:collection', () => {
			describe('retrieves all items from country table with no relations', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const countries = [];
					const countriesCount = 50;
					for (let i = 0; i < countriesCount; i++) {
						countries.push(createCountry(pkType));
					}
					await CreateItem(vendor, { collection: localCollectionCountries, item: countries });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionCountries}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.length).toBeGreaterThanOrEqual(countriesCount);
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
			describe(`filters`, () => {
				describe(`on top level`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const state = createState(pkType);
						state.name = 'state-m2o-top-' + uuid();
						const insertedState = await CreateItem(vendor, {
							collection: localCollectionStates,
							item: state,
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								filter: { id: { _eq: insertedState.id } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								filter: { name: { _eq: insertedState.name } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: insertedState.id });
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data);
					});
				});

				describe(`on m2o level`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const country = createCountry(pkType);
						country.name = 'country-m2o-' + uuid();
						const insertedCountry = await CreateItem(vendor, {
							collection: localCollectionCountries,
							item: country,
						});
						const state = createState(pkType);
						state.name = 'state-m2o-' + uuid();
						state.country_id = insertedCountry.id;
						const insertedState = await CreateItem(vendor, { collection: localCollectionStates, item: state });

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								filter: JSON.stringify({ country_id: { id: { _eq: insertedCountry.id } } }),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								filter: JSON.stringify({ country_id: { name: { _eq: insertedCountry.name } } }),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: insertedState.id });
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data);
					});
				});
			});

			describe('filters with functions', () => {
				describe('on top level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const states = [];
						const years = [1980, 1988];

						for (const year of years) {
							const state = createState(pkType);
							state.name = 'state-m2o-top-fn-' + uuid();
							state.test_datetime = new Date(new Date().setFullYear(year)).toISOString().slice(0, 19);
							states.push(state);
						}

						await CreateItem(vendor, {
							collection: localCollectionStates,
							item: states,
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								filter: { 'year(test_datetime)': { _eq: years[0] } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								filter: { 'year(test_datetime)': { _eq: years[1] } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ name: states[0].name });
						expect(response2.statusCode).toEqual(200);
						expect(response2.body.data.length).toBe(1);
						expect(response2.body.data[0]).toMatchObject({ name: states[1].name });
					});
				});

				describe('on m2o level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const states = [];
						const years = [1983, 1990];

						for (const year of years) {
							const country = createCountry(pkType);
							country.name = 'country-m2o-fn-' + uuid();
							country.test_datetime = new Date(new Date().setFullYear(year)).toISOString().slice(0, 19);
							const insertedCountry = await CreateItem(vendor, {
								collection: localCollectionCountries,
								item: country,
							});
							const state = createState(pkType);
							state.name = 'state-m2o-fn-' + uuid();
							state.country_id = insertedCountry.id;
							states.push(state);
							await CreateItem(vendor, { collection: localCollectionStates, item: state });
						}

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								filter: JSON.stringify({ country_id: { 'year(test_datetime)': { _eq: years[0] } } }),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								filter: JSON.stringify({ country_id: { 'year(test_datetime)': { _eq: years[1] } } }),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ name: states[0].name });
						expect(response2.statusCode).toEqual(200);
						expect(response2.body.data.length).toBe(1);
						expect(response2.body.data[0]).toMatchObject({ name: states[1].name });
					});
				});
			});

			describe(`sorts`, () => {
				describe(`on top level`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const sortValues = [4, 2, 3, 5, 1];
						const states = [];

						for (const val of sortValues) {
							const state = createState(pkType);
							state.name = 'state-m2o-top-sort-' + val;
							states.push(state);
						}

						await CreateItem(vendor, {
							collection: localCollectionStates,
							item: states,
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								sort: 'name',
								filter: { name: { _starts_with: 'state-m2o-top-sort-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								sort: '-name',
								filter: { name: { _starts_with: 'state-m2o-top-sort-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(5);
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data.reverse());
					});
				});

				describe(`on m2o level`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const sortValues = [4, 2, 3, 5, 1];

						for (const val of sortValues) {
							const country = createCountry(pkType);
							country.name = 'country-m2o-sort-' + val;
							const insertedCountry = await CreateItem(vendor, {
								collection: localCollectionCountries,
								item: country,
							});
							const state = createState(pkType);
							state.name = 'state-m2o-sort-' + uuid();
							state.country_id = insertedCountry.id;
							await CreateItem(vendor, { collection: localCollectionStates, item: state });
						}

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								sort: 'country_id.name',
								filter: { name: { _starts_with: 'state-m2o-sort-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								sort: '-country_id.name',
								filter: { name: { _starts_with: 'state-m2o-sort-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(5);
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data.reverse());
					});
				});
			});

			describe(`sorts with functions`, () => {
				describe(`on top level`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const sortValues = [4, 2, 3, 5, 1];
						const states = [];

						for (const val of sortValues) {
							const state = createState(pkType);
							state.name = 'state-m2o-top-sort-fn-' + uuid();
							state.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`))).toISOString().slice(0, 19);
							states.push(state);
						}

						await CreateItem(vendor, {
							collection: localCollectionStates,
							item: states,
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								sort: 'year(test_datetime)',
								filter: { name: { _starts_with: 'state-m2o-top-sort-fn-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								sort: '-year(test_datetime)',
								filter: { name: { _starts_with: 'state-m2o-top-sort-fn-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(5);
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data.reverse());
					});
				});

				describe(`on m2o level`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const sortValues = [4, 2, 3, 5, 1];

						for (const val of sortValues) {
							const country = createCountry(pkType);
							country.name = 'country-m2o-sort-fn-' + uuid();
							country.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`)))
								.toISOString()
								.slice(0, 19);
							const insertedCountry = await CreateItem(vendor, {
								collection: localCollectionCountries,
								item: country,
							});
							const state = createState(pkType);
							state.name = 'state-m2o-sort-fn-' + uuid();
							state.country_id = insertedCountry.id;
							await CreateItem(vendor, { collection: localCollectionStates, item: state });
						}

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								sort: 'country_id.year(test_datetime)',
								filter: { name: { _starts_with: 'state-m2o-sort-fn-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								sort: '-country_id.year(test_datetime)',
								filter: { name: { _starts_with: 'state-m2o-sort-fn-' } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(5);
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data.reverse());
					});
				});
			});

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionCountries}`,
					token: common.USER.ADMIN.TOKEN,
				},
				localCollectionCountries,
				getTestsSchema(pkType)[localCollectionCountries],
				vendorSchemaValues
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionStates}`,
					token: common.USER.ADMIN.TOKEN,
				},
				localCollectionStates,
				getTestsSchema(pkType)[localCollectionStates],
				vendorSchemaValues
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionCities}`,
					token: common.USER.ADMIN.TOKEN,
				},
				localCollectionCities,
				getTestsSchema(pkType)[localCollectionCities],
				vendorSchemaValues
			);
		});

		describe('POST /:collection', () => {
			describe('createOne', () => {
				describe('creates one country', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const country = createCountry(pkType);

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/${localCollectionCountries}`)
							.send(country)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toMatchObject({ name: country.name });
					});
				});
			});
			describe('createMany', () => {
				describe('creates 5 countries', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const countries = [];
						const countriesCount = 5;
						for (let i = 0; i < countriesCount; i++) {
							countries.push(createCountry(pkType));
						}

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/${localCollectionCountries}`)
							.send(countries)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(countriesCount);
					});
				});
			});
			describe('Error handling', () => {
				describe('returns an error when an invalid table is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const country = createCountry(pkType);

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/invalid_table`)
							.send(country)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toBe(403);
					});
				});
			});
		});

		describe('PATCH /:collection', () => {
			describe('updates many countries to a different name', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const countries = [];
					const countriesCount = 5;
					for (let i = 0; i < countriesCount; i++) {
						countries.push(createCountry(pkType));
					}

					const insertedCountries = await CreateItem(vendor, { collection: localCollectionCountries, item: countries });
					const keys = Object.values(insertedCountries ?? []).map((item: any) => item.id);

					const body = {
						keys: keys,
						data: { name: 'Johnny Cash' },
					};

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionCountries}?fields=name`)
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
			describe('deletes many countries with no relations', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const countries = [];
					const countriesCount = 10;
					for (let i = 0; i < countriesCount; i++) {
						countries.push(createCountry(pkType));
					}

					const insertedCountries = await CreateItem(vendor, { collection: localCollectionCountries, item: countries });
					const keys = Object.values(insertedCountries ?? []).map((item: any) => item.id);

					// Action
					const response = await request(getUrl(vendor))
						.delete(`/items/${localCollectionCountries}`)
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
