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
	updatePermission,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { merge } from 'lodash-es';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createSandboxOptions } from '../shared.js';

const CUSTOM_RULE_SHAPES = [
	['validation', JSON.stringify({ first_name: { _nnull: true } })],
	['presets', JSON.stringify({ status: 'draft' })],
	['permissions', JSON.stringify({ id: { _eq: 1 } })],
	['fields', ['email']],
] as const;

const FULL_CUSTOM_RULE_SHAPE = CUSTOM_RULE_SHAPES.reduce(
	(acc, [label, shape]) => ({ ...acc, [label]: JSON.stringify(shape) }),
	{},
);

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

const restrictedLicense = createLicense({
	meta: { name: 'cpr-restricted' },
	entitlements: { custom_permission_rules_enabled: { default: false } },
});

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
						mockClient.registerLicense(base, restrictedLicense);
						mockClient.registerLicense(base, unlimitedLicense);
					},
				},
			}),
		);

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

		// seed permissions
		await directus.knex!('directus_permissions').insert(buildPermission({ fields: '*' }));

		// specifcally test fields: null (DELETE permission)
		await directus.knex!('directus_permissions').insert(buildPermission({ fields: null, action: 'delete' }));

		for (const [field, shape] of CUSTOM_RULE_SHAPES) {
			await directus.knex!('directus_permissions').insert(
				buildPermission({ [field]: field === 'fields' ? shape.join(',') : shape }),
			);
		}

		await directus.knex!('directus_permissions').insert(buildPermission(FULL_CUSTOM_RULE_SHAPE));
	});

	afterAll(async () => {
		await directus?.stop();
	});

	describe('custom_permission_rules_enabled=false', () => {
		beforeAll(async () => {
			await api.request(activateLicense({ license_key: restrictedLicense.key }));
		});

		afterAll(async () => {
			await api.request(deactivateLicense());
		});

		test.each(CUSTOM_RULE_SHAPES)(
			'POST /permissions with custom %s rejects with RESOURCE_RESTRICTED',
			async (field, shape) => {
				await expect(api.request(createPermission(buildPermission({ [field]: shape })))).rejects.toMatchObject({
					errors: [
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: 'RESOURCE_RESTRICTED',
								category: 'custom_permission_rules_enabled',
							}),
						}),
					],
				});
			},
		);

		test('POST /permissions with all custom fields rejects with RESOURCE_RESTRICTED', async () => {
			await expect(api.request(createPermission(buildPermission(FULL_CUSTOM_RULE_SHAPE)))).rejects.toMatchObject(
				{
					errors: [
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: 'RESOURCE_RESTRICTED',
								category: 'custom_permission_rules_enabled',
							}),
						}),
					],
				},
			);
		});

		test('GET /permissions filters out custom rules', async () => {
			const rows = await api.request(readPermissions({ filter: { collection: { _eq: getUID() } }, limit: -1 }));

			expect(rows).toHaveLength(2);
		});

		test('POST /permissions with wildcard fields and no other custom predicates succeeds', async () => {
			await expect(api.request(createPermission(buildPermission({ fields: ['*'] })))).resolves.toBeDefined();
		});

		test('POST /permissions (batch) with mixed allowed + restricted rows rejects', async () => {
			await expect(
				api.request(
					createPermissions([
						buildPermission({
							action: 'read',
							fields: ['*'],
						}),
						buildPermission({
							action: 'read',
							fields: ['*'],
							validation: { first_name: { _nnull: true } },
						}),
					] as any),
				),
			).rejects.toMatchObject({
				errors: [
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: 'RESOURCE_RESTRICTED',
							category: 'custom_permission_rules_enabled',
						}),
					}),
				],
			});
		});

		test('PATCH /permissions/:id of unrelated field on non-custom row succeeds', async () => {
			const permission = await api.request(createPermission(buildPermission()));

			await expect(api.request(updatePermission(permission.id, { action: 'update' }))).resolves.toBeDefined();
		});

		test('DELETE /permissions/:id of custom-rule row succeeds', async () => {
			await directus.knex!('directus_permissions').insert(
				buildPermission({
					collection: `${getUID()}-delete-test`,
					validation: JSON.stringify({ first_name: { _nnull: true } }),
				}),
			);

			const row = await directus.knex!('directus_permissions')
				.select('id')
				.where('collection', `${getUID()}-delete-test`)
				.first();

			await expect(api.request(deletePermission(row.id)));
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
			await expect(
				api.request(createPermission(buildPermission({ [field]: JSON.stringify(shape) }))),
			).resolves.toBeDefined();
		});

		test('POST /permissions with all custom fields succeeds', async () => {
			await expect(
				api.request(createPermission(buildPermission(FULL_CUSTOM_RULE_SHAPE))),
			).resolves.toBeDefined();
		});

		test('GET /permissions returns custom rules', async () => {
			const rows = await api.request(readPermissions({ filter: { collection: { _eq: getUID() } }, limit: -1 }));

			expect(rows.some((row) => row.validation || row.presets || row.permissions || row.fields)).toBe(true);
		});
	});
});
