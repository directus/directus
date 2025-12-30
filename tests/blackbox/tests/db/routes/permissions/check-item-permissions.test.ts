import {
	collection,
	collectionItemName,
	seedDBValues,
	singleton,
	singletonItemName,
} from './check-item-permissions.seed';
import { getUrl } from '@common/config';
import { CreatePermission } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it, test } from 'vitest';

let isSeeded = false;

beforeAll(async () => {
	isSeeded = await seedDBValues();
}, 300_000);

test('Seed Database Values', () => {
	expect(isSeeded).toStrictEqual(true);
});

describe('/permissions/me/:collection/:id?', () => {
	describe('retrieves item permissions', () => {
		describe('admin', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Action
				const response = await request(getUrl(vendor))
					.get(`/permissions/me/${collection}/1`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(200);

				expect(response.body.data).toMatchObject({
					update: { access: true },
					delete: { access: true },
					share: { access: true },
				});
			});
		});

		describe('user', () => {
			describe('collection item with update access', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response1 = await request(getUrl(vendor))
						.get(`/permissions/me/${collection}/1`)
						.set('Authorization', `Bearer ${USER.APP_ACCESS.TOKEN}`);

					// Assert
					expect(response1.statusCode).toEqual(200);

					expect(response1.body.data).toMatchObject({
						update: { access: false },
						delete: { access: false },
						share: { access: false },
					});

					await CreatePermission(vendor, {
						role: USER.APP_ACCESS.KEY,
						permissions: [
							{
								collection,
								action: 'update',
								permissions: { _and: [{ name: { _eq: collectionItemName } }] },
								presets: {},
								fields: ['name'],
							},
						],
						policyName: 'Check Update Collection',
					});

					// Action
					const response2 = await request(getUrl(vendor))
						.get(`/permissions/me/${collection}/1`)
						.set('Authorization', `Bearer ${USER.APP_ACCESS.TOKEN}`);

					// Assert
					expect(response2.statusCode).toEqual(200);

					expect(response2.body.data).toMatchObject({
						update: { access: true },
						delete: { access: false },
						share: { access: false },
					});
				});
			});

			describe('singleton item with update access', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response1 = await request(getUrl(vendor))
						.get(`/permissions/me/${singleton}`)
						.set('Authorization', `Bearer ${USER.APP_ACCESS.TOKEN}`);

					// Assert
					expect(response1.statusCode).toEqual(200);

					expect(response1.body.data).toMatchObject({
						update: { access: false },
						delete: { access: false },
						share: { access: false },
					});

					await CreatePermission(vendor, {
						role: USER.APP_ACCESS.KEY,
						permissions: [
							{
								collection: singleton,
								action: 'update',
								permissions: { _and: [{ name: { _eq: singletonItemName } }] },
								presets: {},
								fields: ['name'],
							},
						],
						policyName: 'Check Update Singleton',
					});

					// Action
					const response2 = await request(getUrl(vendor))
						.get(`/permissions/me/${singleton}`)
						.set('Authorization', `Bearer ${USER.APP_ACCESS.TOKEN}`);

					// Assert
					expect(response2.statusCode).toEqual(200);

					expect(response2.body.data).toMatchObject({
						update: { access: true, presets: {}, fields: ['name'] },
						delete: { access: false },
						share: { access: false },
					});
				});
			});
		});
	});

	describe('returns an error when unauthenticated', () => {
		it.each(vendors)('%s', async (vendor) => {
			// Action
			const response = await request(getUrl(vendor)).get(`/permissions/me/${collection}/1`);

			// Assert
			expect(response.statusCode).toBe(403);
		});
	});
});
