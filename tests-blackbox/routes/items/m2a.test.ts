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
// import { CheckQueryFilters } from '@query/filter';

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
			describe('retrieves one shape', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const shape = await CreateItem(vendor, {
						collection: localCollectionShapes,
						item: createShape(pkType),
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionShapes}/${shape.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: expect.any(String) });
				});
			});

			describe('retrieves one circle', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const circle = await CreateItem(vendor, {
						collection: localCollectionCircles,
						item: createCircle(pkType),
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionCircles}/${circle.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: expect.any(String) });
				});
			});

			describe('retrieves one square', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const square = await CreateItem(vendor, {
						collection: localCollectionSquares,
						item: createSquare(pkType),
					});

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionSquares}/${square.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: expect.any(String) });
				});
			});

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

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.children).toHaveLength(1);
				});
			});

			describe('Error handling', () => {
				describe('returns an error when an invalid id is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionShapes}/invalid_id`)
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
			describe(`updates one shape's name with no relations`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const insertedShape = await CreateItem(vendor, {
						collection: localCollectionShapes,
						item: createShape(pkType),
					});
					const body = { name: 'Tommy Cash' };

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionShapes}/${insertedShape.id}`)
						.send(body)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({
						id: insertedShape.id,
						name: 'Tommy Cash',
					});
				});
			});
		});
		describe('DELETE /:collection/:id', () => {
			describe('deletes an shape with no relations', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const insertedShape = await CreateItem(vendor, {
						collection: localCollectionShapes,
						item: createShape(pkType),
					});

					// Action
					const response = await request(getUrl(vendor))
						.delete(`/items/${localCollectionShapes}/${insertedShape.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(204);
					expect(response.body.data).toBe(undefined);
				});
			});
		});
		describe('GET /:collection', () => {
			describe('retrieves all items from shape table with no relations', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const shapes = [];
					const shapesCount = 50;
					for (let i = 0; i < shapesCount; i++) {
						shapes.push(createShape(pkType));
					}
					await CreateItem(vendor, { collection: localCollectionShapes, item: shapes });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionShapes}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.length).toBeGreaterThanOrEqual(shapesCount);
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

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: insertedShape.id });
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data);
					});
				});

				describe(`on m2a level`, () => {
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

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: insertedShape.id });
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data);
					});
				});
			});

			describe(`filters with functions`, () => {
				describe(`on top level`, () => {
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

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: insertedShape.id });
						expect(response.body.data[0].children.length).toBe(1);
						expect(response2.statusCode).toEqual(200);
						expect(response2.body.data.length).toBe(1);
						expect(response2.body.data[0]).toMatchObject({ id: insertedShape2.id });
						expect(response2.body.data[0].children.length).toBe(2);
					});
				});

				describe(`on m2a level`, () => {
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

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(1);
						expect(response.body.data[0]).toMatchObject({ id: retrievedShapes[0][0].id });
						expect(response2.statusCode).toEqual(200);
						expect(response2.body.data.length).toBe(1);
						expect(response2.body.data[0]).toMatchObject({ id: retrievedShapes[1][0].id });
					});
				});
			});

			describe(`sorts`, () => {
				describe(`on top level`, () => {
					it.each(vendors)('%s', async (vendor) => {
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

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(5);
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data.reverse());
					});
				});

				describe(`on m2a level`, () => {
					it.each(vendors)('%s', async (vendor) => {
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
						const shapes = [];

						for (const val of sortValues) {
							const shape = createShape(pkType);
							shape.name = 'shape-m2a-top-sort-fn-' + uuid();
							shape.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`))).toISOString().slice(0, 19);
							shapes.push(shape);
						}

						await CreateItem(vendor, {
							collection: localCollectionShapes,
							item: shapes,
						});

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

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(5);
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data.reverse());
					});
				});

				describe(`on m2a level`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const sortValues = [4, 2, 3, 5, 1];

						for (const val of sortValues) {
							const circle = createCircle(pkType);
							circle.name = 'circle-m2a-sort-fn-' + uuid();
							circle.test_datetime = new Date(new Date().setFullYear(parseInt(`202${val}`))).toISOString().slice(0, 19);
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

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(5);
						expect(response2.statusCode).toEqual(200);
						expect(response.body.data).toEqual(response2.body.data.reverse());
					});
				});
			});

			// TODO: Enable query filter tests
			// CheckQueryFilters(
			// 	{
			// 		method: 'get',
			// 		path: `/items/${localCollectionShapes}`,
			// 		token: common.USER.ADMIN.TOKEN,
			// 	},
			// 	localCollectionShapes,
			// 	cachedSchema[pkType][localCollectionShapes],
			// 	vendorSchemaValues
			// );

			// CheckQueryFilters(
			// 	{
			// 		method: 'get',
			// 		path: `/items/${localCollectionCircles}`,
			// 		token: common.USER.ADMIN.TOKEN,
			// 	},
			// 	localCollectionCircles,
			// 	cachedSchema[pkType][localCollectionCircles],
			// 	vendorSchemaValues
			// );

			// CheckQueryFilters(
			// 	{
			// 		method: 'get',
			// 		path: `/items/${localCollectionSquares}`,
			// 		token: common.USER.ADMIN.TOKEN,
			// 	},
			// 	localCollectionSquares,
			// 	cachedSchema[pkType][localCollectionSquares],
			// 	vendorSchemaValues
			// );
		});

		describe('POST /:collection', () => {
			describe('createOne', () => {
				describe('creates one shape', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const shape = createShape(pkType);

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/${localCollectionShapes}`)
							.send(shape)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toMatchObject({ name: shape.name });
					});
				});
			});
			describe('createMany', () => {
				describe('creates 5 shapes', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const shapes = [];
						const shapesCount = 5;
						for (let i = 0; i < shapesCount; i++) {
							shapes.push(createShape(pkType));
						}

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/${localCollectionShapes}`)
							.send(shapes)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(shapesCount);
					});
				});
			});
			describe('Error handling', () => {
				describe('returns an error when an invalid table is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const shape = createShape(pkType);

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/invalid_table`)
							.send(shape)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toBe(403);
					});
				});
			});
		});

		describe('PATCH /:collection', () => {
			describe('updates many shapes to a different name', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const shapes = [];
					const shapesCount = 5;
					for (let i = 0; i < shapesCount; i++) {
						shapes.push(createShape(pkType));
					}

					const insertedShapes = await CreateItem(vendor, { collection: localCollectionShapes, item: shapes });
					const keys = Object.values(insertedShapes ?? []).map((item: any) => item.id);

					const body = {
						keys: keys,
						data: { name: 'Johnny Cash' },
					};

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionShapes}?fields=name`)
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
			describe('deletes many shapes with no relations', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const shapes = [];
					const shapesCount = 10;
					for (let i = 0; i < shapesCount; i++) {
						shapes.push(createShape(pkType));
					}

					const insertedShapes = await CreateItem(vendor, { collection: localCollectionShapes, item: shapes });
					const keys = Object.values(insertedShapes ?? []).map((item: any) => item.id);

					// Action
					const response = await request(getUrl(vendor))
						.delete(`/items/${localCollectionShapes}`)
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
