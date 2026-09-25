import { randomUUID } from 'node:crypto';
import {
	activateLicense,
	applyLicenseResolution,
	deactivateLicense,
	deleteLicenseAddon,
	DIRECTUS_CORE_LICENSE,
	generateLicensePendingResolution,
	previewLicense,
	readLicense,
	readLicenseAddons,
	type ReadLicenseOutput,
	updateLicense,
	updateLicenseAddon,
} from '@directus/license';
import { mockClient } from '@directus/mock-license-server';
import { type Sandbox } from '@directus/sandbox';
import {
	createCollection,
	createDirectus,
	createPermission,
	createPolicy,
	createRole,
	createUser,
	deleteCollection,
	deletePolicy,
	deleteRole,
	deleteUser,
	type DirectusClient,
	readMe,
	readPermissions,
	rest,
	type RestClient,
	staticToken,
	updateSettings,
	withToken,
} from '@directus/sdk';
import { appRecommendedPermissions } from '@directus/system-data';
import { database } from '@utils/constants.js';
import { directusError } from '@utils/errors.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { useSandbox } from '@utils/sandbox.js';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { createLicense, LICENSE_KEYS } from './__fixtures__/licenses.js';

const SEATS_ADDON_ID = randomUUID();
const COLLECTIONS_ADDON_ID = randomUUID();

function addon(id: string, unit: 'seats' | 'collections') {
	return {
		id,
		unit,
		name: `Extra ${unit}`,
		description: `Extra ${unit}`,
		icon: 'group',
		active_quantity: 0,
		min_quantity: 0,
		max_quantity: 10,
		billing_interval: 'monthly',
		pricing_summary: 'pay something',
		upgrade_required: false,
	} as const;
}

const baseLicense = createLicense({ meta: { name: 'lifecycle-base' } });
const upgradeLicense = createLicense({ meta: { name: 'lifecycle-upgrade' } });

const addonLicense = createLicense({
	meta: { name: 'lifecycle-addons' },
	addons: [addon(SEATS_ADDON_ID, 'seats'), addon(COLLECTIONS_ADDON_ID, 'collections')],
});

const ssoDisabledLicense = createLicense({
	meta: { name: 'lifecycle-sso-disabled' },
	entitlements: { sso_enabled: { default: false } },
});

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;

beforeAll(async () => {
	directus = await useSandbox(database, {
		port: sandboxPort(0),
		extras: { license: true },
	});

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

	for (const license of [baseLicense, upgradeLicense, addonLicense, ssoDisabledLicense]) {
		await mockClient.registerLicense(directus.env.LICENSE_API_URL!, license);
	}
});

afterAll(async () => {
	await directus?.stop();
});

afterEach(async () => {
	await api.request(deactivateLicense()).catch(() => {});
});

describe('access', () => {
	test('GET /licenses rejects anonymous and non-admin users', async () => {
		const token = `non-admin-${randomUUID()}`;
		const user = await api.request(createUser({ email: `${token}@test.com`, status: 'active', token }));

		try {
			const anonymous = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest());

			await expect(anonymous.request(readLicense())).rejects.toMatchObject(directusError('FORBIDDEN'));
			await expect(api.request(withToken(token, readLicense()))).rejects.toMatchObject(directusError('FORBIDDEN'));
		} finally {
			await api.request(deleteUser(user['id']));
		}
	});
});

describe('license lifecycle', () => {
	test('no key or token at boot is CORE', async () => {
		expect(await api.request(readLicense())).toMatchObject({
			name: DIRECTUS_CORE_LICENSE.meta.name,
			source: null,
			status: 'active',
			entitlements: DIRECTUS_CORE_LICENSE.entitlements,
			usage: { seats: 1, collections: 0, flows: 0 },
		});
	});

	test('activate, update and deactivate move the license through settings and back to CORE', async () => {
		await api.request(activateLicense({ license_key: baseLicense.key }));

		expect(await api.request(readLicense())).toMatchObject({
			name: baseLicense.meta.name,
			source: 'settings',
			status: 'active',
			editable: true,
			entitlements: baseLicense.entitlements,
		});

		await api.request(updateLicense({ license_key: upgradeLicense.key }));

		expect(await api.request(readLicense())).toMatchObject({
			name: upgradeLicense.meta.name,
			source: 'settings',
			status: 'active',
			entitlements: upgradeLicense.entitlements,
		});

		await api.request(deactivateLicense());

		expect(await api.request(readLicense())).toMatchObject({
			name: DIRECTUS_CORE_LICENSE.meta.name,
			source: null,
			status: 'active',
			editable: true,
			entitlements: DIRECTUS_CORE_LICENSE.entitlements,
		});
	});

	test('preview reports the requested key, not the active license', async () => {
		await api.request(activateLicense({ license_key: baseLicense.key }));

		expect(await api.request(previewLicense({ license_key: upgradeLicense.key }))).toEqual({
			plan_name: upgradeLicense.name,
			expires_at: upgradeLicense.meta.expires_at,
			production_enabled: true,
		});
	});

	// CORE allows 3 seats: the admin plus the two users created here
	test('usage.seats counts a user once across direct and role policies, and counts role-less app users', async () => {
		const seats = async () => (await api.request<ReadLicenseOutput>(readLicense())).usage.seats;
		const created = { users: [] as string[], roles: [] as string[], policies: [] as string[] };

		try {
			const baseline = await seats();

			const appPolicy = await api.request(createPolicy({ name: `app_${randomUUID()}`, app_access: true }));
			const adminPolicy = await api.request(createPolicy({ name: `admin_${randomUUID()}`, admin_access: true }));
			created.policies.push(appPolicy['id'], adminPolicy['id']);

			const appRole = await api.request(
				createRole({ name: `app_role_${randomUUID()}`, policies: [{ policy: appPolicy['id'] }] }),
			);

			created.roles.push(appRole['id']);

			const both = await api.request(
				createUser({
					email: `both_${randomUUID()}@test.com`,
					status: 'active',
					role: appRole['id'],
					policies: [{ policy: adminPolicy['id'] }],
				}),
			);

			created.users.push(both['id']);
			expect(await seats()).toBe(baseline + 1);

			const roleless = await api.request(
				createUser({
					email: `roleless_${randomUUID()}@test.com`,
					status: 'active',
					role: null,
					policies: [{ policy: appPolicy['id'] }],
				}),
			);

			created.users.push(roleless['id']);
			expect(await seats()).toBe(baseline + 2);
		} finally {
			for (const id of created.users) await api.request(deleteUser(id)).catch(() => {});
			for (const id of created.roles) await api.request(deleteRole(id)).catch(() => {});
			for (const id of created.policies) await api.request(deletePolicy(id)).catch(() => {});
		}
	});
});

describe('permissions on CORE', () => {
	test('an app-access policy created the way the app does keeps its recommended and app minimal permissions', async () => {
		const policy = await api.request(
			createPolicy({ name: `app_${randomUUID()}`, app_access: true, permissions: appRecommendedPermissions }),
		);

		try {
			const rows = await api.request(readPermissions({ filter: { policy: { _eq: policy['id'] } }, limit: -1 }));

			expect(rows.map(({ collection, action }) => `${collection}:${action}`).sort()).toEqual(
				appRecommendedPermissions.map(({ collection, action }) => `${collection}:${action}`).sort(),
			);

			const minimal = await api.request(
				readPermissions({ filter: { collection: { _eq: 'directus_comments' }, action: { _eq: 'update' } }, limit: -1 }),
			);

			expect(minimal).toContainEqual(expect.objectContaining({ system: true, fields: ['comment'] }));
		} finally {
			await api.request(deletePolicy(policy['id']));
		}
	});

	test('custom rules created on a paid license are hidden once back on CORE', async () => {
		await api.request(activateLicense({ license_key: LICENSE_KEYS.UNLIMITED }));

		const policy = await api.request(
			createPolicy({
				name: `custom_${randomUUID()}`,
				permissions: [{ collection: 'directus_users', action: 'read', fields: ['first_name'] }],
			}),
		);

		try {
			await api.request(deactivateLicense());

			expect(await api.request(readPermissions({ filter: { policy: { _eq: policy['id'] } }, limit: -1 }))).toEqual([]);
		} finally {
			await api.request(deletePolicy(policy['id']));
		}
	});
});

describe('resolution', () => {
	test('pending-resolution reports collections over the new limit, and none before', async () => {
		expect(await api.request(generateLicensePendingResolution())).toEqual([]);

		await api.request(createCollection({ collection: 'pr_A', meta: {}, schema: {} }));
		await api.request(createCollection({ collection: 'pr_B', meta: {}, schema: {} }));
		await api.request(activateLicense({ license_key: LICENSE_KEYS.TINY }));

		try {
			expect(await api.request(generateLicensePendingResolution())).toEqual([
				expect.objectContaining({ key: 'collections', kind: 'limit', limit: 1, usage: 2 }),
			]);
		} finally {
			await api.request(deleteCollection('pr_A'));
			await api.request(deleteCollection('pr_B'));
		}
	});

	test('pending-resolution against a null license reports CORE feature_gate violations', async () => {
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

	test('partial resolution clears resolved violations and leaves others pending', async () => {
		await api.request(activateLicense({ license_key: LICENSE_KEYS.UNLIMITED }));
		await api.request(createCollection({ collection: 'res_A', meta: {}, schema: {} }));
		await api.request(createCollection({ collection: 'res_B', meta: {}, schema: {} }));
		await api.request(updateSettings({ ai_openai_compatible_name: 'set' }));
		await api.request(updateLicense({ license_key: LICENSE_KEYS.TINY }));

		try {
			await api.request(applyLicenseResolution({ collections: ['res_B'] }));

			expect(await api.request(generateLicensePendingResolution())).toEqual([
				expect.objectContaining({ key: 'custom_llms_enabled', kind: 'feature_gate' }),
			]);
		} finally {
			await api.request(updateSettings({ ai_openai_compatible_name: null }));
			await api.request(deleteCollection('res_A'));
			await api.request(deleteCollection('res_B'));
		}
	});

	describe('sso_enabled', () => {
		const createdSsoUsers: string[] = [];

		afterEach(async () => {
			for (const id of createdSsoUsers.splice(0)) await api.request(deleteUser(id)).catch(() => {});
		});

		test('a caller without a password fallback gets the ADMIN_MISSING_PASSWORD blocker', async () => {
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

			createdSsoUsers.push(ssoUser['id']);
			await api.request(updateLicense({ license_key: ssoDisabledLicense.key }));

			const result = await api.request(withToken('sso-blocker-pw-token', generateLicensePendingResolution()));

			expect(result).toEqual([{ key: 'sso_enabled', kind: 'feature_gate', blockers: ['ADMIN_MISSING_PASSWORD'] }]);
		});

		test('resolving by removing SSO users clears the violation', async () => {
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

			createdSsoUsers.push(ssoUser['id']);
			await api.request(updateLicense({ license_key: ssoDisabledLicense.key }));

			expect(await api.request(generateLicensePendingResolution())).toEqual([
				expect.objectContaining({ key: 'sso_enabled', kind: 'feature_gate' }),
			]);

			await api.request(applyLicenseResolution({ sso_enabled: { admin: {} } }));

			expect(await api.request(generateLicensePendingResolution())).toEqual([]);
		});
	});
});

describe('addons', () => {
	test('setting and removing a quantity round-trips through the license server', async () => {
		const quantities = async () =>
			Object.fromEntries(
				((await api.request(readLicenseAddons())) as { id: string; active_quantity: number }[]).map((a) => [
					a.id,
					a.active_quantity,
				]),
			);

		await api.request(activateLicense({ license_key: addonLicense.key }));

		expect(await quantities()).toEqual({ [SEATS_ADDON_ID]: 0, [COLLECTIONS_ADDON_ID]: 0 });

		await api.request(updateLicenseAddon(SEATS_ADDON_ID, { quantity: 5 }));

		expect(await quantities()).toEqual({ [SEATS_ADDON_ID]: 5, [COLLECTIONS_ADDON_ID]: 0 });

		await expect(api.request(updateLicenseAddon(SEATS_ADDON_ID, { quantity: 99 }))).rejects.toThrow();

		await api.request(deleteLicenseAddon(SEATS_ADDON_ID));

		expect(await quantities()).toEqual({ [SEATS_ADDON_ID]: 0, [COLLECTIONS_ADDON_ID]: 0 });
	});
});
