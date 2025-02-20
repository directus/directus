import { getUrl } from '@common/config';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { collection, seedDBValues } from './case-when.seed';
import { USER } from '@common/variables';

// beforeAll(async () => {
// 	console.log('seed db');
// 	seedResult = await seedDBValues();
// 	console.log('seeded db', seedResult.isSeeded);
// }, 300_000);

// test('Seed Database Values', () => {
// 	if (seedResult) {
// 		expect(seedResult.isSeeded).toStrictEqual(true);
// 		return;
// 	} else {
// 		throw new Error('Seed Database Values failed');
// 	}
// });

describe('retrieves items with filters', async () => {
	const userToken = 'pp2KIAA3mGdgqngRVDuegxNuVj7gM-es';

	it.each(vendors)('%s', async (vendor) => {
		const userResponse = await request(getUrl(vendor))
			.post(`/users`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			.send({
				first_name: 'john',
				email: 'j@mail.com',
				password: '12345',
				token: 'pp2KIAA3mGdgqngRVDuegxNuVj7gM-es',
				policies: {
					create: [
						{
							policy: {
								name: 'sample',
								permissions: {
									create: [
										{
											policy: '+',
											permissions: {
												_and: [
													{
														user_created: {
															id: {
																_eq: '$CURRENT_USER',
															},
														},
													},
												],
											},
											validation: null,
											fields: ['id', 'user_created', 'date_created'],
											presets: null,
											collection: 'articles_case_when',
											action: 'read',
										},
										{
											policy: '+',
											permissions: null,
											validation: null,
											fields: ['*'],
											presets: null,
											collection: 'articles_case_when',
											action: 'create',
										},
									],
									update: [],
									delete: [],
								},
								app_access: true,
							},
						},
					],
					update: [],
					delete: [],
				},
			});

		if (!userResponse.ok) {
			throw new Error('Could not create user', userResponse.body);
		}

		await seedDBValues(vendor, userToken);

		// Admin can query both articles
		const response = await request(getUrl(vendor))
			.get(`/items/${collection}`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.length).toBe(2);

		// Editor can only query articles created by them
		const response1 = await request(getUrl(vendor))
			.get(`/items/${collection}`)
			.set('Authorization', `Bearer ${userToken}`);

		expect(response1.statusCode).toEqual(200);
		expect(response1.body.data.length).toBe(2);

		// A groupBy query with aggregation
		// The query for which the deduplication was implemented
		const groupByWithAggregationResponse = await request(getUrl(vendor))
			.get(`/items/${collection}?groupBy=day(date_created)&aggregate[count]=*`)
			.set('Authorization', `Bearer ${userToken}`);

		expect(groupByWithAggregationResponse.statusCode).toEqual(200);
		expect(groupByWithAggregationResponse.body.data.length).toBe(1);
		// It would be nice to also check the actual result, but the result is not deterministic.
		// Depending on the database, it returns either an integer or a string.
		// expect(groupByWithAggregationResponse.body.data[0].count).toBe(2);

		// A query which produces a case when statement in the final query
		// where the fields to compare, have different data types:
		// user_created is a string, whereas directus_users.id is a of type UUID.
		const comparisonResult = await request(getUrl(vendor))
			.get(
				`/comments?filter[_and][0][collection][_eq]=directus_users&filter[_and][1][item][_eq]=${userResponse.body.data.id}&aggregate[count]=id`,
			)
			.set('Authorization', `Bearer ${userToken}`);

		expect(comparisonResult.statusCode).toEqual(200);
		// expect(comparisonResult.body.data.length).toBe(1);
	});
});

// - - - - - API calls - - - - -
// Those are in here temporarily.
// They will be moved to a common place with a separate refactoring.

async function deleteUser(vendor: Vendor, id: string): Promise<void> {
	await request(getUrl(vendor)).delete(`/users/${id}`).set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

	// TODO - Fix this when API returns correct status code
	// if (!response.ok) {
	// 	throw new Error('Could not delete user');
	// }
}

async function deletePolicy(vendor: Vendor, id: string): Promise<void> {
	await request(getUrl(vendor)).delete(`/policies/${id}`).set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

	// @TODO - Fix this when API returns correct status code
	// if (!response.ok) {
	// 	throw new Error('Could not delete policy', response.body);
	// }
}

async function DeletePermissions(vendor: Vendor, ids: number[]): Promise<void> {
	ids.forEach(async (id) => {
		const res = await request(getUrl(vendor))
			.delete(`/permissions/${id}`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		if (!res.ok) {
			throw new Error('Could not delete permissions', res.body);
		}
	});
}
