import { getUrl } from '@common/config';
import { ClearCaches, DisableTestCachingSetup } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { viewName } from './views.seed';

describe('Views (read-only)', () => {
	DisableTestCachingSetup();

	describe('GET /collections/:collection', () => {
		describe('returns view collection with type "view"', () => {
			it.each(vendors)('%s', async (vendor) => {
				const response = await request(getUrl(vendor))
					.get(`/collections/${viewName}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				expect(response.statusCode).toBe(200);
				expect(response.body.data.schema?.type).toBe('view');
			});
		});
	});

	describe('GET /items/:collection', () => {
		describe('can read items from a view', () => {
			it.each(vendors)('%s', async (vendor) => {
				const response = await request(getUrl(vendor))
					.get(`/items/${viewName}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				expect(response.statusCode).toBe(200);
				expect(response.body.data.length).toBe(2);
				expect(response.body.data).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ name: 'item_a', value: 10 }),
						expect.objectContaining({ name: 'item_b', value: 20 }),
					]),
				);
			});
		});
	});

	describe('POST /items/:collection', () => {
		describe('rejects creating items in a view', () => {
			it.each(vendors)('%s', async (vendor) => {
				const response = await request(getUrl(vendor))
					.post(`/items/${viewName}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.send({ name: 'should_fail', value: 99 });

				expect(response.statusCode).toBe(400);
			});
		});
	});

	describe('PATCH /items/:collection', () => {
		describe('rejects updating items in a view', () => {
			it.each(vendors)('%s', async (vendor) => {
				// First get an item id
				const readResponse = await request(getUrl(vendor))
					.get(`/items/${viewName}?limit=1`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const itemId = readResponse.body.data[0]?.id;

				expect(itemId).toBeDefined();

				const response = await request(getUrl(vendor))
					.patch(`/items/${viewName}/${itemId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.send({ name: 'should_fail' });

				expect(response.statusCode).toBe(400);
			});
		});
	});

	describe('DELETE /items/:collection', () => {
		describe('rejects deleting items from a view', () => {
			it.each(vendors)('%s', async (vendor) => {
				// First get an item id
				const readResponse = await request(getUrl(vendor))
					.get(`/items/${viewName}?limit=1`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const itemId = readResponse.body.data[0]?.id;

				expect(itemId).toBeDefined();

				const response = await request(getUrl(vendor))
					.delete(`/items/${viewName}/${itemId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				expect(response.statusCode).toBe(400);
			});
		});
	});

	ClearCaches();
});
