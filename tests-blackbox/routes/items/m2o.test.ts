import request from 'supertest';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { v4 as uuid } from 'uuid';
import { CreateItem } from '@common/functions';
import * as common from '@common/index';
import { collectionCountries, collectionStates, collectionCities, Country, State, City, seedSchema } from './m2o.seed';
import { CheckQueryFilters } from '@query/filter';

function createCountry(): Country {
	return {
		name: 'country-' + uuid(),
	};
}

function createState(): State {
	return {
		name: 'state-' + uuid(),
	};
}

function createCity(): City {
	return {
		name: 'city-' + uuid(),
	};
}

describe('/items', () => {
	describe('GET /:collection/:id', () => {
		describe('retrieves one country', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const country = await CreateItem(vendor, { collection: collectionCountries, item: createCountry() });

				// Action
				const response = await request(getUrl(vendor))
					.get(`/items/${collectionCountries}/${country.id}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(200);
				expect(response.body.data).toMatchObject({ name: expect.any(String) });
			});
		});

		describe('retrieves one state', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const state = await CreateItem(vendor, { collection: collectionStates, item: createState() });

				// Action
				const response = await request(getUrl(vendor))
					.get(`/items/${collectionStates}/${state.id}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(200);
				expect(response.body.data).toMatchObject({ name: expect.any(String) });
			});
		});

		describe('retrieves one city', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const city = await CreateItem(vendor, { collection: collectionCities, item: createCity() });

				// Action
				const response = await request(getUrl(vendor))
					.get(`/items/${collectionCities}/${city.id}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(200);
				expect(response.body.data).toMatchObject({ name: expect.any(String) });
			});
		});

		describe(`retrieves a state's country`, () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const insertedCountry = await CreateItem(vendor, { collection: collectionCountries, item: createCountry() });
				const state = createState();
				state.country_id = insertedCountry.id;
				const insertedState = await CreateItem(vendor, { collection: collectionStates, item: state });

				// Action
				const response = await request(getUrl(vendor))
					.get(`/items/${collectionStates}/${insertedState.id}`)
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
						.get(`/items/${collectionCountries}/invalid_id`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(500);
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
				const insertedArtist = await CreateItem(vendor, { collection: collectionCountries, item: createCountry() });
				const body = { name: 'Tommy Cash' };

				// Action
				const response = await request(getUrl(vendor))
					.patch(`/items/${collectionCountries}/${insertedArtist.id}`)
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
				const insertedArtist = await CreateItem(vendor, { collection: collectionCountries, item: createCountry() });

				// Action
				const response = await request(getUrl(vendor))
					.delete(`/items/${collectionCountries}/${insertedArtist.id}`)
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
					countries.push(createCountry());
				}
				await CreateItem(vendor, { collection: collectionCountries, item: countries });

				// Action
				const response = await request(getUrl(vendor))
					.get(`/items/${collectionCountries}`)
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

		CheckQueryFilters(
			{
				method: 'get',
				path: `/items/${collectionCountries}`,
				token: common.USER.ADMIN.TOKEN,
			},
			seedSchema[collectionCountries]
		);

		CheckQueryFilters(
			{
				method: 'get',
				path: `/items/${collectionStates}`,
				token: common.USER.ADMIN.TOKEN,
			},
			seedSchema[collectionStates]
		);

		CheckQueryFilters(
			{
				method: 'get',
				path: `/items/${collectionCities}`,
				token: common.USER.ADMIN.TOKEN,
			},
			seedSchema[collectionCities]
		);
	});

	describe('POST /:collection', () => {
		describe('createOne', () => {
			describe('creates one country', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const country = createCountry();

					// Action
					const response = await request(getUrl(vendor))
						.post(`/items/${collectionCountries}`)
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
						countries.push(createCountry());
					}

					// Action
					const response = await request(getUrl(vendor))
						.post(`/items/${collectionCountries}`)
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
					const country = createCountry();

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
					countries.push(createCountry());
				}

				const insertedCountries = await CreateItem(vendor, { collection: collectionCountries, item: countries });
				const keys = Object.values(insertedCountries ?? []).map((item: any) => item.id);

				const body = {
					keys: keys,
					data: { name: 'Johnny Cash' },
				};

				// Action
				const response = await request(getUrl(vendor))
					.patch(`/items/${collectionCountries}?fields=name`)
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
					countries.push(createCountry());
				}

				const insertedCountries = await CreateItem(vendor, { collection: collectionCountries, item: countries });
				const keys = Object.values(insertedCountries ?? []).map((item: any) => item.id);

				// Action
				const response = await request(getUrl(vendor))
					.delete(`/items/${collectionCountries}`)
					.send(keys)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(204);
				expect(response.body.data).toBe(undefined);
			});
		});
	});
});
