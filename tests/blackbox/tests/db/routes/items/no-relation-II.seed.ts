import { CreateCollection, CreateField, DeleteCollection } from '@common/functions';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import type { Item, Permission, Policy, User } from '@directus/types';
import { randomUUID, type UUID } from 'node:crypto';
import { expect, it } from 'vitest';
import request from 'supertest';
import { getUrl } from '@common/config';
import { log } from 'node:console';

export type Articles = {
	id?: number | string;
	user_created: UUID;
	date_created: string;
};

export type Result = {
	isSeeded: boolean;
	editorToken: string | null;
};

export const collection = 'articles';

const userId = 'sample-user-id';
const userToken = 'sample-user-token';
const policy = 'sample-policy';
const permissionIds: [number, number] = [93827, 93828];

export const seedDBStructure = () => {
	console.log('seed db structure...');

	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				await DeleteCollection(vendor, { collection });

				await CreateCollection(vendor, {
					collection,
					primaryKeyType: 'integer',
				});

				await CreateField(vendor, {
					collection,
					field: 'user_created',
					type: 'uuid',
				});

				await CreateField(vendor, {
					collection,
					field: 'date_created',
					type: 'timestamp',
				});

				console.log('setup schema ');

				expect(true).toBeTruthy();
			} catch (error) {
				expect(error).toBeFalsy();
			}
		},
		300000,
	);
};

export const seedDBValues = async () => {
	const result: Result = {
		editorToken: null,
		isSeeded: true,
	};

	log('seeding db . . . .. ');

	try {
		vendors.map(async (vendor) => {
			console.log('starting seed', vendor);

			await deletePolicy(vendor, policy);

			await CreatePolicy(vendor, {
				id: policy,
				name: policy,
				icon: 'trashcan',
				description: '',
				enforce_tfa: null,
				ip_access: [],
				app_access: true,
				admin_access: false,
			});

			console.log('policy created');

			await DeletePermissions(vendor, permissionIds);

			await CreatePermission(vendor, {
				id: permissionIds[0],
				action: 'read',
				fields: ['id', 'user_created', 'date_created'],
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
				policy,
				validation: null,
				presets: null,
			});

			await CreatePermission(vendor, {
				id: permissionIds[1],
				action: 'create',
				fields: ['id', 'user_created', 'date_created'],
				collection,
				permissions: null,
				validation: null,
				presets: null,
				policy,
			});

			console.log('permissions created');

			await deleteUser(vendor, userId);
			const editor = await createEditor(vendor);
			console.log('editor created');

			result.editorToken = editor.token;

			await CreateItem(
				vendor,
				collection,
				{
					id: '1',
					user_created: randomUUID(),
					date_created: new Date().toISOString(),
				},
				userToken,
			);

			await CreateItem(
				vendor,
				collection,
				{
					id: '2',
					user_created: randomUUID(),
					date_created: new Date().toISOString(),
				},
				userToken,
			);

			console.log('items created');
		});
	} catch (error) {
		result.isSeeded = false;
	}

	return result;
};

async function createEditor(vendor: Vendor): Promise<User> {
	const newUser = {
		id: userId,
		email: 'sample@sample.com',
		password: '12345',
		name: 'John',
		token: userToken,
		policies: [policy],
	};

	const response = await request(getUrl(vendor))
		.post(`/users`)
		.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
		.send(newUser);

	if (response.statusCode !== 200) {
		throw new Error('Could not create user');
	}

	return response.body.data;
}

async function deleteUser(vendor: Vendor, id: string): Promise<void> {
	await request(getUrl(vendor)).delete(`/users/${id}`).set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`).expect(200);
}

async function CreatePermission(vendor: Vendor, options: Permission): Promise<Permission> {
	const response = await request(getUrl(vendor))
		.post(`/permissions/`)
		.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
		.send(options);

	if (response.statusCode !== 200) {
		throw new Error('Could not create permission');
	}

	return response.body.data;
}

async function CreatePolicy(vendor: Vendor, options: Policy): Promise<Policy> {
	const response = await request(getUrl(vendor))
		.post(`/policies/`)
		.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
		.send(options)
		.expect(200);

	return response.body.data;
}

async function deletePolicy(vendor: Vendor, id: string): Promise<void> {
	await request(getUrl(vendor))
		.delete(`/policies/${id}`)
		.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
		.expect(200);
}

async function DeletePermissions(vendor: Vendor, ids: number[]): Promise<void> {
	ids.forEach(async (id) => {
		await request(getUrl(vendor)).delete(`/permissions/${id}`).set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
	});
}

async function CreateItem(vendor: Vendor, collection: string, item: any, token: string): Promise<Item> {
	const response = await request(getUrl(vendor))
		.post(`/items/${collection}`)
		.set('Authorization', `Bearer ${token}`)
		.send(item)
		.expect(200);

	return response.body.data;
}
