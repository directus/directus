import { randomUUID } from 'node:crypto';
import config, { getUrl } from '@common/config';
import { CreateItem, ReadItem } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { SeedFunctions } from '@common/seed-functions';
import { requestGraphQL } from '@common/transport';
import type { PrimaryKeyType } from '@common/types';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import { findIndex, without } from 'lodash-es';
import request from 'supertest';
import { beforeAll, describe, expect, it, test } from 'vitest';
import { type CachedTestsSchema, CheckQueryFilters, type TestsSchemaVendorValues } from '../../query/filter';
import {
	type Circle,
	collectionCircles,
	collectionShapes,
	collectionSquares,
	getTestsSchema,
	seedDBValues,
	type Shape,
	type Square,
} from './m2a.seed';

function createShape(pkType: PrimaryKeyType) {
	const item: Shape = {
		name: 'shape-' + randomUUID(),
	};

	if (pkType === 'string') {
		item.id = 'shape-' + randomUUID();
	}

	return item;
}

function createCircle(pkType: PrimaryKeyType) {
	const item: Circle = {
		name: 'circle-' + randomUUID(),
		radius: SeedFunctions.generateValues.float({ quantity: 1 })[0],
	};

	if (pkType === 'string') {
		item.id = 'circle-' + randomUUID();
	}

	return item;
}

function createSquare(pkType: PrimaryKeyType) {
	const item: Square = {
		name: 'square-' + randomUUID(),
		width: SeedFunctions.generateValues.float({ quantity: 1 })[0],
	};

	if (pkType === 'string') {
		item.id = 'square-' + randomUUID();
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
}, 300000);

describe('Seed Database Values', () => {
	it.each(vendors)('%s', async (vendor) => {
		// Assert
		expect(vendorSchemaValues[vendor]).toBeDefined();
	});
});

describe.each(PRIMARY_KEY_TYPES)('/items', (pkType) => {
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
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

			describe(`retrieves circles' radius only`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const shape = createShape(pkType);

					const insertedShape = await CreateItem(vendor, {
						collection: localCollectionShapes,
						item: {
							...shape,
							children: {
								create: [
									{ collection: localCollectionCircles, item: createCircle(pkType) },
									{ collection: localCollectionCircles, item: createCircle(pkType) },
									{ collection: localCollectionSquares, item: createSquare(pkType) },
									{ collection: localCollectionSquares, item: createSquare(pkType) },
								],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionShapes}/${insertedShape.id}`)
						.query({
							fields: `children.item:${localCollectionCircles}.radius`,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
												radius: true,
											},
										],
										__typename: true,
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.children).toHaveLength(4);

					for (const child of response.body.data.children) {
						if (typeof child.item === 'object') {
							expect(child.item).toEqual(
								expect.objectContaining({
									radius: expect.any(Number),
								}),
							);
						}
					}

					expect(gqlResponse.statusCode).toEqual(200);
					expect(gqlResponse.body.data[localCollectionShapes][0].children).toHaveLength(4);

					for (const child of gqlResponse.body.data[localCollectionShapes][0].children) {
						if (child.item.__typename === localCollectionCircles) {
							expect(child.item).toEqual(
								expect.objectContaining({
									radius: expect.any(Number),
									__typename: localCollectionCircles,
								}),
							);
						} else {
							expect(child.item).toEqual(
								expect.objectContaining({
									__typename: localCollectionSquares,
								}),
							);
						}
					}
				});
			});

			describe(`retrieves all fields in circles only`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const shape = createShape(pkType);

					const insertedShape = await CreateItem(vendor, {
						collection: localCollectionShapes,
						item: {
							...shape,
							children: {
								create: [
									{ collection: localCollectionCircles, item: createCircle(pkType) },
									{ collection: localCollectionCircles, item: createCircle(pkType) },
									{ collection: localCollectionSquares, item: createSquare(pkType) },
									{ collection: localCollectionSquares, item: createSquare(pkType) },
								],
								update: [],
								delete: [],
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionShapes}/${insertedShape.id}`)
						.query({
							fields: `children.item:${localCollectionCircles}.*`,
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
												name: true,
												radius: true,
											},
										],
										__typename: true,
									},
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.children).toHaveLength(4);

					for (const child of response.body.data.children) {
						if (typeof child.item === 'object') {
							expect(child.item).toEqual(
								expect.objectContaining({
									id: expect.anything(),
									name: expect.any(String),
									radius: expect.any(Number),
								}),
							);
						}
					}

					expect(gqlResponse.statusCode).toEqual(200);
					expect(gqlResponse.body.data[localCollectionShapes][0].children).toHaveLength(4);

					for (const child of gqlResponse.body.data[localCollectionShapes][0].children) {
						if (child.item.__typename === localCollectionCircles) {
							expect(child.item).toEqual(
								expect.objectContaining({
									id: expect.anything(),
									name: expect.any(String),
									radius: expect.any(Number),
									__typename: localCollectionCircles,
								}),
							);
						} else {
							expect(child.item).toEqual(
								expect.objectContaining({
									__typename: localCollectionSquares,
								}),
							);
						}
					}
				});
			});
		});

		describe('GET /:collection', () => {
			describe('filters', () => {
				describe('on top level', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const shape = createShape(pkType);
						shape.name = 'shape-m2a-top-' + randomUUID();

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
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionShapes}`)
							.query({
								filter: { name: { _eq: insertedShape.name } },
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
						circle.name = 'circle-m2a-' + randomUUID();
						const square = createSquare(pkType);
						square.name = 'square-m2a-' + randomUUID();
						const shape = createShape(pkType);
						shape.name = 'shape-m2a-' + randomUUID();

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
									name: { _eq: insertedShape.name },
									children: {
										[`item:${localCollectionCircles}`]: {
											name: { _eq: circle.name },
										},
									},
								}),
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionShapes}`)
							.query({
								filter: JSON.stringify({
									name: { _eq: insertedShape.name },
									children: {
										[`item:${localCollectionSquares}`]: {
											width: { _eq: square.width },
										},
									},
								}),
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
							query: {
								[localCollectionShapes]: {
									__args: {
										filter: {
											name: { _eq: insertedShape.name },
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

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
							query: {
								[localCollectionShapes]: {
									__args: {
										filter: {
											name: { _eq: insertedShape.name },
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
						circle.name = 'circle-m2a-top-fn-' + randomUUID();
						const square = createSquare(pkType);
						square.name = 'square-m2a-top-fn-' + randomUUID();
						const shape = createShape(pkType);
						shape.name = 'shape-m2a-top-fn-' + randomUUID();

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
						shape2.name = 'shape-m2a-top-fn-' + randomUUID();

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
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const response2 = await request(getUrl(vendor))
							.get(`/items/${localCollectionShapes}`)
							.query({
								filter: JSON.stringify({
									_and: [{ name: { _starts_with: 'shape-m2a-top-fn-' } }, { 'count(children)': { _eq: 2 } }],
								}),
							})
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
							circle.name = 'circle-m2a-fn-' + randomUUID();
							circle.test_datetime = new Date(new Date().setFullYear(year)).toISOString().slice(0, 19);
							const shape = createShape(pkType);
							shape.name = 'shape-m2a-fn-' + randomUUID();

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
								fields: ['*.*.*'],
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
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

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
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

						const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: '-name',
									filter: { name: { _starts_with: 'shape-m2a-top-sort-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								gqlResponse2.body.data[localCollectionShapes].reverse(),
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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: '-name',
									filter: { name: { _starts_with: 'shape-m2a-top-sort-' } },
									limit,
									fields: 'name',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								}),
							).toEqual(expectedAsc);

							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.name.slice(-1));
								}),
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionShapes].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);

							expect(gqlResponse.body.data[localCollectionShapes]).not.toEqual(
								gqlResponse2.body.data[localCollectionShapes],
							);

							expect(gqlResponse.body.data[localCollectionShapes]).not.toEqual(
								gqlResponse2.body.data[localCollectionShapes],
							);

							expect(
								gqlResponse.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.name.slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								gqlResponse2.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.name.slice(-1));
								}),
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
								shape.name = 'shape-m2a-sort-' + randomUUID();

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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: `-children.item:${localCollectionCircles}.name`,
									filter: { name: { _starts_with: 'shape-m2a-sort-' } },
									fields: '*.*.*',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								gqlResponse2.body.data[localCollectionShapes].reverse(),
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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: `-children.item:${localCollectionCircles}.name`,
									filter: { name: { _starts_with: 'shape-m2a-sort-' } },
									limit,
									fields: '*.*.*',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								}),
							).toEqual(expectedAsc);

							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.children[0].item.name.slice(-1));
								}),
							).toEqual(expectedDesc);

							expect(gqlResponse.body.data[localCollectionShapes].length).toBe(expectedLength);

							expect(gqlResponse.body.data[localCollectionShapes]).not.toEqual(
								gqlResponse2.body.data[localCollectionShapes],
							);

							expect(
								gqlResponse.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.children[0].item.name.slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								gqlResponse2.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.children[0].item.name.slice(-1));
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
							const shapes = [];

							for (const val of sortValues) {
								const shape = createShape(pkType);
								shape.name = 'shape-m2a-top-sort-fn-' + randomUUID();

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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: '-year(test_datetime)',
									filter: { name: { _starts_with: 'shape-m2a-top-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								gqlResponse2.body.data[localCollectionShapes].reverse(),
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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: '-year(test_datetime)',
									filter: { name: { _starts_with: 'shape-m2a-top-sort-fn-' } },
									limit,
									fields: 'year(test_datetime)',
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								}),
							).toEqual(expectedAsc);

							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.test_datetime_year.toString().slice(-1));
								}),
							).toEqual(expectedDesc);

							expect(gqlResponse.statusCode).toEqual(200);
							expect(gqlResponse.body.data[localCollectionShapes].length).toBe(expectedLength);
							expect(gqlResponse2.statusCode).toEqual(200);

							expect(gqlResponse.body.data[localCollectionShapes]).not.toEqual(
								gqlResponse2.body.data[localCollectionShapes],
							);

							expect(
								gqlResponse.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.test_datetime_func.year.toString().slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								gqlResponse2.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.test_datetime_func.year.toString().slice(-1));
								}),
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
								circle.name = 'circle-m2a-sort-fn-' + randomUUID();

								circle.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`)))
									.toISOString()
									.slice(0, 19);

								const shape = createCircle(pkType);
								shape.name = 'shape-m2a-sort-fn-' + randomUUID();

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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: `-children.item:${localCollectionCircles}.year(test_datetime)`,
									filter: { name: { _starts_with: 'shape-m2a-sort-fn-' } },
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
								gqlResponse2.body.data[localCollectionShapes].reverse(),
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
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.get(`/items/${localCollectionShapes}`)
								.query({
									sort: `-children.item:${localCollectionCircles}.year(test_datetime)`,
									filter: { name: { _starts_with: 'shape-m2a-sort-fn-' } },
									limit,
									fields: `children.item:${localCollectionCircles}.year(test_datetime)`,
								})
								.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, USER.ADMIN.TOKEN, {
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
											parseInt(item.children[0].item.test_datetime_year.toString().slice(-1)),
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
											parseInt(item.children[0].item.test_datetime_func.year.toString().slice(-1)),
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
								}),
							).toEqual(expectedAsc);

							expect(
								response2.body.data.map((item: any) => {
									return parseInt(item.children[0].item.test_datetime_year.toString().slice(-1));
								}),
							).toEqual(expectedDesc);

							expect(gqlResponse.body.data[localCollectionShapes].length).toBe(expectedLength);

							expect(gqlResponse.body.data[localCollectionShapes]).not.toEqual(
								gqlResponse2.body.data[localCollectionShapes],
							);

							expect(
								gqlResponse.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.children[0].item.test_datetime_func.year.toString().slice(-1));
								}),
							).toEqual(expectedAsc);

							expect(
								gqlResponse2.body.data[localCollectionShapes].map((item: any) => {
									return parseInt(item.children[0].item.test_datetime_func.year.toString().slice(-1));
								}),
							).toEqual(expectedDesc);
						});
					});
				});
			});

			describe('MAX_BATCH_MUTATION Tests', () => {
				describe('createOne', () => {
					describe('passes when below limit', () => {
						it.each(vendors)(
							'%s',
							async (vendor) => {
								// TODO: Fix Oracle exceeded directus_revisions limit of 4000
								if (vendor === 'oracle') {
									expect(true).toBe(true);
									return;
								}

								// Setup
								const countNested = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 2 - 1;
								const shape: any = createShape(pkType);

								shape.children = Array(countNested)
									.fill(0)
									.map((_, index) => {
										if (index < countNested / 2) {
											return { collection: localCollectionCircles, item: createCircle(pkType) };
										} else {
											return { collection: localCollectionSquares, item: createSquare(pkType) };
										}
									});

								// Action
								const response = await request(getUrl(vendor))
									.post(`/items/${localCollectionShapes}`)
									.send(shape)
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

								// Assert
								expect(response.statusCode).toBe(200);
								expect(response.body.data.children.length).toBe(countNested);
							},
							120000,
						);
					});

					describe('errors when above limit', () => {
						it.each(vendors)(
							'%s',
							async (vendor) => {
								// TODO: Fix Oracle ORA-01086 savepoint never established in this session or is invalid
								if (vendor === 'oracle') {
									expect(true).toBe(true);
									return;
								}

								// Setup
								const countNested = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 2;
								const shape: any = createShape(pkType);

								shape.children = Array(countNested)
									.fill(0)
									.map((_, index) => {
										if (index < countNested / 2) {
											return { collection: localCollectionCircles, item: createCircle(pkType) };
										} else {
											return { collection: localCollectionSquares, item: createSquare(pkType) };
										}
									});

								// Action
								const response = await request(getUrl(vendor))
									.post(`/items/${localCollectionShapes}`)
									.send(shape)
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

								// Assert
								expect(response.statusCode).toBe(400);
								expect(response.body.errors).toBeDefined();

								expect(response.body.errors[0].message).toBe(
									`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
								);
							},
							120000,
						);
					});
				});

				describe('createMany', () => {
					describe('passes when below limit', () => {
						it.each(vendors)(
							'%s',
							async (vendor) => {
								// Setup
								const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 10;
								const countNested = 4;
								const shapes: any[] = [];

								for (let i = 0; i < count; i++) {
									shapes.push(createShape(pkType));

									shapes[i].children = Array(countNested)
										.fill(0)
										.map((_, index) => {
											if (index < countNested / 2) {
												return { collection: localCollectionCircles, item: createCircle(pkType) };
											} else {
												return { collection: localCollectionSquares, item: createSquare(pkType) };
											}
										});
								}

								// Action
								const response = await request(getUrl(vendor))
									.post(`/items/${localCollectionShapes}`)
									.send(shapes)
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

								// Assert
								expect(response.statusCode).toBe(200);
								expect(response.body.data.length).toBe(count);
							},
							120000,
						);
					});

					describe('errors when above limit', () => {
						it.each(vendors)(
							'%s',
							async (vendor) => {
								// TODO: Fix Oracle ORA-01086 savepoint never established in this session or is invalid
								if (vendor === 'oracle') {
									expect(true).toBe(true);
									return;
								}

								// Setup
								const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 10;
								const countNested = 5;
								const shapes: any[] = [];

								for (let i = 0; i < count; i++) {
									shapes.push(createShape(pkType));

									shapes[i].children = Array(countNested)
										.fill(0)
										.map((_, index) => {
											if (index < countNested / 2) {
												return { collection: localCollectionCircles, item: createCircle(pkType) };
											} else {
												return { collection: localCollectionSquares, item: createSquare(pkType) };
											}
										});
								}

								// Action
								const response = await request(getUrl(vendor))
									.post(`/items/${localCollectionShapes}`)
									.send(shapes)
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

								// Assert
								expect(response.statusCode).toBe(400);
								expect(response.body.errors).toBeDefined();

								expect(response.body.errors[0].message).toBe(
									`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
								);
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
								const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 10;
								const countCreate = 2;
								const countUpdate = 2;
								const countDelete = 1;
								const shapesID = [];

								for (let i = 0; i < count; i++) {
									const shape: any = createShape(pkType);

									shape.children = Array(countUpdate + countDelete)
										.fill(0)
										.map((_, index) => {
											if (index < (countUpdate + countDelete) / 2) {
												return { collection: localCollectionCircles, item: createCircle(pkType) };
											} else {
												return { collection: localCollectionSquares, item: createSquare(pkType) };
											}
										});

									shapesID.push((await CreateItem(vendor, { collection: localCollectionShapes, item: shape })).id);
								}

								const shapes = await ReadItem(vendor, {
									collection: localCollectionShapes,
									fields: ['*', 'children.id', 'children.collection', 'children.item.id', 'children.item.name'],
									filter: { id: { _in: shapesID } },
								});

								for (const shape of shapes) {
									const children = shape.children;

									shape.children = {
										create: Array(countCreate)
											.fill(0)
											.map((_, index) => {
												if (index < countCreate / 2) {
													return { collection: localCollectionCircles, item: createCircle(pkType) };
												} else {
													return { collection: localCollectionSquares, item: createSquare(pkType) };
												}
											}),
										update: children.slice(0, countUpdate),
										delete: children.slice(-countDelete).map((child: Circle | Square) => child.id),
									};
								}

								// Action
								const response = await request(getUrl(vendor))
									.patch(`/items/${localCollectionShapes}`)
									.send(shapes)
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

								// Assert
								expect(response.statusCode).toBe(200);
								expect(response.body.data.length).toBe(count);
							},
							120000,
						);
					});

					describe('errors when above limit', () => {
						it.each(vendors)(
							'%s',
							async (vendor) => {
								// TODO: Fix Oracle ORA-01086 savepoint never established in this session or is invalid
								if (vendor === 'oracle') {
									expect(true).toBe(true);
									return;
								}

								// Setup
								const count = Number(config.envs[vendor]['MAX_BATCH_MUTATION']) / 10;
								const countCreate = 2;
								const countUpdate = 2;
								const countDelete = 2;
								const shapesID = [];

								for (let i = 0; i < count; i++) {
									const shape: any = createShape(pkType);

									shape.children = Array(countUpdate + countDelete)
										.fill(0)
										.map((_, index) => {
											if (index < (countUpdate + countDelete) / 2) {
												return { collection: localCollectionCircles, item: createCircle(pkType) };
											} else {
												return { collection: localCollectionSquares, item: createSquare(pkType) };
											}
										});

									shapesID.push((await CreateItem(vendor, { collection: localCollectionShapes, item: shape })).id);
								}

								const shapes = await ReadItem(vendor, {
									collection: localCollectionShapes,
									fields: ['*', 'children.id', 'children.collection', 'children.item.id', 'children.item.name'],
									filter: { id: { _in: shapesID } },
								});

								for (const shape of shapes) {
									const children = shape.children;

									shape.children = {
										create: Array(countCreate)
											.fill(0)
											.map((_, index) => {
												if (index < countCreate / 2) {
													return { collection: localCollectionCircles, item: createCircle(pkType) };
												} else {
													return { collection: localCollectionSquares, item: createSquare(pkType) };
												}
											}),
										update: children.slice(0, countUpdate),
										delete: children.slice(-countDelete).map((child: Circle | Square) => child.id),
									};
								}

								// Action
								const response = await request(getUrl(vendor))
									.patch(`/items/${localCollectionShapes}`)
									.send(shapes)
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

								// Assert
								expect(response.statusCode).toBe(400);
								expect(response.body.errors).toBeDefined();

								expect(response.body.errors[0].message).toBe(
									`Invalid payload. Exceeded max batch mutation limit of ${config.envs[vendor]['MAX_BATCH_MUTATION']}.`,
								);
							},
							120000,
						);
					});
				});
			});

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionShapes}`,
					token: USER.ADMIN.TOKEN,
				},
				localCollectionShapes,
				cachedSchema[pkType][localCollectionShapes],
				vendorSchemaValues,
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionCircles}`,
					token: USER.ADMIN.TOKEN,
				},
				localCollectionCircles,
				cachedSchema[pkType][localCollectionCircles],
				vendorSchemaValues,
			);

			CheckQueryFilters(
				{
					method: 'get',
					path: `/items/${localCollectionSquares}`,
					token: USER.ADMIN.TOKEN,
				},
				localCollectionSquares,
				cachedSchema[pkType][localCollectionSquares],
				vendorSchemaValues,
			);
		});

		describe('Meta Service Tests', () => {
			describe('retrieves filter count correctly', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const name = 'test-meta-service-count';
					const shape = createShape(pkType);
					const shape2 = createShape(pkType);
					const shapes = [];
					const shapes2 = [];
					const circle = createCircle(pkType);
					const circle2 = createCircle(pkType);
					const square = createSquare(pkType);
					const square2 = createSquare(pkType);

					shape.name = name;
					shape2.name = name;
					circle.name = name;
					circle2.name = name;
					square.name = name;
					square2.name = name;
					shapes.push(circle);
					shapes2.push(circle2);
					shapes.push(square);
					shapes2.push(square2);

					await CreateItem(vendor, {
						collection: localCollectionShapes,
						item: [
							{
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
							{
								...shape2,
								children: {
									create: [
										{ collection: localCollectionCircles, item: circle2 },
										{ collection: localCollectionSquares, item: square2 },
									],
									update: [],
									delete: [],
								},
							},
						],
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionShapes}`)
						.query({
							filter: JSON.stringify({
								name: { _eq: name },
								children: {
									[`item:${localCollectionCircles}`]: {
										name: {
											_eq: name,
										},
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

					for (const item of response.body.data) {
						expect(item.children.length).toBe(2);
					}
				});
			});
		});

		test('Auto Increment Tests', (ctx) => {
			if (pkType !== 'integer') ctx.skip();

			describe('updates the auto increment value correctly', () => {
				it.each(without(vendors, 'cockroachdb', 'mssql', 'oracle'))('%s', async (vendor) => {
					// Setup
					const name = 'test-auto-increment-m2a';
					const largeIdShape = 112222;
					const largeIdCircle = 113333;
					const largeIdSquare = 114444;
					const shape = createShape(pkType);
					const shape2 = createShape(pkType);
					const shapes = [];
					const shapes2 = [];
					const circle = createCircle(pkType);
					const circle2 = createCircle(pkType);
					const square = createSquare(pkType);
					const square2 = createSquare(pkType);

					shape.name = name;
					shape2.name = name;
					circle.name = name;
					circle2.name = name;
					square.name = name;
					square2.name = name;
					shape.id = largeIdShape;
					circle.id = largeIdCircle;
					square.id = largeIdSquare;

					shapes.push(circle);
					shapes2.push(circle2);
					shapes.push(square);
					shapes2.push(square2);

					await CreateItem(vendor, {
						collection: localCollectionShapes,
						item: [
							{
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
							{
								...shape2,
								children: {
									create: [
										{ collection: localCollectionCircles, item: circle2 },
										{ collection: localCollectionSquares, item: square2 },
									],
									update: [],
									delete: [],
								},
							},
						],
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionShapes}`)
						.query({
							filter: JSON.stringify({
								name: { _eq: name },
							}),
							fields: [
								'id',
								`children.item:${localCollectionCircles}.id`,
								`children.item:${localCollectionSquares}.id`,
								`children.collection`,
							],
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data.length).toBe(2);

					expect(response.body.data.map((shape: any) => shape.id)).toEqual(
						Array.from({ length: 2 }, (_, index) => largeIdShape + index),
					);

					expect(
						response.body.data.flatMap((shape: any) =>
							shape.children
								.filter((child: any) => child.collection === localCollectionCircles)
								.map((circle: any) => circle.item.id),
						),
					).toEqual(Array.from({ length: 2 }, (_, index) => largeIdCircle + index));

					expect(
						response.body.data.flatMap((shape: any) =>
							shape.children
								.filter((child: any) => child.collection === localCollectionSquares)
								.map((circle: any) => circle.item.id),
						),
					).toEqual(Array.from({ length: 2 }, (_, index) => largeIdSquare + index));
				});
			});
		});
	});
});
