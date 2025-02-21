import {
	CreateCollection,
	CreateField,
	CreateItem,
	CreatePermission,
	CreatePolicy,
	CreateRole,
	CreateUser,
} from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import { randomUUID, type UUID } from 'node:crypto';
import { expect, it } from 'vitest';

export type Articles = {
	id?: number | string;
	user_created: UUID;
	date_created: string;
};

export type Result = {
	isSeeded: boolean;
	collection: string;
	apiToken: string | null;
	permissions: number[];
};

export const collection = 'articles';

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
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
		apiToken: null,
		isSeeded: true,
		permissions: [],
		collection,
	};

	try {
		vendors.map(async (vendor) => {
			console.log('starting seed', vendor);

			const role = 'EDITOR_ARTICLES';
			const policy = 'sample-policy';

			const user = await CreateUser(
				vendor,
				{
					email: 'sample@sample.com',
					password: '12345',
					name: 'John',
					role,
					token: USER.ADMIN.TOKEN,
				},
				USER.ADMIN.TOKEN,
			);

			console.log('user created');

			result.apiToken = user.token;

			await CreateRole(vendor, { name: role }, USER.ADMIN.TOKEN);

			console.log('Role created');

			await CreatePolicy(
				vendor,
				{
					id: policy,
					name: policy,
					icon: 'trashcan',
					description: '',
					enforce_tfa: null,
					ip_access: [],
					app_access: true,
					admin_access: false,
				},
				USER.ADMIN.TOKEN,
			);

			console.log('policy created');

			const permission1 = await CreatePermission(
				vendor,
				{
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
				},
				USER.ADMIN.TOKEN,
			);

			const permission2 = await CreatePermission(
				vendor,
				{
					action: 'create',
					fields: ['id', 'user_created', 'date_created'],
					collection,
					permissions: null,
					policy,
					validation: null,
					presets: null,
				},
				USER.ADMIN.TOKEN,
			);

			console.log('permissions created');

			result.permissions.push(permission1.id, permission2.id);

			await CreateItem(
				vendor,
				{
					collection,
					item: {
						id: '1',
						user_created: randomUUID(),
						date_created: new Date().toISOString(),
					},
				},
				user.token,
			);

			await CreateItem(
				vendor,
				{
					collection,
					item: {
						id: '2',
						user_created: randomUUID(),
						date_created: new Date().toISOString(),
					},
				},
				user.token,
			);

			console.log('items created');
		});
	} catch (error) {
		result.isSeeded = false;
	}

	return result;
};
