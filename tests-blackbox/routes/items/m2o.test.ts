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
	getTestsSchema,
	seedDBValues,
} from './m2o.seed';
import { CheckQueryFilters } from '@query/filter';
import { requestGraphQL } from '@common/index';

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

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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
						expect(response.body.data[0]).toMatchObject({ name: states[0].name });
						expect(response2.statusCode).toEqual(200);
						expect(response2.body.data.length).toBe(1);
						expect(response2.body.data[0]).toMatchObject({ name: states[1].name });

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionStates].length).toBe(1);
						expect(gqlResponse.body.data[localCollectionStates][0]).toMatchObject({
							name: states[0].name,
						});
						expect(gqlResponse2.statusCode).toBe(200);
						expect(gqlResponse2.body.data[localCollectionStates].length).toBe(1);
						expect(gqlResponse2.body.data[localCollectionStates][0]).toMatchObject({
							name: states[1].name,
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

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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
						expect(response.body.data[0]).toMatchObject({ name: states[0].name });
						expect(response2.statusCode).toEqual(200);
						expect(response2.body.data.length).toBe(1);
						expect(response2.body.data[0]).toMatchObject({ name: states[1].name });

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionStates].length).toBe(1);
						expect(gqlResponse.body.data[localCollectionStates][0]).toMatchObject({
							name: states[0].name,
						});
						expect(gqlResponse2.statusCode).toBe(200);
						expect(gqlResponse2.body.data[localCollectionStates].length).toBe(1);
						expect(gqlResponse2.body.data[localCollectionStates][0]).toMatchObject({
							name: states[1].name,
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
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-name',
									filter: { name: { _starts_with: 'state-m2o-top-sort-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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
								gqlResponse2.body.data[localCollectionStates].reverse()
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
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-name',
									filter: { name: { _starts_with: 'state-m2o-top-sort-' } },
									limit,
									fields: 'name',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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
								})
							).toEqual(expectedAsc);
							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.name.slice(-1));
								})
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates]).not.toEqual(
								gqlResponse2.body.data[localCollectionStates]
							);
							expect(
								gqlResponse.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.name.slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								gqlResponse2.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.name.slice(-1));
								})
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
								state.name = 'state-m2o-sort-' + uuid();
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
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-country_id.name',
									filter: { name: { _starts_with: 'state-m2o-sort-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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
								gqlResponse2.body.data[localCollectionStates].reverse()
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
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-country_id.name',
									filter: { name: { _starts_with: 'state-m2o-sort-' } },
									limit,
									fields: 'country_id.name',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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
								})
							).toEqual(expectedAsc);
							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.country_id.name.slice(-1));
								})
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates]).not.toEqual(
								gqlResponse2.body.data[localCollectionStates]
							);
							expect(
								gqlResponse.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.country_id.name.slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								gqlResponse2.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.country_id.name.slice(-1));
								})
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
								state.name = 'state-m2o-top-sort-fn-' + uuid();
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
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-year(test_datetime)',
									filter: { name: { _starts_with: 'state-m2o-top-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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
								gqlResponse2.body.data[localCollectionStates].reverse()
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
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-year(test_datetime)',
									filter: { name: { _starts_with: 'state-m2o-top-sort-fn-' } },
									limit,
									fields: 'year(test_datetime)',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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
								})
							).toEqual(expectedAsc);
							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.test_datetime_year.toString().slice(-1));
								})
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates]).not.toEqual(
								gqlResponse2.body.data[localCollectionStates]
							);
							expect(
								gqlResponse.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.test_datetime_func.year.toString().slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								gqlResponse2.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.test_datetime_func.year.toString().slice(-1));
								})
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
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-country_id.year(test_datetime)',
									filter: { name: { _starts_with: 'state-m2o-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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
								gqlResponse2.body.data[localCollectionStates].reverse()
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
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionStates}`)
								.query({
									sort: '-country_id.year(test_datetime)',
									filter: { name: { _starts_with: 'state-m2o-sort-fn-' } },
									limit,
									fields: 'country_id.year(test_datetime)',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
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
								})
							).toEqual(expectedAsc);
							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.country_id.test_datetime_year.toString().slice(-1));
								})
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionStates]).not.toEqual(
								gqlResponse2.body.data[localCollectionStates]
							);
							expect(
								gqlResponse.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.country_id.test_datetime_func.year.toString().slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								gqlResponse2.body.data[localCollectionStates].map((item: any) => {
									return parseInt(item.country_id.test_datetime_func.year.toString().slice(-1));
								})
							).toEqual(expectedDesc);
						});
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
	});
});
