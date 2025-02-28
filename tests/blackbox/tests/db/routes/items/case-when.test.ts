import { getUrl } from '@common/config';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import request from 'supertest';
import { beforeAll, describe, expect, it, test } from 'vitest';
import { collection, seedDBValues } from './case-when.seed';
import { USER } from '@common/variables';
// import { randomUUID, type UUID } from 'node:crypto';
import type { Item, Permission, Policy, User } from '@directus/types';

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
	// const userId = '93016b62-4207-4137-80e9-44cec5ff8f73';
	const userToken = 'pp2KIAA3mGdgqngRVDuegxNuVj7gM-es';
	// const policyName = 'sample-policy';
	// const policyId: UUID = '74f5ef86-db06-4a88-8447-506688d0ff52';
	// const permissionIds: [number, number] = [93827, 93828];
	// console.log('seeded db', seedResult);

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

		// const newPolicyId = user.policies[0];
		// console.log('new policy', newPolicyId);
		// await deletePolicy(vendor, policyId);

		// await DeletePermissions(vendor, permissionIds);

		// const newPolicyIdRes = await request(getUrl(vendor))
		// 	.get(`/policies?filter[name][_eq]=policyName`)
		// 	.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		// if (!newPolicyIdRes.ok) {
		// 	throw new Error('Could not get policies');
		// }

		// console.log('policies', newPolicyIdRes.body.data);

		await seedDBValues(vendor, userToken);

		// Admin can query both articles
		console.log('querying articlesas admin: ');

		const response = await request(getUrl(vendor))
			.get(`/items/${collection}`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		console.log('articles query as admin: ', response.body.data);
		console.log('response', response);
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.length).toBe(2);

		// Editor can only query articles created by them
		const response1 = await request(getUrl(vendor))
			.get(`/items/${collection}`)
			.set('Authorization', `Bearer ${userToken}`);

		console.log('as editor without filters', response1.body.data, response1);
		expect(response1.statusCode).toEqual(200);
		expect(response1.body.data.length).toBe(2);

		const response2 = await request(getUrl(vendor))
			.get(`/items/${collection}?groupBy=day(date_created)&aggregate[count]=*`)
			.set('Authorization', `Bearer ${userToken}`);

		console.log('as editor with filters', response);
		// console.log(JSON.stringify(response2, null, 4));

		expect(response2.statusCode).toEqual(200);
		expect(response2.body.data.length).toBe(1);
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
