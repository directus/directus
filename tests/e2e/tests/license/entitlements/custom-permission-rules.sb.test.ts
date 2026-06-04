import { activateLicense, deactivateLicense } from '@directus/license';
import { createLicense, mockClient } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import {
	createDirectus,
	createPermission,
	createPermissions,
	deletePermission,
	type DirectusClient,
	readPermissions,
	rest,
	type RestClient,
	staticToken,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { merge } from 'lodash-es';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createSandboxOptions } from '../shared.js';

const CUSTOM_RULE_SHAPES = [
	['validation', { first_name: { _nnull: true } }],
	['presets', { status: 'draft' }],
	['permissions', { id: { _eq: 1 } }],
	['fields', ['email']],
] as const;

const FULL_CUSTOM_RULE_SHAPE = Object.fromEntries(CUSTOM_RULE_SHAPES);

function permissionToDb(permission: Record<string, unknown>): Record<string, unknown> {
	if (Array.isArray(permission['fields'])) {
		permission['fields'] = permission['fields'].join(',');
	}

	for (const key of ['permissions', 'validation', 'presets']) {
		const value = permission[key];

		if (value && typeof value === 'object') {
			permission[key] = JSON.stringify(value);
		}
	}

	return permission;
}

const restrictedErrorMatcher = {
	errors: [
		expect.objectContaining({
			extensions: expect.objectContaining({
				code: 'RESOURCE_RESTRICTED',
				category: 'custom_permission_rules_enabled',
			}),
		}),
	],
};

function buildPermission(overrides?: Record<string, unknown>) {
	return merge(
		{
			collection: getUID(),
			action: 'read',
			fields: ['*'],
			// public policy id
			policy: 'abf8a154-5b1c-4a46-ac9c-7300570f4f17',
		},
		overrides,
	);
}

const unlimitedLicense = createLicense({
	meta: { name: 'cpr-unlimited' },
	entitlements: { custom_permission_rules_enabled: { default: true } },
});

describe('custom_permission_rules_enabled', () => {
	let directus: Sandbox;
	let api: DirectusClient<unknown> & RestClient<unknown>;

	beforeAll(async () => {
		directus = await sandbox(
			database,
			createSandboxOptions({
				extras: { license: true },
				knex: true,
				hooks: {
					beforeApi: async ({ env }) => {
						const base = `http://localhost:${env.LICENSE_PORT}`;
						await mockClient.registerLicense(base, unlimitedLicense);
					},
				},
			}),
		);

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

		const seeds = [
			buildPermission({ fields: ['*'] }),
			...CUSTOM_RULE_SHAPES.map(([field, shape]) => buildPermission({ [field]: shape })),
			buildPermission(FULL_CUSTOM_RULE_SHAPE),
		];

		for (const seed of seeds) {
			await directus.knex!('directus_permissions').insert(permissionToDb(seed));
		}
	});

	afterAll(async () => {
		await directus?.stop();
	});

	describe('custom_permission_rules_enabled=false', () => {
		test.each(CUSTOM_RULE_SHAPES)(
			'POST /permissions with custom %s rejects with RESOURCE_RESTRICTED',
			async (field, shape) => {
				await expect(api.request(createPermission(buildPermission({ [field]: shape })))).rejects.toMatchObject(
					restrictedErrorMatcher,
				);
			},
		);

		test('POST /permissions with all custom fields rejects with RESOURCE_RESTRICTED', async () => {
			await expect(api.request(createPermission(buildPermission(FULL_CUSTOM_RULE_SHAPE)))).rejects.toMatchObject(
				restrictedErrorMatcher,
			);
		});

		test('GET /permissions filters out custom rules', async () => {
			const rows = await api.request(readPermissions({ filter: { collection: { _eq: getUID() } }, limit: -1 }));

			expect(rows).toHaveLength(1);
		});

		test('POST /permissions with wildcard fields and no other custom predicates succeeds', async () => {
			await expect(api.request(createPermission(buildPermission({ fields: ['*'] })))).resolves.toBeDefined();
		});

		test('POST /permissions (batch) with mixed allowed + restricted rows rejects', async () => {
			await expect(
				api.request(
					createPermissions([
						buildPermission({ action: 'read', fields: ['*'] }),
						buildPermission({ action: 'read', fields: ['*'], validation: { first_name: { _nnull: true } } }),
					] as any),
				),
			).rejects.toMatchObject(restrictedErrorMatcher);
		});

		// LICENSE-TODO: Relax restrictions on patch requests to allow no fields
		// test('PATCH /permissions/:id of unrelated field on non-custom row succeeds', async () => {
		// 	const permission = await api.request(createPermission(buildPermission()));

		// 	await expect(api.request(updatePermission(permission.id, { action: 'update' }))).resolves.toBeDefined();
		// });

		test('DELETE /permissions/:id of custom-rule row succeeds', async () => {
			const collection = `${getUID()}-delete-test`;

			await directus.knex!('directus_permissions').insert(
				permissionToDb(buildPermission({ collection, validation: { first_name: { _nnull: true } } })),
			);

			const row = await directus.knex!('directus_permissions').select('id').where({ collection }).first();

			await expect(api.request(deletePermission(row.id))).resolves.not.toThrow();
		});
	});

	describe('custom_permission_rules_enabled=true', () => {
		beforeAll(async () => {
			await api.request(activateLicense({ license_key: unlimitedLicense.key }));
		});

		afterAll(async () => {
			await api.request(deactivateLicense());
		});

		test.each(CUSTOM_RULE_SHAPES)('POST /permissions with custom %s succeeds', async (field, shape) => {
			await expect(api.request(createPermission(buildPermission({ [field]: shape })))).resolves.toBeDefined();
		});

		test('POST /permissions with all custom fields succeeds', async () => {
			await expect(api.request(createPermission(buildPermission(FULL_CUSTOM_RULE_SHAPE)))).resolves.toBeDefined();
		});

		test('GET /permissions returns custom rules', async () => {
			const rows = await api.request(readPermissions({ filter: { collection: { _eq: getUID() } }, limit: -1 }));

			expect(rows.some((row) => row.validation || row.presets || row.permissions || row.fields)).toBe(true);
		});
	});
});
