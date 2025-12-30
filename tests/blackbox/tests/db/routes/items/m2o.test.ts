import {
	type City,
	collectionCities,
	collectionCountries,
	collectionStates,
	type Country,
	getTestsSchema,
	seedDBValues,
	type State,
} from './m2o.seed';
import { type CachedTestsSchema, CheckQueryFilters, type TestsSchemaVendorValues } from '../../query/filter';
import config, { getUrl } from '@common/config';
import { CreateItem, ReadItem } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { createWebSocketConn, createWebSocketGql, requestGraphQL } from '@common/transport';
import type { PrimaryKeyType } from '@common/types';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import { without } from 'lodash-es';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it, test } from 'vitest';

function createCountry(pkType: PrimaryKeyType) {
	const item: Country = {
		name: 'country-' + randomUUID(),
	};

	if (pkType === 'string') {
		item.id = 'country-' + randomUUID();
	}

	return item;
}

function createState(pkType: PrimaryKeyType) {
	const item: State = {
		name: 'state-' + randomUUID(),
	};

	if (pkType === 'string') {
		item.id = 'state-' + randomUUID();
	}

	return item;
}

function createCity(pkType: PrimaryKeyType) {
	const item: City = {
		name: 'city-' + randomUUID(),
	};

	if (pkType === 'string') {
		item.id = 'city-' + randomUUID();
	}

	return item;
}

const cachedSchema = PRIMARY_KEY_TYPES.reduce((acc, pkType) => {
	acc[pkType] = getTestsSchema(pkType);
	return acc;
}, {} as CachedTestsSchema);

const vendorSchemaValues: TestsSchemaVendorValues = {};

beforeAll(async () => {
	await seedDBValues(cachedSchema, vendorSchemaValues);
}, 300_000);

describe('Seed Database Values', () => {
	it.each(vendors)('%s', async (vendor) => {
		// Assert
		expect(vendorSchemaValues[vendor]).toBeDefined();
	});
});

describe.each(PRIMARY_KEY_TYPES)('/items', (pkType) => {
	const localCollectionCountries = `${collectionCountries}_${pkType}`;
	const localCollectionStates = `${collectionStates}_${pkType}`;
	const localCollectionCities = `${collectionCities}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('GET /:collection/:id', () => {
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
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
						query: {
							[localCollectionStates]: {
								__args: {
									filter: {
										id: {
											_eq: insertedState.id,
										},
									},
								},
								country_id: {
									id: true,
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ country_id: insertedCountry.id });

					expect(gqlResponse.statusCode).toEqual(200);

					expect(gqlResponse.body.data).toMatchObject({
						[localCollectionStates]: [{ country_id: { id: String(insertedCountry.id) } }],
					});
				});
			});
		});

		describe('GET /:collection', () => {
			describe('filters', () => {
				describe('on top level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const state = createState(pkType);
						state.name = 'state-m2o-top-' + randomUUID();

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
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								filter: { name: { _eq: insertedState.name } },
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
							query: {
								[localCollectionStates]: {
									__args: {
										filter: {
											id: {
												_eq: insertedState.id,
											},
										},
									},
									id: true,
								},
							},
						});

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
							query: {
								[localCollectionStates]: {
									__args: {
										filter: {
											name: {
												_eq: insertedState.name,
											},
										},
									},
									id: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: insertedState.id });
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data);

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionStates].length).toBe(1);

						expect(gqlResponse.body.data[localCollectionStates][0]).toMatchObject({
							id: String(insertedState.id),
						});

						expect(gqlResponse2.statusCode).toBe(200);
						expect(gqlResponse.body.data).toEqual(gqlResponse2.body.data);
					});
				});

				describe('on m2o level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const country = createCountry(pkType);
						country.name = 'country-m2o-' + randomUUID();

						const insertedCountry = await CreateItem(vendor, {
							collection: localCollectionCountries,
							item: country,
						});

						const state = createState(pkType);
						state.name = 'state-m2o-' + randomUUID();
						state.country_id = insertedCountry.id;
						const insertedState = await CreateItem(vendor, { collection: localCollectionStates, item: state });

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								filter: JSON.stringify({ country_id: { id: { _eq: insertedCountry.id } } }),
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								filter: JSON.stringify({ country_id: { name: { _eq: insertedCountry.name } } }),
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
							query: {
								[localCollectionStates]: {
									__args: {
										filter: {
											country_id: { id: { _eq: insertedCountry.id } },
										},
									},
									id: true,
								},
							},
						});

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
							query: {
								[localCollectionStates]: {
									__args: {
										filter: {
											country_id: { name: { _eq: insertedCountry.name } },
										},
									},
									id: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: insertedState.id });
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data);

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionStates].length).toBe(1);

						expect(gqlResponse.body.data[localCollectionStates][0]).toMatchObject({
							id: String(insertedState.id),
						});

						expect(gqlResponse2.statusCode).toBe(200);
						expect(gqlResponse.body.data).toEqual(gqlResponse2.body.data);
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
							state.name = 'state-m2o-top-fn-' + randomUUID();
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
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								filter: { 'year(test_datetime)': { _eq: years[1] } },
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
							query: {
								[localCollectionStates]: {
									__args: {
										filter: {
											test_datetime_func: { year: { _eq: years[0] } },
										},
									},
									name: true,
								},
							},
						});

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
							query: {
								[localCollectionStates]: {
									__args: {
										filter: {
											test_datetime_func: { year: { _eq: years[1] } },
										},
									},
									name: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ name: states[0]?.name });
						expect(response2.statusCode).toEqual(200);
						expect(response2.body.data.length).toBe(1);
						expect(response2.body.data[0]).toMatchObject({ name: states[1]?.name });

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionStates].length).toBe(1);

						expect(gqlResponse.body.data[localCollectionStates][0]).toMatchObject({
							name: states[0]?.name,
						});

						expect(gqlResponse2.statusCode).toBe(200);
						expect(gqlResponse2.body.data[localCollectionStates].length).toBe(1);

						expect(gqlResponse2.body.data[localCollectionStates][0]).toMatchObject({
							name: states[1]?.name,
						});
					});
				});

				describe('on m2o level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const states = [];
						const years = [1983, 1990];

						for (const year of years) {
							const country = createCountry(pkType);
							country.name = 'country-m2o-fn-' + randomUUID();
							country.test_datetime = new Date(new Date().setFullYear(year)).toISOString().slice(0, 19);

							const insertedCountry = await CreateItem(vendor, {
								collection: localCollectionCountries,
								item: country,
							});

							const state = createState(pkType);
							state.name = 'state-m2o-fn-' + randomUUID();
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
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionStates}`)
							.query({
								filter: JSON.stringify({ country_id: { 'year(test_datetime)': { _eq: years[1] } } }),
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
							query: {
								[localCollectionStates]: {
									__args: {
										filter: {
											country_id: {
												test_datetime_func: {
													year: {
														_eq: years[0],
													},
												},
											},
										},
									},
									name: true,
								},
							},
						});

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
							query: {
								[localCollectionStates]: {
									__args: {
										filter: {
											country_id: {
												test_datetime_func: {
													year: {
														_eq: years[1],
													},
												},
											},
										},
									},
									name: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ name: states[0]?.name });
						expect(response2.statusCode).toEqual(200);
						expect(response2.body.data.length).toBe(1);
						expect(response2.body.data[0]).toMatchObject({ name: states[1]?.name });

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionStates].length).toBe(1);

						expect(gqlResponse.body.data[localCollectionStates][0]).toMatchObject({
							name: states[0]?.name,
						});

						expect(gqlResponse2.statusCode).toBe(200);
						expect(gqlResponse2.body.data[localCollectionStates].length).toBe(1);

						expect(gqlResponse2.body.data[localCollectionStates][0]).toMatchObject({
							name: states[1]?.name,
						});
					});
				});
			});

			describe('sorts', () => {
				describe('on top level', () => {
					beforeAll(async () => {
						for (const vendor of vendors) {
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
						}
					});

					describe('without limit', () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: 'name',
									filter: { name: { _starts_with: 'state-m2o-top-sort-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-name',
									filter: { name: { _starts_with: 'state-m2o-top-sort-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: 'name',
											filter: { name: { _starts_with: 'state-m2o-top-sort-' } },
										},
										id: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: '-name',
											filter: { name: { _starts_with: 'state-m2o-top-sort-' } },
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response.body.data.length).toBe(5);
							expect(response2.statusCode).toEqual(200);
							expect(response.body.data).toEqual(response2.body.data.reverse());

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates].length).toBe(5);
							expect(gqlResponse2.statusCode).toEqual(200);

							expect(gqlResponse.body.data[localCollectionStates]).toEqual(
								gqlResponse2.body.data[localCollectionStates].reverse(),
							);
						});
					});

					describe.each([-1, 1, 3])('where limit = %s', (limit) => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const expectedLength = limit === -1 ? 5 : limit;
							const expectedAsc = [1, 2, 3, 4, 5].slice(0, expectedLength);
							const expectedDesc = [5, 4, 3, 2, 1].slice(0, expectedLength);

							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: 'name',
									filter: { name: { _starts_with: 'state-m2o-top-sort-' } },
									limit,
									fields: 'name',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-name',
									filter: { name: { _starts_with: 'state-m2o-top-sort-' } },
									limit,
									fields: 'name',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: 'name',
											filter: { name: { _starts_with: 'state-m2o-top-sort-' } },
											limit,
										},
										id: true,
										name: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: '-name',
											filter: { name: { _starts_with: 'state-m2o-top-sort-' } },
											limit,
										},
										id: true,
										name: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response.body.data.length).toBe(expectedLength);
							expect(response2.statusCode).toEqual(200);
							expect(response.body.data).not.toEqual(response2.body.data);

							expect(
								response.body.data.map((item: any) => {
									return parseInt(item.name.slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.name.slice(-1));
								}),
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);

							expect(gqlResponse.body.data[localCollectionStates]).not.toEqual(
								gqlResponse2.body.data[localCollectionStates],
							);

							expect(
								gqlResponse.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.name.slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								gqlResponse2.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.name.slice(-1));
								}),
							).toEqual(expectedDesc);
						});
					});
				});

				describe('on m2o level', () => {
					beforeAll(async () => {
						for (const vendor of vendors) {
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
								state.name = 'state-m2o-sort-' + randomUUID();
								state.country_id = insertedCountry.id;
								await CreateItem(vendor, { collection: localCollectionStates, item: state });
							}
						}
					});

					describe('without limit', () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: 'country_id.name',
									filter: { name: { _starts_with: 'state-m2o-sort-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-country_id.name',
									filter: { name: { _starts_with: 'state-m2o-sort-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: 'country_id.name',
											filter: { name: { _starts_with: 'state-m2o-sort-' } },
										},
										id: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: '-country_id.name',
											filter: { name: { _starts_with: 'state-m2o-sort-' } },
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response.body.data.length).toBe(5);
							expect(response2.statusCode).toEqual(200);
							expect(response.body.data).toEqual(response2.body.data.reverse());

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates].length).toBe(5);
							expect(gqlResponse2.statusCode).toEqual(200);

							expect(gqlResponse.body.data[localCollectionStates]).toEqual(
								gqlResponse2.body.data[localCollectionStates].reverse(),
							);
						});
					});

					describe.each([-1, 1, 3])('where limit = %s', (limit) => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const expectedLength = limit === -1 ? 5 : limit;
							const expectedAsc = [1, 2, 3, 4, 5].slice(0, expectedLength);
							const expectedDesc = [5, 4, 3, 2, 1].slice(0, expectedLength);

							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: 'country_id.name',
									filter: { name: { _starts_with: 'state-m2o-sort-' } },
									limit,
									fields: 'country_id.name',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-country_id.name',
									filter: { name: { _starts_with: 'state-m2o-sort-' } },
									limit,
									fields: 'country_id.name',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: 'country_id.name',
											filter: { name: { _starts_with: 'state-m2o-sort-' } },
											limit,
										},
										id: true,
										country_id: {
											name: true,
										},
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: '-country_id.name',
											filter: { name: { _starts_with: 'state-m2o-sort-' } },
											limit,
										},
										id: true,
										country_id: {
											name: true,
										},
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response.body.data.length).toBe(expectedLength);
							expect(response2.statusCode).toEqual(200);
							expect(response.body.data).not.toEqual(response2.body.data);

							expect(
								response.body.data.map((item: any) => {
									return parseInt(item.country_id.name.slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.country_id.name.slice(-1));
								}),
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);

							expect(gqlResponse.body.data[localCollectionStates]).not.toEqual(
								gqlResponse2.body.data[localCollectionStates],
							);

							expect(
								gqlResponse.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.country_id.name.slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								gqlResponse2.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.country_id.name.slice(-1));
								}),
							).toEqual(expectedDesc);
						});
					});
				});
			});

			describe('sorts with functions', () => {
				describe('on top level', () => {
					beforeAll(async () => {
						for (const vendor of vendors) {
							// Setup
							const sortValues = [4, 2, 3, 5, 1];
							const states = [];

							for (const val of sortValues) {
								const state = createState(pkType);
								state.name = 'state-m2o-top-sort-fn-' + randomUUID();

								state.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`)))
									.toISOString()
									.slice(0, 19);

								states.push(state);
							}

							await CreateItem(vendor, {
								collection: localCollectionStates,
								item: states,
							});
						}
					});

					describe('without limit', () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: 'year(test_datetime)',
									filter: { name: { _starts_with: 'state-m2o-top-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-year(test_datetime)',
									filter: { name: { _starts_with: 'state-m2o-top-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: 'year(test_datetime)',
											filter: { name: { _starts_with: 'state-m2o-top-sort-fn-' } },
										},
										id: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: '-year(test_datetime)',
											filter: { name: { _starts_with: 'state-m2o-top-sort-fn-' } },
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response.body.data.length).toBe(5);
							expect(response2.statusCode).toEqual(200);
							expect(response.body.data).toEqual(response2.body.data.reverse());

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates].length).toBe(5);
							expect(gqlResponse2.statusCode).toEqual(200);

							expect(gqlResponse.body.data[localCollectionStates]).toEqual(
								gqlResponse2.body.data[localCollectionStates].reverse(),
							);
						});
					});

					describe.each([-1, 1, 3])('where limit = %s', (limit) => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const expectedLength = limit === -1 ? 5 : limit;
							const expectedAsc = [1, 2, 3, 4, 5].slice(0, expectedLength);
							const expectedDesc = [5, 4, 3, 2, 1].slice(0, expectedLength);

							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: 'year(test_datetime)',
									filter: { name: { _starts_with: 'state-m2o-top-sort-fn-' } },
									limit,
									fields: 'year(test_datetime)',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-year(test_datetime)',
									filter: { name: { _starts_with: 'state-m2o-top-sort-fn-' } },
									limit,
									fields: 'year(test_datetime)',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: 'year(test_datetime)',
											filter: { name: { _starts_with: 'state-m2o-top-sort-fn-' } },
											limit,
										},
										id: true,
										test_datetime_func: {
											year: true,
										},
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: '-year(test_datetime)',
											filter: { name: { _starts_with: 'state-m2o-top-sort-fn-' } },
											limit,
										},
										id: true,
										test_datetime_func: {
											year: true,
										},
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response.body.data.length).toBe(expectedLength);
							expect(response2.statusCode).toEqual(200);
							expect(response.body.data).not.toEqual(response2.body.data);

							expect(
								response.body.data.map((item: any) => {
									return parseInt(item.test_datetime_year.toString().slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.test_datetime_year.toString().slice(-1));
								}),
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);

							expect(gqlResponse.body.data[localCollectionStates]).not.toEqual(
								gqlResponse2.body.data[localCollectionStates],
							);

							expect(
								gqlResponse.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.test_datetime_func.year.toString().slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								gqlResponse2.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.test_datetime_func.year.toString().slice(-1));
								}),
							).toEqual(expectedDesc);
						});
					});
				});

				describe('on m2o level', () => {
					beforeAll(async () => {
						for (const vendor of vendors) {
							// Setup
							const sortValues = [4, 2, 3, 5, 1];

							for (const val of sortValues) {
								const country = createCountry(pkType);
								country.name = 'country-m2o-sort-fn-' + randomUUID();

								country.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`)))
									.toISOString()
									.slice(0, 19);

								const insertedCountry = await CreateItem(vendor, {
									collection: localCollectionCountries,
									item: country,
								});

								const state = createState(pkType);
								state.name = 'state-m2o-sort-fn-' + randomUUID();
								state.country_id = insertedCountry.id;
								await CreateItem(vendor, { collection: localCollectionStates, item: state });
							}
						}
					});

					describe('without limit', () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: 'country_id.year(test_datetime)',
									filter: { name: { _starts_with: 'state-m2o-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-country_id.year(test_datetime)',
									filter: { name: { _starts_with: 'state-m2o-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: 'country_id.year(test_datetime)',
											filter: { name: { _starts_with: 'state-m2o-sort-fn-' } },
										},
										id: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: '-country_id.year(test_datetime)',
											filter: { name: { _starts_with: 'state-m2o-sort-fn-' } },
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response.body.data.length).toBe(5);
							expect(response2.statusCode).toEqual(200);
							expect(response.body.data).toEqual(response2.body.data.reverse());

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates].length).toBe(5);
							expect(gqlResponse2.statusCode).toEqual(200);

							expect(gqlResponse.body.data[localCollectionStates]).toEqual(
								gqlResponse2.body.data[localCollectionStates].reverse(),
							);
						});
					});

					describe.each([-1, 1, 3])('where limit = %s', (limit) => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const expectedLength = limit === -1 ? 5 : limit;
							const expectedAsc = [1, 2, 3, 4, 5].slice(0, expectedLength);
							const expectedDesc = [5, 4, 3, 2, 1].slice(0, expectedLength);

							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: 'country_id.year(test_datetime)',
									filter: { name: { _starts_with: 'state-m2o-sort-fn-' } },
									limit,
									fields: 'country_id.year(test_datetime)',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-country_id.year(test_datetime)',
									filter: { name: { _starts_with: 'state-m2o-sort-fn-' } },
									limit,
									fields: 'country_id.year(test_datetime)',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: 'country_id.year(test_datetime)',
											filter: { name: { _starts_with: 'state-m2o-sort-fn-' } },
											limit,
										},
										id: true,
										country_id: {
											test_datetime_func: {
												year: true,
											},
										},
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
								query: {
									[localCollectionStates]: {
										__args: {
											sort: '-country_id.year(test_datetime)',
											filter: { name: { _starts_with: 'state-m2o-sort-fn-' } },
											limit,
										},
										id: true,
										country_id: {
											test_datetime_func: {
												year: true,
											},
										},
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response.body.data.length).toBe(expectedLength);
							expect(response2.statusCode).toEqual(200);
							expect(response.body.data).not.toEqual(response2.body.data);

							expect(
								response.body.data.map((item: any) => {
									return parseInt(item.country_id.test_datetime_year.toString().slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.country_id.test_datetime_year.toString().slice(-1));
								}),
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);

							expect(gqlResponse.body.data[localCollectionStates]).not.toEqual(
								gqlResponse2.body.data[localCollectionStates],
							);

							expect(
								gqlResponse.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.country_id.test_datetime_func.year.toString().slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								gqlResponse2.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.country_id.test_datetime_func.year.toString().slice(-1));
								}),
							).toEqual(expectedDesc);
						});
					});
				});
			});

			describe('MAX_BATCH_MUTATION Tests', () => {
				describe('createMany', () => {
					describe('passes when below limit', () => {
						it.each(vendors)(
							'%s',
							async (vendor) => {
								// Setup
								const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 2;
								const states: any[] = [];
								const states2: any[] = [];

								for (let i = 0; i < count; i++) {
									states.push(createState(pkType));
									states[i].country_id = createCountry(pkType);

									states2.push(createState(pkType));
									states2[i].country_id = createCountry(pkType);
								}

								const ws = createWebSocketConn(getUrl(vendor), {
									auth: { access_token: USER.ADMIN.TOKEN },
								});

								await ws.subscribe({ collection: localCollectionCountries, uid: localCollectionCountries });
								await ws.subscribe({ collection: localCollectionStates, uid: localCollectionStates });

								const wsGql = createWebSocketGql(getUrl(vendor), {
									auth: { access_token: USER.ADMIN.TOKEN },
								});

								const subscriptionKeyCountries = await wsGql.subscribe({
									collection: localCollectionCountries,
									jsonQuery: {
										event: true,
										data: {
											id: true,
											name: true,
										},
									},
									uid: localCollectionCountries,
								});

								const subscriptionKeyStates = await wsGql.subscribe({
									collection: localCollectionStates,
									jsonQuery: {
										event: true,
										data: {
											id: true,
											name: true,
											country_id: {
												id: true,
											},
										},
									},
									uid: localCollectionStates,
								});

								// Action
								const response = await request(getUrl(vendor))
									.post(`/items/${localCollectionStates}`)
									.send(states)
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

								const wsMessagesCountries = await ws.getMessages(count, { uid: localCollectionCountries });
								const wsMessagesStates = await ws.getMessages(count, { uid: localCollectionStates });
								const wsGqlMessagesCountries = await wsGql.getMessages(count, { uid: localCollectionCountries });
								const wsGqlMessagesStates = await wsGql.getMessages(count, { uid: localCollectionStates });

								const mutationKey = `create_${localCollectionStates}_items`;

								const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
									mutation: {
										[mutationKey]: {
											__args: {
												data: states2,
											},
											id: true,
										},
									},
								});

								const wsMessagesGqlCountries = await ws.getMessages(count, { uid: localCollectionCountries });
								const wsMessagesGqlStates = await ws.getMessages(count, { uid: localCollectionStates });
								ws.conn.close();
								const wsGqlMessagesGqlCountries = await wsGql.getMessages(count, { uid: localCollectionCountries });
								const wsGqlMessagesGqlStates = await wsGql.getMessages(count, { uid: localCollectionStates });
								wsGql.client.dispose();

								// Assert
								expect(response.statusCode).toBe(200);
								expect(response.body.data.length).toBe(count);
								expect(gqlResponse.statusCode).toBe(200);
								expect(gqlResponse.body.data[mutationKey].length).toEqual(count);

								for (const { messagesCountries, messagesStates } of [
									{ messagesCountries: wsMessagesCountries, messagesStates: wsMessagesStates },
									{ messagesCountries: wsMessagesGqlCountries, messagesStates: wsMessagesGqlStates },
								]) {
									expect(messagesCountries?.length).toBe(count);
									expect(messagesStates?.length).toBe(count);

									for (let i = 0; i < count; i++) {
										expect(messagesCountries![i]).toMatchObject({
											type: 'subscription',
											event: 'create',
											data: [
												{
													id: expect.anything(),
													name: expect.any(String),
												},
											],
										});

										expect(messagesStates![i]).toMatchObject({
											type: 'subscription',
											event: 'create',
											data: [
												{
													id: expect.anything(),
													name: expect.any(String),
													country_id: expect.anything(),
												},
											],
										});
									}
								}

								for (const { messagesCountries, messagesStates } of [
									{ messagesCountries: wsGqlMessagesCountries, messagesStates: wsGqlMessagesStates },
									{ messagesCountries: wsGqlMessagesGqlCountries, messagesStates: wsGqlMessagesGqlStates },
								]) {
									expect(messagesCountries?.length).toBe(count);
									expect(messagesStates?.length).toBe(count);

									for (let i = 0; i < count; i++) {
										expect(messagesCountries![i]).toEqual({
											data: {
												[subscriptionKeyCountries]: {
													event: 'create',
													data: {
														id: expect.anything(),
														name: expect.any(String),
													},
												},
											},
										});

										expect(messagesStates![i]).toEqual({
											data: {
												[subscriptionKeyStates]: {
													event: 'create',
													data: {
														id: expect.anything(),
														name: expect.any(String),
														country_id: {
															id: expect.anything(),
														},
													},
												},
											},
										});
									}
								}
							},
							120000,
						);
					});

					describe('errors when above limit', () => {
						it.each(vendors)(
							'%s',
							async (vendor) => {
								// Setup
								const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 2 + 1;
								const states: any[] = [];
								const states2: any[] = [];

								for (let i = 0; i < count; i++) {
									states.push(createState(pkType));
									states[i].country_id = createCountry(pkType);

									states2.push(createState(pkType));
									states2[i].country_id = createCountry(pkType);
								}

								const ws = createWebSocketConn(getUrl(vendor), {
									auth: { access_token: USER.ADMIN.TOKEN },
								});

								await ws.subscribe({ collection: localCollectionCountries, uid: localCollectionCountries });
								await ws.subscribe({ collection: localCollectionStates, uid: localCollectionStates });

								const wsGql = createWebSocketGql(getUrl(vendor), {
									auth: { access_token: USER.ADMIN.TOKEN },
								});

								await wsGql.subscribe({
									collection: localCollectionCountries,
									jsonQuery: {
										id: true,
										name: true,
										event: true,
									},
									uid: localCollectionCountries,
								});

								await wsGql.subscribe({
									collection: localCollectionStates,
									jsonQuery: {
										id: true,
										name: true,
										country_id: {
											id: true,
										},
										event: true,
									},
									uid: localCollectionStates,
								});

								// Action
								const response = await request(getUrl(vendor))
									.post(`/items/${localCollectionStates}`)
									.send(states)
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

								const mutationKey = `create_${localCollectionStates}_items`;

								const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
									mutation: {
										[mutationKey]: {
											__args: {
												data: states2,
											},
											id: true,
										},
									},
								});

								ws.conn.close();
								wsGql.client.dispose();

								// Assert
								expect(response.statusCode).toBe(400);
								expect(response.body.errors).toBeDefined();

								expect(response.body.errors[0].message).toBe(
									`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
								);

								expect(gqlResponse.statusCode).toBe(200);
								expect(gqlResponse.body.errors).toBeDefined();

								expect(gqlResponse.body.errors[0].message).toBe(
									`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
								);

								expect(ws.getMessageCount(localCollectionCountries)).toBe(1);
								expect(ws.getMessageCount(localCollectionStates)).toBe(1);
								expect(wsGql.getMessageCount(localCollectionCountries)).toBe(0);
								expect(wsGql.getMessageCount(localCollectionStates)).toBe(0);
							},
							120000,
						);
					});
				});

				describe('updateBatch', () => {
					describe('passes when below limit', () => {
						it.each(vendors)(
							'%s',
							async (vendor) => {
								// Setup
								const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 2;
								const countCreate = Math.floor(count / 2);
								const statesID = [];
								const statesID2 = [];

								for (let i = 0; i < count; i++) {
									const state: any = createState(pkType);
									state.name = `max_batch_mutation_${i.toString().padStart(3, '0')}`;

									if (i >= countCreate) {
										state.country_id = createCountry(pkType);
									}

									statesID.push((await CreateItem(vendor, { collection: localCollectionStates, item: state })).id);

									const state2: any = createState(pkType);
									state2.name = `max_batch_mutation_gql_${i.toString().padStart(3, '0')}`;

									if (i >= countCreate) {
										state2.country_id = createCountry(pkType);
									}

									statesID2.push((await CreateItem(vendor, { collection: localCollectionStates, item: state2 })).id);
								}

								const states = await ReadItem(vendor, {
									collection: localCollectionStates,
									fields: ['*', 'country_id.id', 'country_id.name'],
									sort: ['name'],
									filter: { id: { _in: statesID } },
								});

								const states2 = await ReadItem(vendor, {
									collection: localCollectionStates,
									fields: ['*', 'country_id.id', 'country_id.name'],
									sort: ['name'],
									filter: { id: { _in: statesID2 } },
								});

								for (let i = 0; i < states.length; i++) {
									if (i < countCreate) {
										states[i].country_id = createCountry(pkType);
									} else {
										states[i].country_id.name = 'updated';
									}
								}

								for (let i = 0; i < states2.length; i++) {
									if (i < countCreate) {
										states2[i].country_id = createCountry(pkType);
									} else {
										states2[i].country_id.name = 'updated';
									}
								}

								// Action
								const response = await request(getUrl(vendor))
									.patch(`/items/${localCollectionStates}`)
									.send(states)
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

								const mutationKey = `update_${localCollectionStates}_batch`;

								const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
									mutation: {
										[mutationKey]: {
											__args: {
												data: states2,
											},
											id: true,
										},
									},
								});

								// Assert
								expect(response.statusCode).toBe(200);
								expect(response.body.data.length).toBe(count);

								expect(gqlResponse.statusCode).toBe(200);
								expect(gqlResponse.body.data[mutationKey].length).toEqual(count);
							},
							120000,
						);
					});

					describe('errors when above limit', () => {
						it.each(vendors)(
							'%s',
							async (vendor) => {
								// Setup
								const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 2 + 1;
								const countCreate = Math.floor(count / 2);
								const statesID = [];
								const statesID2 = [];

								for (let i = 0; i < count; i++) {
									const state: any = createState(pkType);
									state.name = `max_batch_mutation_${i.toString().padStart(3, '0')}`;

									if (i >= countCreate) {
										state.country_id = createCountry(pkType);
									}

									statesID.push((await CreateItem(vendor, { collection: localCollectionStates, item: state })).id);

									const state2: any = createState(pkType);
									state2.name = `max_batch_mutation_gql_${i.toString().padStart(3, '0')}`;

									if (i >= countCreate) {
										state2.country_id = createCountry(pkType);
									}

									statesID2.push((await CreateItem(vendor, { collection: localCollectionStates, item: state2 })).id);
								}

								const states = await ReadItem(vendor, {
									collection: localCollectionStates,
									fields: ['*', 'country_id.id', 'country_id.name'],
									sort: ['name'],
									filter: { id: { _in: statesID } },
								});

								const states2 = await ReadItem(vendor, {
									collection: localCollectionStates,
									fields: ['*', 'country_id.id', 'country_id.name'],
									sort: ['name'],
									filter: { id: { _in: statesID2 } },
								});

								for (let i = 0; i < states.length; i++) {
									if (i < countCreate) {
										states[i].country_id = createCountry(pkType);
									} else {
										states[i].country_id.name = 'updated';
									}
								}

								for (let i = 0; i < states2.length; i++) {
									if (i < countCreate) {
										states2[i].country_id = createCountry(pkType);
									} else {
										states2[i].country_id.name = 'updated';
									}
								}

								// Action
								const response = await request(getUrl(vendor))
									.patch(`/items/${localCollectionStates}`)
									.send(states)
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

								const mutationKey = `update_${localCollectionStates}_batch`;

								const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
									mutation: {
										[mutationKey]: {
											__args: {
												data: states2,
											},
											id: true,
										},
									},
								});

								// Assert
								expect(response.statusCode).toBe(400);
								expect(response.body.errors).toBeDefined();

								expect(response.body.errors[0].message).toBe(
									`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
								);

								expect(gqlResponse.statusCode).toBe(200);
								expect(gqlResponse.body.errors).toBeDefined();

								expect(gqlResponse.body.errors[0].message).toBe(
									`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
								);
							},
							120000,
						);
					});
				});

				describe('updateMany', () => {
					describe('passes when below limit', () => {
						it.each(vendors)(
							'%s',
							async (vendor) => {
								// Setup
								const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) - 1;
								const stateIDs = [];
								const stateIDs2 = [];
								const newCountry = createCountry(pkType);
								const newCountry2 = createCountry(pkType);

								for (let i = 0; i < count; i++) {
									const state: any = createState(pkType);
									state.country_id = createCountry(pkType);
									stateIDs.push((await CreateItem(vendor, { collection: localCollectionStates, item: state })).id);

									const state2: any = createState(pkType);
									state2.country_id = createCountry(pkType);
									stateIDs2.push((await CreateItem(vendor, { collection: localCollectionStates, item: state2 })).id);
								}

								const ws = createWebSocketConn(getUrl(vendor), {
									auth: { access_token: USER.ADMIN.TOKEN },
								});

								await ws.subscribe({ collection: localCollectionCountries, uid: localCollectionCountries });
								await ws.subscribe({ collection: localCollectionStates, uid: localCollectionStates });

								const wsGql = createWebSocketGql(getUrl(vendor), {
									auth: { access_token: USER.ADMIN.TOKEN },
								});

								const subscriptionKeyCountries = await wsGql.subscribe({
									collection: localCollectionCountries,
									jsonQuery: {
										event: true,
										data: {
											id: true,
											name: true,
										},
									},
									uid: localCollectionCountries,
								});

								const subscriptionKeyStates = await wsGql.subscribe({
									collection: localCollectionStates,
									jsonQuery: {
										event: true,
										data: {
											id: true,
											name: true,
											country_id: {
												id: true,
											},
										},
									},
									uid: localCollectionStates,
								});

								// Action
								const response = await request(getUrl(vendor))
									.patch(`/items/${localCollectionStates}`)
									.send({ keys: stateIDs, data: { country_id: newCountry } })
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

								const wsMessagesCountries = await ws.getMessages(1, { uid: localCollectionCountries });
								const wsMessagesStates = await ws.getMessages(1, { uid: localCollectionStates });
								const wsGqlMessagesCountries = await wsGql.getMessages(1, { uid: localCollectionCountries });
								const wsGqlMessagesStates = await wsGql.getMessages(count - 1, { uid: localCollectionStates });

								const mutationKey = `update_${localCollectionStates}_items`;

								const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
									mutation: {
										[mutationKey]: {
											__args: {
												ids: stateIDs2,
												data: { country_id: newCountry2 },
											},
											id: true,
										},
									},
								});

								const wsMessagesGqlCountries = await ws.getMessages(1, { uid: localCollectionCountries });
								const wsMessagesGqlStates = await ws.getMessages(1, { uid: localCollectionStates });
								ws.conn.close();
								const wsGqlMessagesGqlCountries = await wsGql.getMessages(1, { uid: localCollectionCountries });
								const wsGqlMessagesGqlStates = await wsGql.getMessages(count - 1, { uid: localCollectionStates });
								wsGql.client.dispose();

								// Assert
								expect(response.statusCode).toBe(200);
								expect(response.body.data.length).toBe(count);

								expect(gqlResponse.statusCode).toBe(200);
								expect(gqlResponse.body.data[mutationKey].length).toEqual(count);

								for (const { messagesCountries, messagesStates } of [
									{ messagesCountries: wsMessagesCountries, messagesStates: wsMessagesStates },
									{ messagesCountries: wsMessagesGqlCountries, messagesStates: wsMessagesGqlStates },
								]) {
									expect(messagesCountries?.length).toBe(1);
									expect(messagesStates?.length).toBe(1);

									expect(messagesCountries![0]).toMatchObject({
										type: 'subscription',
										event: 'create',
										data: [
											{
												id: expect.anything(),
												name: expect.anything(),
											},
										],
									});

									expect(messagesStates![0]).toMatchObject({
										type: 'subscription',
										event: 'update',
										data: expect.arrayContaining([
											expect.objectContaining({
												id: expect.anything(),
												name: expect.any(String),
												country_id: expect.anything(),
											}),
										]),
									});
								}

								for (const { messagesCountries, messagesStates } of [
									{ messagesCountries: wsGqlMessagesCountries, messagesStates: wsGqlMessagesStates },
									{ messagesCountries: wsGqlMessagesGqlCountries, messagesStates: wsGqlMessagesGqlStates },
								]) {
									expect(messagesCountries?.length).toBe(1);
									expect(messagesStates?.length).toBe(count - 1);

									expect(messagesCountries![0]).toEqual({
										data: {
											[subscriptionKeyCountries]: {
												event: 'create',
												data: {
													id: expect.anything(),
													name: expect.any(String),
												},
											},
										},
									});

									for (let i = 0; i < count - 1; i++) {
										expect(messagesStates![i]).toEqual({
											data: {
												[subscriptionKeyStates]: {
													event: 'update',
													data: {
														id: expect.anything(),
														name: expect.any(String),
														country_id: {
															id: expect.anything(),
														},
													},
												},
											},
										});
									}
								}
							},
							120_000,
						);
					});

					describe('errors when above limit', () => {
						it.each(vendors)(
							'%s',
							async (vendor) => {
								// Setup
								const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']);
								const stateIDs = [];
								const stateIDs2 = [];
								const newCountry = createCountry(pkType);

								for (let i = 0; i < count; i++) {
									const state: any = createState(pkType);
									state.country_id = createCountry(pkType);
									stateIDs.push((await CreateItem(vendor, { collection: localCollectionStates, item: state })).id);

									const state2: any = createState(pkType);
									state2.country_id = createCountry(pkType);
									stateIDs2.push((await CreateItem(vendor, { collection: localCollectionStates, item: state2 })).id);
								}

								const ws = createWebSocketConn(getUrl(vendor), {
									auth: { access_token: USER.ADMIN.TOKEN },
								});

								await ws.subscribe({ collection: localCollectionCountries, uid: localCollectionCountries });
								await ws.subscribe({ collection: localCollectionStates, uid: localCollectionStates });

								const wsGql = createWebSocketGql(getUrl(vendor), {
									auth: { access_token: USER.ADMIN.TOKEN },
								});

								await wsGql.subscribe({
									collection: localCollectionCountries,
									jsonQuery: {
										event: true,
										data: {
											id: true,
											name: true,
										},
									},
									uid: localCollectionCountries,
								});

								await wsGql.subscribe({
									collection: localCollectionStates,
									jsonQuery: {
										event: true,
										data: {
											id: true,
											name: true,
											country_id: {
												id: true,
											},
										},
									},
									uid: localCollectionStates,
								});

								// Action
								const response = await request(getUrl(vendor))
									.patch(`/items/${localCollectionStates}`)
									.send({ keys: stateIDs, data: { country_id: newCountry } })
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

								const mutationKey = `update_${localCollectionStates}_items`;

								const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
									mutation: {
										[mutationKey]: {
											__args: {
												ids: stateIDs2,
												data: { country_id: newCountry },
											},
											id: true,
										},
									},
								});

								ws.conn.close();
								wsGql.client.dispose();

								// Assert
								expect(response.statusCode).toBe(400);
								expect(response.body.errors).toBeDefined();

								expect(response.body.errors[0].message).toBe(
									`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
								);

								expect(gqlResponse.statusCode).toBe(200);
								expect(gqlResponse.body.errors).toBeDefined();

								expect(gqlResponse.body.errors[0].message).toBe(
									`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
								);

								expect(ws.getMessageCount(localCollectionCountries)).toBe(1);
								expect(ws.getMessageCount(localCollectionStates)).toBe(1);
								expect(wsGql.getMessageCount(localCollectionCountries)).toBe(0);
								expect(wsGql.getMessageCount(localCollectionStates)).toBe(0);
							},
							120000,
						);
					});
				});
			});

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionCountries}`,
					token: USER.ADMIN.TOKEN,
				},
				localCollectionCountries,
				getTestsSchema(pkType)[localCollectionCountries],
				vendorSchemaValues,
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionStates}`,
					token: USER.ADMIN.TOKEN,
				},
				localCollectionStates,
				getTestsSchema(pkType)[localCollectionStates],
				vendorSchemaValues,
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionCities}`,
					token: USER.ADMIN.TOKEN,
				},
				localCollectionCities,
				getTestsSchema(pkType)[localCollectionCities],
				vendorSchemaValues,
			);
		});

		describe('Meta Service Tests', () => {
			describe('retrieves filter count correctly', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const name = 'test-meta-service-count';
					const country = createCountry(pkType);
					const country2 = createCountry(pkType);

					country.name = name;
					country2.name = name;

					const insertedCountry = await CreateItem(vendor, {
						collection: localCollectionCountries,
						item: country,
					});

					const insertedCountry2 = await CreateItem(vendor, {
						collection: localCollectionCountries,
						item: country2,
					});

					const state = createState(pkType);
					const state2 = createState(pkType);

					state.name = name;
					state2.name = name;
					state.country_id = insertedCountry.id;
					state2.country_id = insertedCountry2.id;

					await CreateItem(vendor, {
						collection: localCollectionStates,
						item: [state, state2],
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionStates}`)
						.query({
							filter: JSON.stringify({
								name: { _eq: name },
								country_id: {
									name: {
										_eq: name,
									},
								},
							}),
							meta: '*',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.meta.filter_count).toBe(2);
					expect(response.body.data.length).toBe(2);
				});
			});
		});

		test('Auto Increment Tests', (ctx) => {
			if (pkType !== 'integer') ctx.skip();

			describe('updates the auto increment value correctly', () => {
				it.each(without(vendors, 'cockroachdb', 'mssql', 'oracle'))('%s', async (vendor) => {
					// Setup
					const name = 'test-auto-increment-m2o';
					const largeIdCity = 102222;
					const largeIdState = 103333;
					const largeIdCountry = 104444;
					const city = createCity(pkType);
					const city2 = createCity(pkType);
					const state = createState(pkType);
					const state2 = createState(pkType);
					const country = createCountry(pkType);
					const country2 = createCountry(pkType);

					city.id = largeIdCity;
					state.id = largeIdState;
					country.id = largeIdCountry;
					city.name = name;
					city2.name = name;
					state.name = name;
					state2.name = name;
					country.name = name;
					country2.name = name;

					await CreateItem(vendor, {
						collection: localCollectionCities,
						item: [
							{
								...city,
								state_id: {
									...state,
									country_id: country,
								},
							},
							{
								...city2,
								state_id: {
									...state2,
									country_id: country2,
								},
							},
						],
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionCities}`)
						.query({
							filter: JSON.stringify({
								name: { _eq: name },
							}),
							fields: 'id,state_id.id,state_id.country_id.id',
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data.length).toBe(2);

					expect(response.body.data.map((city: any) => city.id)).toEqual(
						Array.from({ length: 2 }, (_, index) => largeIdCity + index),
					);

					expect(response.body.data.map((city: any) => city.state_id.id)).toEqual(
						Array.from({ length: 2 }, (_, index) => largeIdState + index),
					);

					expect(response.body.data.map((city: any) => city.state_id.country_id.id)).toEqual(
						Array.from({ length: 2 }, (_, index) => largeIdCountry + index),
					);
				});
			});
		});
	});
});
