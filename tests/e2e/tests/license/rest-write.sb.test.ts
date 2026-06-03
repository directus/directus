import { randomUUID } from 'node:crypto';
import {
	activateLicense,
	applyLicenseResolution,
	CORE_LICENSE,
	deactivateLicense,
	deleteLicenseAddon,
	generateLicensePendingResolution,
	previewLicense,
	readLicense,
	readLicenseAddons,
	updateLicense,
	updateLicenseAddon,
} from '@directus/license';
import { mockClient } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import {
	createCollection,
	createDirectus,
	createPermission,
	createPolicy,
	createUser,
	deleteCollection,
	deletePolicy,
	deleteUser,
	type DirectusClient,
	readMe,
	rest,
	type RestClient,
	staticToken,
	updateSettings,
	withToken,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { createLicense, LICENSE_KEYS } from './__fixtures__/licenses.js';
import { withDefaultSandboxOptions } from './__fixtures__/sandbox.js';

const SEATS_ADDON_ID = randomUUID();
const COLLECTIONS_ADDON_ID = randomUUID();

const baseLicense = createLicense({ meta: { name: 'lifecycle-base' } });
const upgradeLicense = createLicense({ meta: { name: 'lifecycle-upgrade' } });

const addonLicense = createLicense({
	meta: { name: 'lifecycle-addons' },
	entitlements: { seats: { limit: 1 }, collections: { limit: 1 } },
	addons: [
		{
			id: SEATS_ADDON_ID,
			active_quantity: 0,
			billing_interval: 'monthly',
			description: 'Extra seats',
			icon: 'group',
			min_quantity: 0,
			max_quantity: 10,
			name: 'Extra seats',
			pricing_summary: 'pay something',
			unit: 'seats',
			upgrade_required: false,
		},
		{
			id: COLLECTIONS_ADDON_ID,
			active_quantity: 0,
			billing_interval: 'monthly',
			description: 'Extra collections',
			icon: 'deployed_code',
			min_quantity: 0,
			max_quantity: 10,
			name: 'Extra collections',
			pricing_summary: 'pay something',
			unit: 'collections',
			upgrade_required: false,
		},
	],
});

const ssoDisabledLicense = createLicense({
	meta: { name: 'lifecycle-sso-disabled' },
	entitlements: { sso_enabled: { default: false } },
});

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;

beforeAll(async () => {
	directus = await sandbox(
		database,
		withDefaultSandboxOptions({
			extras: { license: true },
		}),
	);

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

	for (const license of [baseLicense, upgradeLicense, addonLicense, ssoDisabledLicense]) {
		await mockClient.registerLicense(directus.env.LICENSE_API_URL!, license);
	}
});

afterAll(async () => {
	await directus?.stop();
});

afterEach(async () => {
	try {
		await api.request(deactivateLicense());
	} catch {
		// no license to deactivate
	}
});

describe('POST /licenses', () => {
	test('first activation license with source=settings', async () => {
		await api.request(activateLicense({ license_key: baseLicense.key }));

		const info = await api.request(readLicense());

		expect(info).toMatchObject({
			name: baseLicense.meta.name,
			source: 'settings',
			status: 'active',
			entitlements: baseLicense.entitlements,
		});
	});

	test('activate while already active rejects', async () => {
		await api.request(activateLicense({ license_key: baseLicense.key }));

		await expect(api.request(activateLicense({ license_key: 'D0000-OTHER' }))).rejects.toThrowError(
			'already activated',
		);
	});
});

describe('PATCH /licenses', () => {
	test('update from active license replaces with new license', async () => {
		await api.request(activateLicense({ license_key: baseLicense.key }));

		await api.request(updateLicense({ license_key: upgradeLicense.key }));

		const info = await api.request(readLicense());

		expect(info).toMatchObject({
			name: upgradeLicense.meta.name,
			source: 'settings',
			status: 'active',
			entitlements: upgradeLicense.entitlements,
		});
	});

	test('update from CORE rejects', async () => {
		await expect(api.request(updateLicense({ license_key: baseLicense.key }))).rejects.toThrow();
	});
});

describe('DELETE /licenses', () => {
	test('deactivate active license drops back to CORE with source=null', async () => {
		await api.request(activateLicense({ license_key: baseLicense.key }));

		await api.request(deactivateLicense());

		const info = await api.request(readLicense());

		expect(info).toMatchObject({
			name: CORE_LICENSE.meta.name,
			source: null,
			status: 'active',
			entitlements: CORE_LICENSE.entitlements,
		});
	});
});

describe('POST /licenses/preview', () => {
	test('preview registered key', async () => {
		const preview = await api.request(previewLicense({ license_key: baseLicense.key }));

		// renews_at is optional in LicensePreviewOutput; the base fixture sets none, so it is absent.
		expect(preview).toEqual({
			plan_name: baseLicense.name,
			expires_at: baseLicense.meta.expires_at,
			production_enabled: true,
		});
	});

	test('preview reflects the requested key, not the active license', async () => {
		await api.request(activateLicense({ license_key: baseLicense.key }));

		const preview = await api.request(previewLicense({ license_key: upgradeLicense.key }));

		expect(preview).toMatchObject({ plan_name: upgradeLicense.name });
	});
});

describe('POST /licenses/pending-resolution', () => {
	test('no violations against current license returns empty array', async () => {
		const result = await api.request(generateLicensePendingResolution());

		expect(result).toEqual([]);
	});

	test('preview against current license with collections over limit reports collections as limit violation', async () => {
		await api.request(createCollection({ collection: 'pr_A', meta: {}, schema: {} }));
		await api.request(createCollection({ collection: 'pr_B', meta: {}, schema: {} }));
		await api.request(activateLicense({ license_key: LICENSE_KEYS.TINY }));

		try {
			const result = await api.request(generateLicensePendingResolution());

			expect(result).toEqual([expect.objectContaining({ key: 'collections', kind: 'limit', limit: 1, usage: 2 })]);
		} finally {
			await api.request(deleteCollection('pr_A'));
			await api.request(deleteCollection('pr_B'));
		}
	});

	test('preview resolution against null license reports CORE feature_gate violations', async () => {
		await api.request(activateLicense({ license_key: LICENSE_KEYS.UNLIMITED }));
		const policy = await api.request(createPolicy({ name: 'pr-policy' }));

		await api.request(
			createPermission({ policy: policy['id'], collection: 'directus_users', action: 'read', fields: ['first_name'] }),
		);

		try {
			const result = await api.request(generateLicensePendingResolution({ license_key: null }));

			expect(result).toContainEqual(expect.objectContaining({ kind: 'feature_gate' }));
		} finally {
			await api.request(deletePolicy(policy['id']));
		}
	});
});

describe('POST /licenses/resolve', () => {
	test('partial resolution clears resolved violations and leaves others pending', async () => {
		await api.request(activateLicense({ license_key: LICENSE_KEYS.UNLIMITED }));
		await api.request(createCollection({ collection: 'res_A', meta: {}, schema: {} }));
		await api.request(createCollection({ collection: 'res_B', meta: {}, schema: {} }));
		await api.request(updateSettings({ ai_openai_compatible_name: 'set' } as any));
		await api.request(updateLicense({ license_key: LICENSE_KEYS.TINY }));

		try {
			await api.request(applyLicenseResolution({ collections: ['res_B'] }));

			const result = await api.request(generateLicensePendingResolution());

			// Collections resolved; LLM feature_gate still pending
			expect(result).toEqual([expect.objectContaining({ key: 'custom_llms_enabled', kind: 'feature_gate' })]);
		} finally {
			await api.request(updateSettings({ ai_openai_compatible_name: null } as any));
			await api.request(deleteCollection('res_A'));
			await api.request(deleteCollection('res_B'));
		}
	});
});

describe('sso_enabled resolution', () => {
	const createdSsoUsers: string[] = [];

	afterEach(async () => {
		while (createdSsoUsers.length > 0) {
			const id = createdSsoUsers.pop()!;

			try {
				await api.request(deleteUser(id));
			} catch {
				// already deleted
			}
		}
	});

	describe('POST /licenses/pending-resolution', () => {
		test('caller without password fallback: pending-resolution reports ADMIN_MISSING_PASSWORD blocker', async () => {
			await api.request(activateLicense({ license_key: LICENSE_KEYS.UNLIMITED }));
			const adminMe = await api.request(readMe());

			const ssoUser = await api.request(
				createUser({
					email: 'sso-blocker-pw@example.com',
					status: 'active',
					token: 'sso-blocker-pw-token',
					provider: 'oidc',
					role: adminMe['role'],
				}),
			);

			createdSsoUsers.push(ssoUser['id'] as string);
			await api.request(updateLicense({ license_key: ssoDisabledLicense.key }));

			const result = await api.request(withToken('sso-blocker-pw-token', generateLicensePendingResolution()));

			expect(result).toEqual([{ key: 'sso_enabled', kind: 'feature_gate', blockers: ['ADMIN_MISSING_PASSWORD'] }]);
		});
	});

	describe('POST /licenses/resolve (sso_enabled)', () => {
		test('apply resolution removing SSO users: pending-resolution clears', async () => {
			await api.request(activateLicense({ license_key: LICENSE_KEYS.UNLIMITED }));
			const adminMe = await api.request(readMe());

			const ssoUser = await api.request(
				createUser({
					email: 'sso-resolve@example.com',
					password: 'pw',
					status: 'active',
					provider: 'oidc',
					role: adminMe['role'],
				}),
			);

			createdSsoUsers.push(ssoUser['id'] as string);
			await api.request(updateLicense({ license_key: ssoDisabledLicense.key }));

			const before = await api.request(generateLicensePendingResolution());
			expect(before).toEqual([expect.objectContaining({ key: 'sso_enabled', kind: 'feature_gate' })]);

			await api.request(applyLicenseResolution({ sso_enabled: { admin: {} } }));

			const after = await api.request(generateLicensePendingResolution());
			expect(after).toEqual([]);
		});
	});
});

describe('addons', () => {
	test('GET /licenses/addons with no active license rejects', async () => {
		await expect(api.request(readLicenseAddons())).rejects.toThrowError('cannot manage addons');
	});

	test('GET /licenses/addons with active license returns the registered addons', async () => {
		await api.request(activateLicense({ license_key: addonLicense.key }));

		const addons = await api.request(readLicenseAddons());

		expect(addons).toHaveLength(2);

		expect(addons).toContainEqual(expect.objectContaining({ id: SEATS_ADDON_ID, active_quantity: 0 }));

		expect(addons).toContainEqual(expect.objectContaining({ id: COLLECTIONS_ADDON_ID, active_quantity: 0 }));
	});

	test('PATCH /licenses/addons/:id setting quantity from 0 to 5 persists the new active_quantity', async () => {
		await api.request(activateLicense({ license_key: addonLicense.key }));

		await api.request(updateLicenseAddon(SEATS_ADDON_ID, { quantity: 5 }));

		const addons = (await api.request(readLicenseAddons())) as { id: string }[];
		const seats = addons.find((a) => a.id === SEATS_ADDON_ID);

		expect(seats).toMatchObject({ id: SEATS_ADDON_ID, active_quantity: 5 });
	});

	test('PATCH /licenses/addons/:id with quantity above max_quantity rejects', async () => {
		await api.request(activateLicense({ license_key: addonLicense.key }));

		await expect(api.request(updateLicenseAddon(SEATS_ADDON_ID, { quantity: 99 }))).rejects.toThrow();
	});

	test('PATCH /licenses/addons/:id leaves other addons unchanged', async () => {
		await api.request(activateLicense({ license_key: addonLicense.key }));

		await api.request(updateLicenseAddon(SEATS_ADDON_ID, { quantity: 3 }));

		const addons = (await api.request(readLicenseAddons())) as { id: string }[];
		const collections = addons.find((a) => a.id === COLLECTIONS_ADDON_ID);

		expect(collections).toMatchObject({ id: COLLECTIONS_ADDON_ID, active_quantity: 0 });
	});

	test('DELETE /licenses/addons/:id after non-zero quantity clears the active quantity', async () => {
		await api.request(activateLicense({ license_key: addonLicense.key }));
		await api.request(updateLicenseAddon(SEATS_ADDON_ID, { quantity: 4 }));

		await api.request(deleteLicenseAddon(SEATS_ADDON_ID));

		const addons = (await api.request(readLicenseAddons())) as { id: string; active_quantity: number }[];
		const seats = addons.find((a) => a.id === SEATS_ADDON_ID);

		expect(seats?.active_quantity ?? 0).toBe(0);
	});
});
