import {
	CreateCollection,
	CreateField,
	CreateItem,
	CreatePermissionWithPolicy,
	CreateUser,
	DeleteCollection,
	type OptionsCreatePermissionPolicy,
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
	apiToken: string | null;
};

export const collection = 'articles';

export const seedDBStructure = () => {
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
	}

	const promises = vendors.map(async (vendor) => {
		const policyOptions: OptionsCreatePermissionPolicy = {
			policy: 'sample-policy',
			policyName: 'sample-policy',
		};

		const user = await CreateUser(vendor, {
			email: 'sample@sample.com',
			password: '12345',
			name: 'John',
			...policyOptions,
		});

		result.apiToken = user.token;

		const role = 'APP_ACCESS';

		await CreatePermissionWithPolicy(vendor, {
			...policyOptions,
			role,
			permission: {
				action: 'read',
				fields: ['user_created', 'date_created'],
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
				policy: policyOptions.policy as string,
				validation: null,
				presets: null,
			},
		});

		await CreatePermissionWithPolicy(vendor, {
			...policyOptions,
			role,
			permission: {
				action: 'create',
				fields: ['id', 'user_created', 'date_created'],
				collection,
				permissions: null,
				policy: policyOptions.policy as string,
				validation: null,
				presets: null,
			},
		});

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
