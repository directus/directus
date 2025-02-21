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
		isSeeded: false,
		permissions: [],
		collection,
	};

	const promises = vendors.map(async (vendor) => {
		const role = 'EDITOR_ARTICLES';
		const policy = 'sample-policy';

		const user = await CreateUser(vendor, {
			email: 'sample@sample.com',
			password: '12345',
			name: 'John',
			role,
		});

		result.apiToken = user.token;

		await CreateRole(vendor, { name: role }, user.token);

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
			user.token,
		);

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
			user.token,
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
			user.token,
		);

		result.permissions.push(permission1.id, permission2.id);

		await CreateItem(vendor, {
			collection,
			item: {
				id: '1',
				user_created: randomUUID(),
				date_created: new Date().toISOString(),
			},
		});

		await CreateItem(vendor, {
			collection,
			item: {
				id: '2',
				user_created: randomUUID(),
				date_created: new Date().toISOString(),
			},
		});
	});

	await Promise.all(promises)
		.then(() => {
			result.isSeeded = true;
		})
		.catch(() => {
			result.isSeeded = false;
		});

	return result;
};
