import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it, test } from 'vitest';
import { collectionFirst, collectionSecond, seedDBValues } from './hash-filter.seed';

let isSeeded = false;

beforeAll(async () => {
	isSeeded = await seedDBValues();
}, 300_000);

test('Seed Database Values', () => {
	expect(isSeeded).toStrictEqual(true);
});

describe.each(PRIMARY_KEY_TYPES)('/items', (pkType) => {
	const localCollectionFirst = `${collectionFirst}_${pkType}`;
	const localCollectionSecond = `${collectionSecond}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe(`GET /${localCollectionFirst}`, () => {
			describe('retrieves items without filters', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFirst}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/items/${localCollectionSecond}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.length).toBe(2);
					expect(response2.statusCode).toEqual(200);
					expect(response2.body.data.length).toBe(2);
				});
			});

			describe('retrieves items with filters (non-relational)', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFirst}`)
						.query({
							filter: JSON.stringify({ hash_field: { _null: true } }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/items/${localCollectionFirst}`)
						.query({
							filter: JSON.stringify({ hash_field: { _nnull: true } }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response3 = await request(getUrl(vendor))
						.get(`/items/${localCollectionSecond}`)
						.query({
							filter: JSON.stringify({ hash_field: { _null: true } }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response4 = await request(getUrl(vendor))
						.get(`/items/${localCollectionSecond}`)
						.query({
							filter: JSON.stringify({ hash_field: { _nnull: true } }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.length).toBe(1);
					expect(response2.statusCode).toEqual(200);
					expect(response2.body.data.length).toBe(1);
					expect(response3.statusCode).toEqual(200);
					expect(response3.body.data.length).toBe(1);
					expect(response4.statusCode).toEqual(200);
					expect(response4.body.data.length).toBe(1);
				});
			});

			describe('errors with invalid filters (non-relational)', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFirst}`)
						.query({
							filter: JSON.stringify({ hash_field: { _contains: 'a' } }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/items/${localCollectionFirst}`)
						.query({
							filter: JSON.stringify({ hash_field: { _eq: 'b' } }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response3 = await request(getUrl(vendor))
						.get(`/items/${localCollectionSecond}`)
						.query({
							filter: JSON.stringify({ hash_field: { _starts_with: 'c' } }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response4 = await request(getUrl(vendor))
						.get(`/items/${localCollectionSecond}`)
						.query({
							filter: JSON.stringify({ hash_field: { _ends_with: 'd' } }),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response2.statusCode).toEqual(400);
					expect(response3.statusCode).toEqual(400);
					expect(response4.statusCode).toEqual(400);
				});
			});

			describe('retrieves items with filters (relational)', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFirst}`)
						.query({
							filter: JSON.stringify({
								second_ids: { hash_field: { _null: true } },
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/items/${localCollectionFirst}`)
						.query({
							filter: JSON.stringify({
								second_ids: { hash_field: { _null: true } },
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response3 = await request(getUrl(vendor))
						.get(`/items/${localCollectionSecond}`)
						.query({
							filter: JSON.stringify({
								first_id: { hash_field: { _null: true } },
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response4 = await request(getUrl(vendor))
						.get(`/items/${localCollectionSecond}`)
						.query({
							filter: JSON.stringify({
								first_id: { hash_field: { _null: true } },
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.length).toBe(1);
					expect(response2.statusCode).toEqual(200);
					expect(response2.body.data.length).toBe(1);
					expect(response3.statusCode).toEqual(200);
					expect(response3.body.data.length).toBe(1);
					expect(response4.statusCode).toEqual(200);
					expect(response4.body.data.length).toBe(1);
				});
			});

			describe('errors with invalid filters (relational)', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionFirst}`)
						.query({
							filter: JSON.stringify({
								second_ids: { hash_field: { _contains: 'a' } },
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response2 = await request(getUrl(vendor))
						.get(`/items/${localCollectionFirst}`)
						.query({
							filter: JSON.stringify({
								second_ids: { hash_field: { _eq: 'b' } },
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response3 = await request(getUrl(vendor))
						.get(`/items/${localCollectionSecond}`)
						.query({
							filter: JSON.stringify({
								first_id: { hash_field: { _starts_with: 'c' } },
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					const response4 = await request(getUrl(vendor))
						.get(`/items/${localCollectionSecond}`)
						.query({
							filter: JSON.stringify({
								first_id: { hash_field: { _ends_with: 'd' } },
							}),
						})
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(400);
					expect(response2.statusCode).toEqual(400);
					expect(response3.statusCode).toEqual(400);
					expect(response4.statusCode).toEqual(400);
				});
			});
		});
	});
});
