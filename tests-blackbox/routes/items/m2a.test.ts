import request from 'supertest';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { v4 as uuid } from 'uuid';
import { CreateItem, ReadItem } from '@common/functions';
import { CachedTestsSchema, TestsSchemaVendorValues } from '@query/filter';
import * as common from '@common/index';
import {
	collectionShapes,
	collectionCircles,
	collectionSquares,
	Shape,
	Circle,
	Square,
	getTestsSchema,
	seedDBValues,
} from './m2a.seed';
import { CheckQueryFilters } from '@query/filter';
import { findIndex } from 'lodash';
import { requestGraphQL } from '@common/index';

function createShape(pkType: common.PrimaryKeyType) {
	const item: Shape = {
		name: 'shape-' + uuid(),
	};

	if (pkType === 'string') {
		item.id = 'shape-' + uuid();
	}

	return item;
}

function createCircle(pkType: common.PrimaryKeyType) {
	const item: Circle = {
		name: 'circle-' + uuid(),
		radius: common.SeedFunctions.generateValues.float({ quantity: 1 })[0],
	};

	if (pkType === 'string') {
		item.id = 'circle-' + uuid();
	}

	return item;
}

function createSquare(pkType: common.PrimaryKeyType) {
	const item: Square = {
		name: 'square-' + uuid(),
		width: common.SeedFunctions.generateValues.float({ quantity: 1 })[0],
	};

	if (pkType === 'string') {
		item.id = 'square-' + uuid();
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
	const localCollectionShapes = `${collectionShapes}_${pkType}`;
	const localCollectionCircles = `${collectionCircles}_${pkType}`;
	const localCollectionSquares = `${collectionSquares}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('GET /:collection/:id', () => {
			describe(`retrieves a shape's circle`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const shape = createShape(pkType);
					const insertedShape = await CreateItem(vendor, {
						collection: localCollectionShapes,
						item: {
							...shape,
							children: {
								create: [{ collection: localCollectionCircles, item: createCircle(pkType) }],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionShapes}/${insertedShape.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[localCollectionShapes]: {
								__args: {
									filter: {
										id: {
											_eq: insertedShape.id,
										},
									},
								},
								children: {
									item: {
										__on: [
											{
												__typeName: localCollectionCircles,
												id: true,
											},
											{
												__typeName: localCollectionSquares,
												id: true,
											},
										],
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.children).toHaveLength(1);
					expect(gqlResponse.statusCode).toEqual(200);
					expect(gqlResponse.body.data[localCollectionShapes][0].children).toHaveLength(1);
				});
			});
		});

		describe('GET /:collection', () => {
			describe('filters', () => {
				describe('on top level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const shape = createShape(pkType);
						shape.name = 'shape-m2a-top-' + uuid();
						const insertedShape = await CreateItem(vendor, {
							collection: localCollectionShapes,
							item: shape,
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionShapes}`)
							.query({
								filter: { id: { _eq: insertedShape.id } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionShapes}`)
							.query({
								filter: { name: { _eq: insertedShape.name } },
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionShapes]: {
									__args: {
										filter: {
											id: {
												_eq: insertedShape.id,
											},
										},
									},
									id: true,
								},
							},
						});

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionShapes]: {
									__args: {
										filter: {
											name: {
												_eq: insertedShape.name,
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
						expect(response.body.data[0]).toMatchObject({ id: insertedShape.id });
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data);

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionShapes].length).toBe(1);
						expect(gqlResponse.body.data[localCollectionShapes][0]).toMatchObject({
							id: String(insertedShape.id),
						});
						expect(gqlResponse2.statusCode).toBe(200);
						expect(gqlResponse.body.data).toEqual(gqlResponse2.body.data);
					});
				});

				describe('on m2a level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const circle = createCircle(pkType);
						circle.name = 'circle-m2a-' + uuid();
						const square = createSquare(pkType);
						square.name = 'square-m2a-' + uuid();
						const shape = createShape(pkType);
						shape.name = 'shape-m2a-' + uuid();
						const insertedShape = await CreateItem(vendor, {
							collection: localCollectionShapes,
							item: {
								...shape,
								children: {
									create: [
										{ collection: localCollectionCircles, item: circle },
										{ collection: localCollectionSquares, item: square },
									],
									update: [],
									delete: [],
								},
							},
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionShapes}`)
							.query({
								filter: JSON.stringify({
									children: {
										[`item:${localCollectionCircles}`]: {
											name: { _eq: circle.name },
										},
									},
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionShapes}`)
							.query({
								filter: JSON.stringify({
									children: {
										[`item:${localCollectionSquares}`]: {
											width: { _eq: square.width },
										},
									},
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionShapes]: {
									__args: {
										filter: {
											children: {
												[`item__${localCollectionCircles}`]: {
													name: { _eq: circle.name },
												},
											},
										},
									},
									id: true,
								},
							},
						});

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionShapes]: {
									__args: {
										filter: {
											children: {
												[`item__${localCollectionSquares}`]: {
													width: { _eq: square.width },
												},
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
						expect(response.body.data[0]).toMatchObject({ id: insertedShape.id });
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data);

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionShapes].length).toBe(1);
						expect(gqlResponse.body.data[localCollectionShapes][0]).toMatchObject({
							id: String(insertedShape.id),
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
						const circle = createCircle(pkType);
						circle.name = 'circle-m2a-top-fn-' + uuid();
						const square = createSquare(pkType);
						square.name = 'square-m2a-top-fn-' + uuid();
						const shape = createShape(pkType);
						shape.name = 'shape-m2a-top-fn-' + uuid();
						const insertedShape = await CreateItem(vendor, {
							collection: localCollectionShapes,
							item: {
								...shape,
								children: {
									create: [{ collection: localCollectionCircles, item: circle }],
									update: [],
									delete: [],
								},
							},
						});

						const shape2 = createShape(pkType);
						shape2.name = 'shape-m2a-top-fn-' + uuid();
						const insertedShape2 = await CreateItem(vendor, {
							collection: localCollectionShapes,
							item: {
								...shape2,
								children: {
									create: [
										{ collection: localCollectionCircles, item: circle },
										{ collection: localCollectionSquares, item: square },
									],
									update: [],
									delete: [],
								},
							},
						});

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionShapes}`)
							.query({
								filter: JSON.stringify({
									_and: [{ name: { _starts_with: 'shape-m2a-top-fn-' } }, { 'count(children)': { _eq: 1 } }],
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionShapes}`)
							.query({
								filter: JSON.stringify({
									_and: [{ name: { _starts_with: 'shape-m2a-top-fn-' } }, { 'count(children)': { _eq: 2 } }],
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionShapes]: {
									__args: {
										filter: {
											_and: [
												{
													name: { _starts_with: 'shape-m2a-top-fn-' },
												},
												{ children_func: { count: { _eq: 1 } } },
											],
										},
									},
									id: true,
									children: {
										id: true,
									},
								},
							},
						});

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionShapes]: {
									__args: {
										filter: {
											_and: [
												{
													name: { _starts_with: 'shape-m2a-top-fn-' },
												},
												{ children_func: { count: { _eq: 2 } } },
											],
										},
									},
									id: true,
									children: {
										id: true,
									},
								},
							},
						});

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: insertedShape.id });
						expect(response.body.data[0].children.length).toBe(1);
						expect(response2.statusCode).toEqual(200);
						expect(response2.body.data.length).toBe(1);
						expect(response2.body.data[0]).toMatchObject({ id: insertedShape2.id });
						expect(response2.body.data[0].children.length).toBe(2);

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionShapes].length).toBe(1);
						expect(gqlResponse.body.data[localCollectionShapes][0]).toMatchObject({
							id: String(insertedShape.id),
						});
						expect(gqlResponse.body.data[localCollectionShapes][0].children.length).toBe(1);
						expect(gqlResponse2.statusCode).toBe(200);
						expect(gqlResponse2.body.data[localCollectionShapes].length).toBe(1);
						expect(gqlResponse2.body.data[localCollectionShapes][0]).toMatchObject({
							id: String(insertedShape2.id),
						});
						expect(gqlResponse2.body.data[localCollectionShapes][0].children.length).toBe(2);
					});
				});

				describe('on m2a level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const years = [2002, 2007];
						const retrievedShapes = [];

						for (const year of years) {
							const circle = createCircle(pkType);
							circle.name = 'circle-m2a-fn-' + uuid();
							circle.test_datetime = new Date(new Date().setFullYear(year)).toISOString().slice(0, 19);
							const shape = createShape(pkType);
							shape.name = 'shape-m2a-fn-' + uuid();
							const insertedShape = await CreateItem(vendor, {
								collection: localCollectionShapes,
								item: {
									...shape,
									children: {
										create: [{ collection: localCollectionCircles, item: circle }],
										update: [],
										delete: [],
									},
								},
							});

							const retrievedShape = await ReadItem(vendor, {
								collection: localCollectionShapes,
								fields: '*.*.*',
								filter: { id: { _eq: insertedShape.id } },
							});

							retrievedShapes.push(retrievedShape);
						}

						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionShapes}`)
							.query({
								filter: JSON.stringify({
									_and: [
										{ name: { _starts_with: 'shape-m2a-fn-' } },
										{
											children: {
												[`item:${localCollectionCircles}`]: {
													'year(test_datetime)': {
														_eq: years[0],
													},
												},
											},
										},
									],
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionShapes}`)
							.query({
								filter: JSON.stringify({
									_and: [
										{ name: { _starts_with: 'shape-m2a-fn-' } },
										{
											children: {
												[`item:${localCollectionCircles}`]: {
													'year(test_datetime)': {
														_eq: years[1],
													},
												},
											},
										},
									],
								}),
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionShapes]: {
									__args: {
										filter: {
											_and: [
												{ name: { _starts_with: 'shape-m2a-fn-' } },
												{
													children: {
														[`item__${localCollectionCircles}`]: {
															test_datetime_func: {
																year: {
																	_eq: years[0],
																},
															},
														},
													},
												},
											],
										},
									},
									id: true,
								},
							},
						});

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionShapes]: {
									__args: {
										filter: {
											_and: [
												{ name: { _starts_with: 'shape-m2a-fn-' } },
												{
													children: {
														[`item__${localCollectionCircles}`]: {
															test_datetime_func: {
																year: {
																	_eq: years[1],
																},
															},
														},
													},
												},
											],
										},
									},
									id: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: retrievedShapes[0][0].id });
						expect(response2.statusCode).toEqual(200);
						expect(response2.body.data.length).toBe(1);
						expect(response2.body.data[0]).toMatchObject({ id: retrievedShapes[1][0].id });

						expect(gqlResponse.statusCode).toBe(200);
						expect(gqlResponse.body.data[localCollectionShapes].length).toBe(1);
						expect(gqlResponse.body.data[localCollectionShapes][0]).toMatchObject({
							id: String(retrievedShapes[0][0].id),
						});
						expect(gqlResponse2.statusCode).toBe(200);
						expect(gqlResponse2.body.data[localCollectionShapes].length).toBe(1);
						expect(gqlResponse2.body.data[localCollectionShapes][0]).toMatchObject({
							id: String(retrievedShapes[1][0].id),
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
							const shapes = [];

							for (const val of sortValues) {
								const shape = createShape(pkType);
								shape.name = 'shape-m2a-top-sort-' + val;
								shapes.push(shape);
							}

							await CreateItem(vendor, {
								collection: localCollectionShapes,
								item: shapes,
							});
						}
					});

					describe('without limit', () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: 'name',
									filter: { name: { _starts_with: 'shape-m2a-top-sort-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: '-name',
									filter: { name: { _starts_with: 'shape-m2a-top-sort-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: 'name',
											filter: { name: { _starts_with: 'shape-m2a-top-sort-' } },
										},
										id: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: '-name',
											filter: { name: { _starts_with: 'shape-m2a-top-sort-' } },
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
							expect(gqlResponse.body.data[localCollectionShapes].length).toBe(5);
							expect(gqlResponse2.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionShapes]).toEqual(
								gqlResponse2.body.data[localCollectionShapes].reverse()
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
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: 'name',
									filter: { name: { _starts_with: 'shape-m2a-top-sort-' } },
									limit,
									fields: 'name',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: '-name',
									filter: { name: { _starts_with: 'shape-m2a-top-sort-' } },
									limit,
									fields: 'name',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: 'name',
											filter: { name: { _starts_with: 'shape-m2a-top-sort-' } },
											limit,
										},
										id: true,
										name: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: '-name',
											filter: { name: { _starts_with: 'shape-m2a-top-sort-' } },
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
							expect(gqlResponse.body.data[localCollectionShapes].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionShapes]).not.toEqual(
								gqlResponse2.body.data[localCollectionShapes]
							);
							expect(gqlResponse.body.data[localCollectionShapes]).not.toEqual(
								gqlResponse2.body.data[localCollectionShapes]
							);
							expect(
								gqlResponse.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.name.slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								gqlResponse2.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.name.slice(-1));
								})
							).toEqual(expectedDesc);
						});
					});
				});

				describe('on m2a level', () => {
					beforeAll(async () => {
						for (const vendor of vendors) {
							// Setup
							const sortValues = [4, 2, 3, 5, 1];

							for (const val of sortValues) {
								const circle = createCircle(pkType);
								circle.name = 'circle-m2a-sort-' + val;
								const shape = createShape(pkType);
								shape.name = 'shape-m2a-sort-' + uuid();
								await CreateItem(vendor, {
									collection: localCollectionShapes,
									item: {
										...shape,
										children: {
											create: [{ collection: localCollectionCircles, item: circle }],
											update: [],
											delete: [],
										},
									},
								});
							}
						}
					});

					describe('without limit', () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: `children.item:${localCollectionCircles}.name`,
									filter: { name: { _starts_with: 'shape-m2a-sort-' } },
									fields: '*.*.*',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: `-children.item:${localCollectionCircles}.name`,
									filter: { name: { _starts_with: 'shape-m2a-sort-' } },
									fields: '*.*.*',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: `children.item:${localCollectionCircles}.name`,
											filter: { name: { _starts_with: 'shape-m2a-sort-' } },
										},
										id: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: `-children.item:${localCollectionCircles}.name`,
											filter: { name: { _starts_with: 'shape-m2a-sort-' } },
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response2.statusCode).toEqual(200);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse2.statusCode).toEqual(200);

							// Oddity in MySQL5, looks to be indexing delays resulting in missing values
							if (vendor === 'mysql5') {
								let lastIndex = -1;
								for (const item of response2.body.data.reverse()) {
									const foundIndex = findIndex(response.body.data, { id: item.id });
									if (foundIndex === -1) continue;

									expect(foundIndex).toBeGreaterThan(lastIndex);

									if (foundIndex > lastIndex) {
										lastIndex = foundIndex;
									}
								}

								lastIndex = -1;
								for (const item of gqlResponse2.body.data[localCollectionShapes].reverse()) {
									const foundIndex = findIndex(gqlResponse.body.data[localCollectionShapes], { id: item.id });
									if (foundIndex === -1) continue;

									expect(foundIndex).toBeGreaterThan(lastIndex);

									if (foundIndex > lastIndex) {
										lastIndex = foundIndex;
									}
								}
								return;
							}

							expect(response.body.data.length).toBe(5);
							expect(response.body.data).toEqual(response2.body.data.reverse());

							expect(gqlResponse.body.data[localCollectionShapes].length).toBe(5);
							expect(gqlResponse.body.data[localCollectionShapes]).toEqual(
								gqlResponse2.body.data[localCollectionShapes].reverse()
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
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: `children.item:${localCollectionCircles}.name`,
									filter: { name: { _starts_with: 'shape-m2a-sort-' } },
									limit,
									fields: '*.*.*',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: `-children.item:${localCollectionCircles}.name`,
									filter: { name: { _starts_with: 'shape-m2a-sort-' } },
									limit,
									fields: '*.*.*',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: `children.item:${localCollectionCircles}.name`,
											filter: { name: { _starts_with: 'shape-m2a-sort-' } },
											limit,
										},
										id: true,
										children: {
											item: {
												__on: {
													__typeName: localCollectionCircles,
													id: true,
													name: true,
												},
											},
										},
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: `-children.item:${localCollectionCircles}.name`,
											filter: { name: { _starts_with: 'shape-m2a-sort-' } },
											limit,
										},
										id: true,
										children: {
											item: {
												__on: {
													__typeName: localCollectionCircles,
													id: true,
													name: true,
												},
											},
										},
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response2.statusCode).toEqual(200);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse2.statusCode).toEqual(200);

							// Oddity in MySQL5, looks to be indexing delays resulting in missing values
							if (vendor === 'mysql5') {
								for (const data of [
									{ response: response.body.data, expected: expectedAsc },
									{ response: response2.body.data, expected: expectedDesc },
								]) {
									expect(data.response.length).toBeLessThanOrEqual(expectedLength);

									let lastIndex = -1;
									for (const item of data.response) {
										const foundIndex = data.expected.indexOf(parseInt(item.children[0].item.name.slice(-1)));

										expect(foundIndex).toBeGreaterThan(lastIndex);

										if (foundIndex > lastIndex) {
											lastIndex = foundIndex;
										}
									}
								}

								for (const data of [
									{ response: gqlResponse.body.data[localCollectionShapes], expected: expectedAsc },
									{ response: gqlResponse2.body.data[localCollectionShapes], expected: expectedDesc },
								]) {
									expect(data.response.length).toBeLessThanOrEqual(expectedLength);

									let lastIndex = -1;
									for (const item of data.response) {
										const foundIndex = data.expected.indexOf(parseInt(item.children[0].item.name.slice(-1)));

										expect(foundIndex).toBeGreaterThan(lastIndex);

										if (foundIndex > lastIndex) {
											lastIndex = foundIndex;
										}
									}
								}

								return;
							}

							expect(response.body.data.length).toBe(expectedLength);
							expect(response.body.data).not.toEqual(response2.body.data);
							expect(
								response.body.data.map((item: any) => {
									return parseInt(item.children[0].item.name.slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.children[0].item.name.slice(-1));
								})
							).toEqual(expectedDesc);

							expect(gqlResponse.body.data[localCollectionShapes].length).toBe(expectedLength);
							expect(gqlResponse.body.data[localCollectionShapes]).not.toEqual(
								gqlResponse2.body.data[localCollectionShapes]
							);
							expect(
								gqlResponse.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.children[0].item.name.slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								gqlResponse2.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.children[0].item.name.slice(-1));
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
							const shapes = [];

							for (const val of sortValues) {
								const shape = createShape(pkType);
								shape.name = 'shape-m2a-top-sort-fn-' + uuid();
								shape.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`)))
									.toISOString()
									.slice(0, 19);
								shapes.push(shape);
							}

							await CreateItem(vendor, {
								collection: localCollectionShapes,
								item: shapes,
							});
						}
					});

					describe('without limit', () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: 'year(test_datetime)',
									filter: { name: { _starts_with: 'shape-m2a-top-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: '-year(test_datetime)',
									filter: { name: { _starts_with: 'shape-m2a-top-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: 'year(test_datetime)',
											filter: { name: { _starts_with: 'shape-m2a-top-sort-fn-' } },
										},
										id: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: '-year(test_datetime)',
											filter: { name: { _starts_with: 'shape-m2a-top-sort-fn-' } },
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
							expect(gqlResponse.body.data[localCollectionShapes].length).toBe(5);
							expect(gqlResponse2.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionShapes]).toEqual(
								gqlResponse2.body.data[localCollectionShapes].reverse()
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
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: 'year(test_datetime)',
									filter: { name: { _starts_with: 'shape-m2a-top-sort-fn-' } },
									limit,
									fields: 'year(test_datetime)',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: '-year(test_datetime)',
									filter: { name: { _starts_with: 'shape-m2a-top-sort-fn-' } },
									limit,
									fields: 'year(test_datetime)',
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: 'year(test_datetime)',
											filter: { name: { _starts_with: 'shape-m2a-top-sort-fn-' } },
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
									[localCollectionShapes]: {
										__args: {
											sort: '-year(test_datetime)',
											filter: { name: { _starts_with: 'shape-m2a-top-sort-fn-' } },
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
							expect(gqlResponse.body.data[localCollectionShapes].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionShapes]).not.toEqual(
								gqlResponse2.body.data[localCollectionShapes]
							);
							expect(
								gqlResponse.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.test_datetime_func.year.toString().slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								gqlResponse2.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.test_datetime_func.year.toString().slice(-1));
								})
							).toEqual(expectedDesc);
						});
					});
				});

				describe('on m2a level', () => {
					beforeAll(async () => {
						for (const vendor of vendors) {
							// Setup
							const sortValues = [4, 2, 3, 5, 1];

							for (const val of sortValues) {
								const circle = createCircle(pkType);
								circle.name = 'circle-m2a-sort-fn-' + uuid();
								circle.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`)))
									.toISOString()
									.slice(0, 19);
								const shape = createCircle(pkType);
								shape.name = 'shape-m2a-sort-fn-' + uuid();
								await CreateItem(vendor, {
									collection: localCollectionShapes,
									item: {
										...shape,
										children: {
											create: [{ collection: localCollectionCircles, item: circle }],
											update: [],
											delete: [],
										},
									},
								});
							}
						}
					});

					describe('without limit', () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: `children.item:${localCollectionCircles}.year(test_datetime)`,
									filter: { name: { _starts_with: 'shape-m2a-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: `-children.item:${localCollectionCircles}.year(test_datetime)`,
									filter: { name: { _starts_with: 'shape-m2a-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: `children.item:${localCollectionCircles}.year(test_datetime)`,
											filter: { name: { _starts_with: 'shape-m2a-sort-fn-' } },
										},
										id: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: `-children.item:${localCollectionCircles}.year(test_datetime)`,
											filter: { name: { _starts_with: 'shape-m2a-sort-fn-' } },
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response2.statusCode).toEqual(200);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse2.statusCode).toEqual(200);

							// Oddity in MySQL5, looks to be indexing delays resulting in missing values
							if (vendor === 'mysql5') {
								let lastIndex = -1;
								for (const item of response2.body.data.reverse()) {
									const foundIndex = findIndex(response.body.data, { id: item.id });
									if (foundIndex === -1) continue;

									expect(foundIndex).toBeGreaterThan(lastIndex);

									if (foundIndex > lastIndex) {
										lastIndex = foundIndex;
									}
								}

								lastIndex = -1;
								for (const item of gqlResponse2.body.data[localCollectionShapes].reverse()) {
									const foundIndex = findIndex(gqlResponse.body.data[localCollectionShapes], { id: item.id });
									if (foundIndex === -1) continue;

									expect(foundIndex).toBeGreaterThan(lastIndex);

									if (foundIndex > lastIndex) {
										lastIndex = foundIndex;
									}
								}
								return;
							}

							expect(response.body.data.length).toBe(5);
							expect(response.body.data).toEqual(response2.body.data.reverse());

							expect(gqlResponse.body.data[localCollectionShapes].length).toBe(5);
							expect(gqlResponse.body.data[localCollectionShapes]).toEqual(
								gqlResponse2.body.data[localCollectionShapes].reverse()
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
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: `children.item:${localCollectionCircles}.year(test_datetime)`,
									filter: { name: { _starts_with: 'shape-m2a-sort-fn-' } },
									limit,
									fields: `children.item:${localCollectionCircles}.year(test_datetime)`,
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: `-children.item:${localCollectionCircles}.year(test_datetime)`,
									filter: { name: { _starts_with: 'shape-m2a-sort-fn-' } },
									limit,
									fields: `children.item:${localCollectionCircles}.year(test_datetime)`,
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: `children.item:${localCollectionCircles}.year(test_datetime)`,
											filter: { name: { _starts_with: 'shape-m2a-sort-fn-' } },
											limit,
										},
										id: true,
										children: {
											item: {
												__on: {
													__typeName: localCollectionCircles,
													id: true,
													test_datetime_func: {
														year: true,
													},
												},
											},
										},
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								query: {
									[localCollectionShapes]: {
										__args: {
											sort: `-children.item:${localCollectionCircles}.year(test_datetime)`,
											filter: { name: { _starts_with: 'shape-m2a-sort-fn-' } },
											limit,
										},
										id: true,
										children: {
											item: {
												__on: {
													__typeName: localCollectionCircles,
													id: true,
													test_datetime_func: {
														year: true,
													},
												},
											},
										},
									},
								},
							});

							// Assert
							expect(response.statusCode).toEqual(200);
							expect(response2.statusCode).toEqual(200);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse2.statusCode).toEqual(200);

							// Oddity in MySQL5, looks to be indexing delays resulting in missing values
							if (vendor === 'mysql5') {
								for (const data of [
									{ response: response.body.data, expected: expectedAsc },
									{ response: response2.body.data, expected: expectedDesc },
								]) {
									expect(data.response.length).toBeLessThanOrEqual(expectedLength);

									let lastIndex = -1;
									for (const item of data.response) {
										const foundIndex = data.expected.indexOf(
											parseInt(item.children[0].item.test_datetime_year.toString().slice(-1))
										);

										expect(foundIndex).toBeGreaterThan(lastIndex);

										if (foundIndex > lastIndex) {
											lastIndex = foundIndex;
										}
									}
								}

								for (const data of [
									{ response: gqlResponse.body.data[localCollectionShapes], expected: expectedAsc },
									{ response: gqlResponse2.body.data[localCollectionShapes], expected: expectedDesc },
								]) {
									expect(data.response.length).toBeLessThanOrEqual(expectedLength);

									let lastIndex = -1;
									for (const item of data.response) {
										const foundIndex = data.expected.indexOf(
											parseInt(item.children[0].item.test_datetime_func.year.toString().slice(-1))
										);

										expect(foundIndex).toBeGreaterThan(lastIndex);

										if (foundIndex > lastIndex) {
											lastIndex = foundIndex;
										}
									}
								}

								return;
							}

							expect(response.body.data.length).toBe(expectedLength);
							expect(response.body.data).not.toEqual(response2.body.data);
							expect(
								response.body.data.map((item: any) => {
									return parseInt(item.children[0].item.test_datetime_year.toString().slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.children[0].item.test_datetime_year.toString().slice(-1));
								})
							).toEqual(expectedDesc);

							expect(gqlResponse.body.data[localCollectionShapes].length).toBe(expectedLength);
							expect(gqlResponse.body.data[localCollectionShapes]).not.toEqual(
								gqlResponse2.body.data[localCollectionShapes]
							);
							expect(
								gqlResponse.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.children[0].item.test_datetime_func.year.toString().slice(-1));
								})
							).toEqual(expectedAsc);
							expect(
								gqlResponse2.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.children[0].item.test_datetime_func.year.toString().slice(-1));
								})
							).toEqual(expectedDesc);
						});
					});
				});
			});

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionShapes}`,
					token: common.USER.ADMIN.TOKEN,
				},
				localCollectionShapes,
				cachedSchema[pkType][localCollectionShapes],
				vendorSchemaValues
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionCircles}`,
					token: common.USER.ADMIN.TOKEN,
				},
				localCollectionCircles,
				cachedSchema[pkType][localCollectionCircles],
				vendorSchemaValues
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionSquares}`,
					token: common.USER.ADMIN.TOKEN,
				},
				localCollectionSquares,
				cachedSchema[pkType][localCollectionSquares],
				vendorSchemaValues
			);
		});
	});
});
