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
	// const userId = randomUUID();
	const userToken = 'test-case-when-user-token';
	// const policyName = 'sample-policy';
	// const policyId: UUID = '74f5ef86-db06-4a88-8447-506688d0ff52';
	const permissionIds: [number, number] = [93827, 93828];

	await seedDBValues();
	// console.log('seeded db', seedResult);

	it.each(vendors)('%s', async (vendor) => {
		console.log('querying articlesas admin: ');

		const response = await request(getUrl(vendor))
			.get(`/items/${collection}`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		console.log('articles query as admin: ', response.body.data);

		console.log('response', response);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.length).toBe(2);

		createEditor(vendor, {
			id: '93016b62-4207-4137-80e9-44cec5ff8f73',
			email: 'sample@sample.com',
			password: '12345',
			first_name: 'John',
			last_name: 'Doe',
			status: 'active',
			token: 'test-case-when-user-token',
			policies: [
				{
					user: '93016b62-4207-4137-80e9-44cec5ff8f73',
					policy: {
						id: '74f5ef86-db06-4a88-8447-506688d0ff53',
						name: 'policyName',
						icon: 'trashcan',
						description: '',
						enforce_tfa: false,
						ip_access: [],
						app_access: true,
						admin_access: false,
					},
				},
			],
		});

		await CreatePermissions(vendor, [
			{
				id: permissionIds[0],
				action: 'read',
				fields: ['id', 'user_created'], //'date_created'
				collection,
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
				policy: '74f5ef86-db06-4a88-8447-506688d0ff53',
				validation: null,
				presets: null,
			},
			{
				id: permissionIds[1],
				action: 'create',
				fields: ['id', 'user_created'],
				collection,
				permissions: null,
				validation: null,
				presets: null,
				policy: '74f5ef86-db06-4a88-8447-506688d0ff53',
			},
		]);

		const response1 = await request(getUrl(vendor))
			.get(`/items/${collection}`)
			.set('Authorization', `Bearer ${userToken}`);

		console.log('as editor without filters', response1.body.data, response1);

		expect(response1.statusCode).toEqual(200);
		expect(response1.body.data.length).toBe(2);

		const response = await request(getUrl(vendor))
			.get(`/items/${collection}?groupBy=day(date_created)&aggregate[count]=*`)
			.set('Authorization', `Bearer ${userToken}`);

		console.log('as editor with filters', response);

		console.log(JSON.stringify(response, null, 4));

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.length).toBe(1);
	});

	// await deletePolicy(vendor, policyId);

	// console.log('editor created');

	// await DeletePermissions(vendor, permissionIds);

	// console.log('permissions created');

	// await deleteUser(vendor, userId);

	// });
});

// - - - - - API calls - - - - -
// Those are in here temporarily.
// They will be moved to a common place with a separate refactoring.

async function createEditor(vendor: Vendor, user: Item): Promise<User> {
	const response = await request(getUrl(vendor))
		.post(`/users`)
		.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
		.send(user);

	if (!response.ok) {
		throw new Error('Could not create user');
	}

	return response.body.data;
}

async function deleteUser(vendor: Vendor, id: string): Promise<void> {
	await request(getUrl(vendor)).delete(`/users/${id}`).set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

	// TODO - Fix this when API returns correct status code
	// if (!response.ok) {
	// 	throw new Error('Could not delete user');
	// }
}

async function CreatePermissions(vendor: Vendor, permissions: Permission[]): Promise<Permission> {
	const response = await request(getUrl(vendor))
		.post(`/permissions/`)
		.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
		.send(permissions);

	if (!response.ok) {
		throw new Error('Could not create permission', response.body);
	}

	return response.body.data;
}

async function CreatePolicy(vendor: Vendor, options: Policy): Promise<Policy> {
	const response = await request(getUrl(vendor))
		.post(`/policies/`)
		.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
		.send(options);

	if (!response.ok) {
		throw new Error('Could not create policy', response.body);
	}

	console.log('policy created');

	return response.body.data;
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
		await request(getUrl(vendor)).delete(`/permissions/${id}`).set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		// if (!response.ok) {
		// 	throw new Error('Could not delete permissions', response.body);
		// }
	});
}
