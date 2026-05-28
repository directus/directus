import { randomUUID } from 'crypto';
import {
	activateLicense,
	applyLicenseResolution,
	CORE_LICENSE,
	deactivateLicense,
	generateLicensePendingResolution,
	previewLicense,
	readLicense,
	readLicenseAddons,
	type ReadLicenseOutput,
	updateLicense,
} from '@directus/license';
import { createLicense, mockClient } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import {
	createCollection,
	createDirectus,
	createFlow,
	createPermission,
	createPolicy,
	createUser,
	deleteCollection,
	deleteFlow,
	deletePermission,
	deletePolicy,
	deleteUser,
	type DirectusClient,
	readCollection,
	readMe,
	rest,
	type RestClient,
	staticToken,
	updateSettings,
	withToken,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;

const originalLicense = createLicense({ meta: { name: 'og-license' } });

const unlimitedLicenses = createLicense({
	meta: { name: 'unlimited-license' },
	entitlements: {
		// meta
		sso_enabled: { default: true },
		custom_permission_rules_enabled: { default: true },
		custom_llms_enabled: { default: true },
		offline_enabled: { default: true },
		production_enabled: { default: true },
		telemetry_required: { default: false },

		// entitlements
		seats: { limit: -1 },
		collections: { limit: -1 },
		flows: { limit: -1 },
		activity_historical_timeframe: { limit: -1 },
		revision_historical_timeframe: { limit: -1 },
	},
});

const restrictedLicense = createLicense({
	meta: { name: 'fully-restricted' },
	entitlements: {
		// meta
		sso_enabled: { default: false },
		custom_permission_rules_enabled: { default: false },
		custom_llms_enabled: { default: false },
		offline_enabled: { default: false },
		production_enabled: { default: false },
		telemetry_required: { default: true },

		// entitlements
		seats: { limit: 1 },
		collections: { limit: 1 },
		flows: { limit: 1 },
		activity_historical_timeframe: { limit: 1 },
		revision_historical_timeframe: { limit: 1 },
	},
});

const seatsLimitedLicense = createLicense({
	meta: { name: 'seats-limited' },
	entitlements: { seats: { limit: 1 } },
});

const flowsLimitedLicense = createLicense({
	meta: { name: 'flows-limited' },
	entitlements: { flows: { limit: 1 } },
});

const ssoDisabledLicense = createLicense({
	meta: { name: 'sso-disabled' },
	entitlements: { sso_enabled: { default: false } },
});

const llmDisabledLicense = createLicense({
	meta: { name: 'llm-disabled' },
	entitlements: { custom_llms_enabled: { default: false } },
});

const customPermRulesDisabledLicense = createLicense({
	meta: { name: 'custom-perm-rules-disabled' },
	entitlements: { custom_permission_rules_enabled: { default: false } },
});

const seatsAddon = randomUUID();

const addonLicense = createLicense({
	meta: { name: 'addon-license' },
	entitlements: {
		seats: { limit: 1 },
	},
	addons: [
		{
			id: seatsAddon,
			active_quantity: 0,
			billing_interval: 'monthly',
			description: 'Alodda Seats addon',
			icon: 'group',
			min_quantity: 0,
			max_quantity: 10,
			name: 'Gimme more seats',
			pricing_summary: 'pay os som 💰',
			unit: 'seats',
			upgrade_required: false,
		},
	],
});

beforeAll(async () => {
	const devMode = process.env['NODE_ENV'] === 'development';

	directus = await sandbox(database, {
		dev: devMode,
		watch: devMode,
		prefix: database,
		env: {
			CACHE_SCHEMA: 'false',
			DB_FILENAME: `directus_test_${getUID()}.db`,
			LOG_LEVEL: 'debug',
		},
		extras: {
			license: true,
		},
		cache: false,
	});

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

	await mockClient.registerLicense(directus.env.LICENSE_API_URL!, originalLicense);
	await mockClient.registerLicense(directus.env.LICENSE_API_URL!, unlimitedLicenses);
	await mockClient.registerLicense(directus.env.LICENSE_API_URL!, restrictedLicense);
	await mockClient.registerLicense(directus.env.LICENSE_API_URL!, addonLicense);
	await mockClient.registerLicense(directus.env.LICENSE_API_URL!, seatsLimitedLicense);
	await mockClient.registerLicense(directus.env.LICENSE_API_URL!, flowsLimitedLicense);
	await mockClient.registerLicense(directus.env.LICENSE_API_URL!, ssoDisabledLicense);
	await mockClient.registerLicense(directus.env.LICENSE_API_URL!, llmDisabledLicense);
	await mockClient.registerLicense(directus.env.LICENSE_API_URL!, customPermRulesDisabledLicense);
});

afterAll(async () => {
	await directus?.stop();
});

describe('GET /license', () => {
	test('returns core tier when no license is active', async () => {
		const result = await api.request(readLicense());

		expect(result).toMatchObject({
			entitlements: CORE_LICENSE.entitlements,
			expires_at: CORE_LICENSE.meta.expires_at,
			grace_period: CORE_LICENSE.meta.grace_period,
			name: CORE_LICENSE.meta.name,
			offline: CORE_LICENSE.meta.offline,
			source: null,
			status: 'active',
			usage: expect.any(Object),
		});
	});
});

describe('POST /license', () => {
	test('returns license info after activation', async () => {
		await api.request(activateLicense({ license_key: originalLicense.key }));

		const licenseInfo: ReadLicenseOutput = await api.request(readLicense());

		expect(licenseInfo.name).toEqual(originalLicense.meta.name);
		expect(licenseInfo.entitlements).toEqual(originalLicense.entitlements);
		expect(licenseInfo.source).toEqual('settings');
		expect(licenseInfo.status).toEqual('active');

		// cleanup
		await api.request(deactivateLicense());
	});

	test('rejects activation when a license is already active', async () => {
		await api.request(activateLicense({ license_key: originalLicense.key }));

		await expect(api.request(activateLicense({ license_key: 'LICENSE' }))).rejects.toThrowError(
			'A license was already activated',
		);

		// cleanup
		await api.request(deactivateLicense());
	});
});

describe('PATCH /license', () => {
	test('rejects update from core', async () => {
		await expect(api.request(updateLicense({ license_key: 'LICENSE' }))).rejects.toThrowError();
	});

	test('returns updated license info after key change', async () => {
		// setup
		await api.request(activateLicense({ license_key: originalLicense.key }));

		// action
		await api.request(updateLicense({ license_key: unlimitedLicenses.key }));

		// assert
		const licenseInfo: ReadLicenseOutput = await api.request(readLicense());

		expect(licenseInfo).toMatchObject({
			entitlements: unlimitedLicenses.entitlements,
			name: unlimitedLicenses.meta.name,
			source: 'settings',
			status: 'active',
			usage: expect.any(Object),
		});

		// cleanup
		await api.request(deactivateLicense());
	});
});

describe('DELETE /license', () => {
	test('downgrades to core after deactivate', async () => {
		// setup
		await api.request(activateLicense({ license_key: originalLicense.key }));

		// action
		await api.request(deactivateLicense());

		const activeLicense = await api.request(readLicense());

		expect(activeLicense).toMatchObject({
			entitlements: CORE_LICENSE.entitlements,
			expires_at: CORE_LICENSE.meta.expires_at,
			grace_period: CORE_LICENSE.meta.grace_period,
			name: CORE_LICENSE.meta.name,
			offline: true,
			source: null,
			status: 'active',
			usage: expect.any(Object),
		});
	});
});

describe('POST /license/preview', () => {
	test('returns preview info for a registered key', async () => {
		const result = await api.request(previewLicense({ license_key: originalLicense.key }));

		expect(result).toEqual({
			expires_at: originalLicense.meta.expires_at,
			plan_name: originalLicense.name,
			production_enabled: true,
		});
	});
});

describe('POST /license/pending-resolution', () => {
	test('current mode with no violations returns empty', async () => {
		const result = await api.request(generateLicensePendingResolution());

		expect(result).toEqual([]);
	});

	test('current mode with violations returns required actions', async () => {
		// setup
		await api.request(createCollection({ collection: 'A', meta: {}, schema: {} }));
		await api.request(createCollection({ collection: 'B', meta: {}, schema: {} }));
		await api.request(activateLicense({ license_key: restrictedLicense.key }));

		// assert
		const result = await api.request(generateLicensePendingResolution());

		expect(result).toEqual([
			{
				candidates: ['A', 'B'],
				key: 'collections',
				kind: 'limit',
				limit: 1,
				usage: 2,
			},
		]);

		// cleanup
		await api.request(deactivateLicense());
		await api.request(deleteCollection('A'));
		await api.request(deleteCollection('B'));
	});

	test('preview mode against new license_key returns violations against that license', async () => {
		await api.request(createCollection({ collection: 'A', meta: {}, schema: {} }));
		await api.request(createCollection({ collection: 'B', meta: {}, schema: {} }));

		const result = await api.request(generateLicensePendingResolution({ license_key: restrictedLicense.key }));

		expect(result).toEqual([
			{
				candidates: ['A', 'B'],
				key: 'collections',
				kind: 'limit',
				limit: 1,
				usage: 2,
			},
		]);

		// cleanup
		await api.request(deleteCollection('A'));
		await api.request(deleteCollection('B'));
	});

	test('preview mode against null returns violations against core', async () => {
		// setup
		await api.request(activateLicense({ license_key: unlimitedLicenses.key }));

		const policy = await api.request(createPolicy({ name: 'Lorem' }));

		const permission = await api.request(
			createPermission({ action: 'read', collection: 'directus_users', fields: ['id'], policy: policy['id'] }),
		);

		const result = await api.request(generateLicensePendingResolution({ license_key: null }));

		expect(result).toEqual([
			{
				kind: 'feature_gate',
				key: 'custom_permission_rules_enabled',
			},
		]);

		// cleanup
		await api.request(deletePermission(permission['id']));
		await api.request(deletePolicy(policy['id']));
		await api.request(deactivateLicense());
	});

	describe('limit kinds', () => {
		test('seats over limit reports active admin + app users as candidates', async () => {
			const adminMe = await api.request(readMe());

			const extraUser = await api.request(
				createUser({
					first_name: 'Seats',
					last_name: 'Candidate',
					email: 'seats-candidate@example.com',
					password: 'pw',
					status: 'active',
					role: adminMe['role'],
				}),
			);

			await api.request(activateLicense({ license_key: seatsLimitedLicense.key }));

			const result = await api.request(generateLicensePendingResolution());

			expect(result).toEqual([
				{
					key: 'seats',
					kind: 'limit',
					limit: 1,
					usage: 2,
					candidates: [
						{
							admin: true,
							avatar: null,
							email: 'seats-candidate@example.com',
							first_name: 'Seats',
							id: extraUser['id'],
							last_name: 'Candidate',
						},
					],
				},
			]);

			// cleanup
			await api.request(deactivateLicense());
			await api.request(deleteUser(extraUser['id']));
		});

		test('flows over limit reports active flows as candidates', async () => {
			const flows = await Promise.all([
				api.request(createFlow({ name: 'flow-1', trigger: 'manual', status: 'active' })),
				api.request(createFlow({ name: 'flow-2', trigger: 'manual', status: 'active' })),
				api.request(createFlow({ name: 'flow-3', trigger: 'manual', status: 'inactive' })),
			]);

			await api.request(activateLicense({ license_key: flowsLimitedLicense.key }));

			const result = await api.request(generateLicensePendingResolution());

			expect(result).toEqual([
				{
					key: 'flows',
					kind: 'limit',
					limit: 1,
					usage: 2,
					candidates: expect.arrayContaining([
						expect.objectContaining({ id: flows[0]['id'], name: 'flow-1' }),
						expect.objectContaining({ id: flows[1]['id'], name: 'flow-2' }),
					]),
				},
			]);

			// cleanup
			await api.request(deactivateLicense());
			for (const f of flows) await api.request(deleteFlow(f['id']));
		});
	});

	describe('feature_gate kinds', () => {
		test('custom_llms_enabled when LLM settings are populated', async () => {
			await api.request(activateLicense({ license_key: unlimitedLicenses.key }));
			await api.request(updateSettings({ ai_openai_compatible_name: 'lorem' } as any));
			await api.request(updateLicense({ license_key: llmDisabledLicense.key }));

			const result = await api.request(generateLicensePendingResolution());

			expect(result).toEqual([{ key: 'custom_llms_enabled', kind: 'feature_gate' }]);

			// cleanup
			await api.request(deactivateLicense());
			await api.request(updateSettings({ ai_openai_compatible_name: null } as any));
		});

		test('custom_permission_rules_enabled when a custom-rule permission exists', async () => {
			await api.request(activateLicense({ license_key: unlimitedLicenses.key }));

			const policy = await api.request(createPolicy({ name: 'Lorem' }));

			const permission = await api.request(
				createPermission({
					action: 'read',
					collection: 'directus_users',
					policy: policy['id'],
					fields: ['first_name'],
				}),
			);

			await api.request(updateLicense({ license_key: customPermRulesDisabledLicense.key }));

			const result = await api.request(generateLicensePendingResolution());

			expect(result).toEqual([{ key: 'custom_permission_rules_enabled', kind: 'feature_gate' }]);

			// cleanup
			await api.request(deactivateLicense());
			await api.request(deletePermission(permission['id']));
			await api.request(deletePolicy(policy['id']));
		});

		describe('sso_enabled', () => {
			test('reports gate with empty blockers when admin has email and password', async () => {
				const adminMe = await api.request(readMe());

				const ssoUser = await api.request(
					createUser({
						email: 'sso-no-blockers@example.com',
						password: '1234',
						status: 'active',
						token: '1234',
						provider: 'oidc',
						role: adminMe['role'],
					}),
				);

				await api.request(activateLicense({ license_key: ssoDisabledLicense.key }));

				const result = await api.request(withToken('1234', generateLicensePendingResolution()));

				expect(result).toEqual([{ key: 'sso_enabled', kind: 'feature_gate', blockers: [] }]);

				// cleanup
				await api.request(deactivateLicense());
				await api.request(deleteUser(ssoUser['id']));
			});

			test('reports ADMIN_MISSING_EMAIL when caller has no email', async () => {
				const adminMe = await api.request(readMe());

				const ssoUser = await api.request(
					createUser({
						password: '1234',
						status: 'active',
						token: '1234',
						provider: 'oidc',
						role: adminMe['role'],
					}),
				);

				await api.request(activateLicense({ license_key: ssoDisabledLicense.key }));

				const result = await api.request(withToken('1234', generateLicensePendingResolution()));

				expect(result).toEqual([{ key: 'sso_enabled', kind: 'feature_gate', blockers: ['ADMIN_MISSING_EMAIL'] }]);

				// cleanup
				await api.request(deactivateLicense());
				await api.request(deleteUser(ssoUser['id']));
			});

			test('reports ADMIN_MISSING_PASSWORD when caller has no password', async () => {
				const adminMe = await api.request(readMe());

				const ssoUser = await api.request(
					createUser({
						email: 'sso-blockers-pw@example.com',
						status: 'active',
						token: '1234',
						provider: 'oidc',
						role: adminMe['role'],
					}),
				);

				await api.request(activateLicense({ license_key: ssoDisabledLicense.key }));

				const result = await api.request(withToken('1234', generateLicensePendingResolution()));

				expect(result).toEqual([{ key: 'sso_enabled', kind: 'feature_gate', blockers: ['ADMIN_MISSING_PASSWORD'] }]);

				// cleanup
				await api.request(deactivateLicense());
				await api.request(deleteUser(ssoUser['id']));
			});

			test('reports both blockers when caller has neither', async () => {
				const adminMe = await api.request(readMe());

				const ssoUser = await api.request(
					createUser({
						status: 'active',
						token: '1234',
						provider: 'oidc',
						role: adminMe['role'],
					}),
				);

				await api.request(activateLicense({ license_key: ssoDisabledLicense.key }));

				const result = await api.request(withToken('1234', generateLicensePendingResolution()));

				expect(result).toMatchObject([{ key: 'sso_enabled', kind: 'feature_gate' }]);
				expect((result[0] as any).blockers).toEqual(['ADMIN_MISSING_EMAIL', 'ADMIN_MISSING_PASSWORD']);

				// cleanup
				await api.request(deactivateLicense());
				await api.request(deleteUser(ssoUser['id']));
			});
		});
	});

	describe('response shape', () => {
		test('multiple violations are returned in single response', async () => {
			await api.request(activateLicense({ license_key: unlimitedLicenses.key }));

			const adminMe = await api.request(readMe());

			await api.request(createCollection({ collection: 'A', meta: {}, schema: {} }));
			await api.request(createCollection({ collection: 'B', meta: {}, schema: {} }));
			const flowA = await api.request(createFlow({ name: 'A', trigger: 'manual', status: 'active' }));
			const flowB = await api.request(createFlow({ name: 'B', trigger: 'manual', status: 'active' }));

			const userA = await api.request(
				createUser({
					first_name: 'A',
					email: 'a@example.com',
					password: 'pw',
					status: 'active',
					role: adminMe['role'],
				}),
			);

			const userB = await api.request(
				createUser({
					first_name: 'B',
					email: 'b@example.com',
					provider: 'oidc',
					status: 'active',
					role: adminMe['role'],
				}),
			);

			await api.request(updateSettings({ ai_openai_compatible_name: 'lorem' } as any));

			const policy = await api.request(createPolicy({ name: 'Lorem' }));

			const permission: any = await api.request(
				createPermission({
					action: 'read',
					collection: 'directus_users',
					policy,
					fields: ['first_name'],
				}),
			);

			await api.request(updateLicense({ license_key: restrictedLicense.key }));

			const result = await api.request(generateLicensePendingResolution());

			const limitKeys = result.filter((r) => r.kind === 'limit').map((r) => r.key);
			const gateKeys = result.filter((r) => r.kind === 'feature_gate').map((r) => r.key);

			expect(limitKeys).toEqual(expect.arrayContaining(['seats', 'collections', 'flows']));

			expect(gateKeys).toEqual(
				expect.arrayContaining(['sso_enabled', 'custom_llms_enabled', 'custom_permission_rules_enabled']),
			);

			// cleanup
			await api.request(deactivateLicense());
			await api.request(updateSettings({ ai_openai_compatible_name: null } as any));
			await api.request(deletePermission(permission.id));
			await api.request(deleteFlow(flowA['id']));
			await api.request(deleteFlow(flowB['id']));
			await api.request(deleteUser(userA['id']));
			await api.request(deleteUser(userB['id']));
			await api.request(deleteCollection('A'));
			await api.request(deleteCollection('B'));
		});
	});
});

describe('POST /license/resolve', () => {
	test('allows partial resolution of a subset of conflicts', async () => {
		await api.request(activateLicense({ license_key: unlimitedLicenses.key }));

		// setup
		await api.request(createCollection({ collection: 'A', meta: {}, schema: {} }));
		await api.request(createCollection({ collection: 'B', meta: {}, schema: {} }));
		await api.request(updateSettings({ ai_openai_compatible_name: 'lorem' } as any));
		await api.request(updateLicense({ license_key: restrictedLicense.key }));

		await api.request(applyLicenseResolution({ collections: ['B'] }));

		const result = await api.request(generateLicensePendingResolution());

		expect(result).toEqual([
			{
				key: 'custom_llms_enabled',
				kind: 'feature_gate',
			},
		]);

		const collectionA = await api.request(readCollection('A'));
		const collectionB = await api.request(readCollection('B'));

		expect(collectionA).toMatchObject({
			collection: 'A',
			meta: {
				status: 'active',
			},
		});

		expect(collectionB).toMatchObject({
			collection: 'B',
			meta: {
				status: 'inactive',
			},
		});

		// cleanup
		await api.request(deactivateLicense());
		await api.request(updateSettings({ ai_openai_compatible_name: null } as any));
		await api.request(deleteCollection('A'));
		await api.request(deleteCollection('B'));
	});

	test('fully resolving all conflicts clears pending resolution', async () => {
		// setup
		await api.request(activateLicense({ license_key: unlimitedLicenses.key }));

		const adminMe = await api.request(readMe());

		const newUser = await api.request(
			createUser({
				first_name: 'John',
				last_name: 'Doe',
				email: 'fully-resolve@example.com',
				password: 'pw',
				status: 'active',
				role: adminMe['role'],
			}),
		);

		await api.request(updateSettings({ ai_openai_compatible_name: 'lorem' } as any));
		await api.request(updateLicense({ license_key: restrictedLicense.key }));

		const before = await api.request(generateLicensePendingResolution());
		expect(before.length).toBeGreaterThan(0);

		// action
		await api.request(applyLicenseResolution({ seats: [newUser['id']] }));
		await api.request(updateSettings({ ai_openai_compatible_name: null } as any));

		// assert
		const after = await api.request(generateLicensePendingResolution());
		expect(after).toEqual([]);

		// cleanup
		await api.request(deactivateLicense());
		await api.request(deleteUser(newUser['id']));
	});
});

describe('License addons', () => {
	describe('without an active license', () => {
		test('rejects when attempting to request addons for non manageable license', async () => {
			await expect(api.request(readLicenseAddons())).rejects.toThrowError('cannot manage addons');
		});
	});

	describe('with an active license that has addons', () => {
		beforeAll(async () => {
			await api.request(activateLicense({ license_key: addonLicense.key }));
		});

		afterAll(async () => {
			await api.request(deactivateLicense());
		});

		test('returns the addon list', async () => {
			const result = await api.request(readLicenseAddons());

			expect(result).toEqual([
				{
					active_quantity: 0,
					description: 'Alodda Seats addon',
					billing_interval: 'monthly',
					icon: 'group',
					id: seatsAddon,
					max_quantity: 10,
					min_quantity: 0,
					name: 'Gimme more seats',
					pricing_summary: 'pay os som 💰',
					upgrade_required: false,
				},
			]);
		});
	});
});
