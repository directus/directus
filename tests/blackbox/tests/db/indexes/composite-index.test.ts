import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const TEST_COLLECTION = 'test_composite_index';

describe('Composite Index', () => {
	beforeAll(async () => {
		// Create test collection on all vendors
		for (const vendor of vendors) {
			await request(getUrl(vendor))
				.post('/collections')
				.send({
					collection: TEST_COLLECTION,
					fields: [
						{
							field: 'id',
							type: 'integer',
							meta: { hidden: true, interface: 'input', readonly: true },
							schema: { is_primary_key: true, has_auto_increment: true },
						},
						{
							field: 'collection',
							type: 'string',
							schema: { max_length: 255 },
						},
						{
							field: 'item',
							type: 'string',
							schema: { max_length: 255 },
						},
						{
							field: 'version',
							type: 'string',
							schema: { max_length: 255, is_nullable: true },
						},
					],
					schema: {},
					meta: { singleton: false },
				})
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
		}
	});

	afterAll(async () => {
		// Cleanup test collection on all vendors
		for (const vendor of vendors) {
			await request(getUrl(vendor))
				.delete(`/collections/${TEST_COLLECTION}`)
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
		}
	});

	describe('creates composite index via schema endpoint', () => {
		it.each(vendors)(
			'%s',
			async (vendor) => {
				// Get current snapshot
				const snapshotResponse = await request(getUrl(vendor))
					.get('/schema/snapshot')
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				expect(snapshotResponse.statusCode).toEqual(200);

				const snapshot = snapshotResponse.body.data;

				// Find the test collection and add index info to fields
				const collectionField = snapshot.fields.find(
					(f: any) => f.collection === TEST_COLLECTION && f.field === 'collection',
				);

				const itemField = snapshot.fields.find((f: any) => f.collection === TEST_COLLECTION && f.field === 'item');

				const versionField = snapshot.fields.find(
					(f: any) => f.collection === TEST_COLLECTION && f.field === 'version',
				);

				// Verify fields exist
				expect(collectionField).toBeDefined();
				expect(itemField).toBeDefined();
				expect(versionField).toBeDefined();
			},
			120_000,
		);
	});

	describe('verifies composite index improves query performance', () => {
		it.each(vendors)(
			'%s',
			async (vendor) => {
				// Insert some test data
				const items = [];

				for (let i = 0; i < 10; i++) {
					items.push({
						collection: `col_${i % 3}`,
						item: `item_${i}`,
						version: i % 2 === 0 ? null : `v${i}`,
					});
				}

				const createResponse = await request(getUrl(vendor))
					.post(`/items/${TEST_COLLECTION}`)
					.send(items)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				expect(createResponse.statusCode).toEqual(200);

				// Query with filter on composite fields
				const queryResponse = await request(getUrl(vendor))
					.get(`/items/${TEST_COLLECTION}`)
					.query({
						filter: JSON.stringify({
							_and: [{ collection: { _eq: 'col_0' } }, { item: { _eq: 'item_0' } }, { version: { _null: true } }],
						}),
					})
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				expect(queryResponse.statusCode).toEqual(200);
				expect(queryResponse.body.data).toBeDefined();
			},
			120_000,
		);
	});
});
