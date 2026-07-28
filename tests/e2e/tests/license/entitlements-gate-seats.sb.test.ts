import { randomUUID } from 'node:crypto';
import { readLicense } from '@directus/license';
import { sandbox, type Sandbox } from '@directus/sandbox';
import {
	createDirectus,
	createPolicy,
	createRole,
	createUser,
	deletePolicy,
	deleteRole,
	deleteUser,
	type DirectusClient,
	rest,
	type RestClient,
	staticToken,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { LICENSE_KEYS } from './__fixtures__/licenses.js';
import { withDefaultSandboxOptions } from './__fixtures__/sandbox.js';

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;

beforeAll(async () => {
	directus = await sandbox(
		database,
		withDefaultSandboxOptions({
			// LIMITED's 10 seats give headroom so the count is observed directly, never via LIMIT_EXCEEDED.
			env: { LICENSE_KEY: LICENSE_KEYS.LIMITED },
			extras: { license: true },
		}),
	);

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
});

afterAll(async () => {
	await directus?.stop();
});

describe('seats counting', () => {
	test('a user with a direct admin policy and an app-granting role is counted once', async () => {
		const cleanup = { users: [] as string[], roles: [] as string[], policies: [] as string[] };

		try {
			const baseline = ((await api.request(readLicense())) as any).usage.seats;

			const appPolicy = await api.request(
				createPolicy({ name: `app_${randomUUID()}`, app_access: true, admin_access: false }),
			);

			cleanup.policies.push(appPolicy['id']);

			const adminPolicy = await api.request(
				createPolicy({ name: `admin_${randomUUID()}`, app_access: false, admin_access: true }),
			);

			cleanup.policies.push(adminPolicy['id']);

			const appRole = await api.request(
				createRole({ name: `app_role_${randomUUID()}`, policies: [{ policy: appPolicy['id'] }] }),
			);

			cleanup.roles.push(appRole['id']);

			const user = await api.request(
				createUser({
					first_name: 'condition_a',
					email: `condition_a_${randomUUID()}@test.com`,
					status: 'active',
					role: appRole['id'],
					policies: [{ policy: adminPolicy['id'] }],
				}),
			);

			cleanup.users.push(user['id']);

			expect(((await api.request(readLicense())) as any).usage.seats).toBe(baseline + 1);
		} finally {
			for (const id of cleanup.users) await api.request(deleteUser(id)).catch(() => {});
			for (const id of cleanup.roles) await api.request(deleteRole(id)).catch(() => {});
			for (const id of cleanup.policies) await api.request(deletePolicy(id)).catch(() => {});
		}
	});

	test('a role-less user with a direct app policy is still counted', async () => {
		const cleanup = { users: [] as string[], policies: [] as string[] };

		try {
			const baseline = ((await api.request(readLicense())) as any).usage.seats;

			const appPolicy = await api.request(
				createPolicy({ name: `app_${randomUUID()}`, app_access: true, admin_access: false }),
			);

			cleanup.policies.push(appPolicy['id']);

			const user = await api.request(
				createUser({
					first_name: 'roleless_app',
					email: `roleless_app_${randomUUID()}@test.com`,
					status: 'active',
					role: null,
					policies: [{ policy: appPolicy['id'] }],
				}),
			);

			cleanup.users.push(user['id']);

			expect(((await api.request(readLicense())) as any).usage.seats).toBe(baseline + 1);
		} finally {
			for (const id of cleanup.users) await api.request(deleteUser(id)).catch(() => {});
			for (const id of cleanup.policies) await api.request(deletePolicy(id)).catch(() => {});
		}
	});
});
