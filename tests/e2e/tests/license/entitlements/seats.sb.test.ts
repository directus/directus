import { randomUUID } from 'node:crypto';
import { createLicense } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import {
	createDirectus,
	createUser,
	deleteUser,
	type DirectusClient,
	type DirectusUser,
	type NestedPartial,
	readMe,
	readUsers,
	rest,
	type RestClient,
	staticToken,
	updatePolicy,
	updateUser,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

// The bootstrapped admin user always occupies 1 seat, so the number of users
// we can actively create on top is LIMIT - 1.
const LIMIT = 4;
const FILL = LIMIT - 1;

let createdUsers: string[] = [];
let adminRole: string;

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;

const license = createLicense({
	meta: { name: 'seats-entitlement-test' },
	entitlements: {
		seats: { limit: LIMIT },
	},
});

async function createSeatUser(name: string, overrides?: NestedPartial<DirectusUser<any>>) {
	const status = (overrides?.status as string | undefined) ?? 'active';

	return api.request(
		createUser({
			first_name: name,
			last_name: 'seat',
			email: `${name}_${randomUUID()}@test.com`,
			role: adminRole,
			status,
			...(status === 'active' ? { password: 'pw' } : {}),
			...(overrides ?? {}),
		}),
	);
}

async function fillSeatLimit(prefix: string) {
	for (let i = 1; i <= FILL; i++) {
		const name = prefix + '_seat_entitlement_' + i;

		const user = await createSeatUser(name);

		createdUsers.push(user['id'] as string);
	}
}

beforeAll(async () => {
	const devMode = process.env['NODE_ENV'] === 'development';

	directus = await sandbox(database, {
		dev: devMode,
		watch: devMode,
		prefix: database,
		env: {
			CACHE_SCHEMA: 'false',
			DB_FILENAME: `directus_test_${randomUUID()}.db`,
			LICENSE_KEY: license.key,
			DB_EXCLUDE_TABLES: 'secrets',
		},
		extras: {
			license: true,
		},
		cache: false,
		knex: true,
		hooks: {
			beforeApi: async ({ env }) => {
				// Register the license with the mock license server before the api boots so
				// directus picks it up via the LICENSE_KEY env var (avoids the activate path).
				await fetch(`http://localhost:${env.LICENSE_PORT}/admin/license`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(license),
				});
			},
		},
	});

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

	const me = await api.request(readMe());
	adminRole = me['role'] as string;
});

afterAll(async () => {
	await directus?.stop();
});

describe('seats entitlement', () => {
	afterEach(async () => {
		for (const id of createdUsers) {
			try {
				await api.request(deleteUser(id));
			} catch {
				// ignore cleanup failures
			}
		}

		createdUsers = [];
	});

	test('can successfully create active users within the limit', async () => {
		await fillSeatLimit('a');

		const all = await api.request(
			readUsers({
				filter: { status: { _eq: 'active' } },
				limit: -1,
			}),
		);

		expect(all).toHaveLength(LIMIT);
	});

	test('creating an active user above the license limit rejects with LIMIT_EXCEEDED', async () => {
		await fillSeatLimit('b');

		const name = 'b_seat_entitlement_' + LIMIT;

		await expect(createSeatUser(name)).rejects.toMatchObject({
			errors: [
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: 'LIMIT_EXCEEDED',
					}),
				}),
			],
		});
	});

	test('creating an invited user above the license limit succeeds', async () => {
		await fillSeatLimit('c');

		const user = await createSeatUser('c_seat_entitlement_invited', {
			status: 'invited',
		});

		createdUsers.push(user['id'] as string);

		expect(user).toBeDefined();
	});

	test('activating an existing user above the license limit rejects with LIMIT_EXCEEDED', async () => {
		await fillSeatLimit('d');

		const invited = await createSeatUser('d_seat_entitlement_invited', {
			status: 'invited',
		});

		createdUsers.push(invited['id'] as string);

		await expect(api.request(updateUser(invited['id'] as string, { status: 'active' }))).rejects.toMatchObject({
			errors: [
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: 'LIMIT_EXCEEDED',
					}),
				}),
			],
		});
	});

	test('deactivating an existing user allows new creation', async () => {
		await fillSeatLimit('e');

		await api.request(
			updateUser(createdUsers[0]!, {
				status: 'suspended',
			}),
		);

		const name = 'e_seat_entitlement_' + LIMIT;

		const user = await createSeatUser(name);

		createdUsers.push(user['id'] as string);

		expect(user).toBeDefined();
	});

	test('can deactivate an existing user remaining over the limit', async () => {
		await fillSeatLimit('f');

		// seed 2 active users directly via knex to push the seat count over the license limit
		const extra1 = randomUUID();
		const extra2 = randomUUID();

		await directus.knex!('directus_users').insert({
			id: extra1,
			first_name: 'f_seat_entitlement_extra_1',
			email: `f_seat_entitlement_extra_1_${randomUUID()}@test.com`,
			status: 'active',
			role: adminRole,
		});

		await directus.knex!('directus_users').insert({
			id: extra2,
			first_name: 'f_seat_entitlement_extra_2',
			email: `f_seat_entitlement_extra_2_${randomUUID()}@test.com`,
			status: 'active',
			role: adminRole,
		});

		createdUsers.push(extra1);
		createdUsers.push(extra2);

		// deactivating should remain allowed even though total active is over the limit
		await expect(
			api.request(
				updateUser(createdUsers[0]!, {
					status: 'suspended',
				}),
			),
		).resolves.toBeDefined();
	});

	test('can clear a role from an existing user while over the limit', async () => {
		await fillSeatLimit('g');

		// seed 2 active admin-role users directly via knex to push the seat count over the license limit
		const extra1 = randomUUID();
		const extra2 = randomUUID();

		await directus.knex!('directus_users').insert({
			id: extra1,
			first_name: 'g_seat_entitlement_extra_1',
			email: `g_seat_entitlement_extra_1_${randomUUID()}@test.com`,
			status: 'active',
			role: adminRole,
		});

		await directus.knex!('directus_users').insert({
			id: extra2,
			first_name: 'g_seat_entitlement_extra_2',
			email: `g_seat_entitlement_extra_2_${randomUUID()}@test.com`,
			status: 'active',
			role: adminRole,
		});

		createdUsers.push(extra1);
		createdUsers.push(extra2);

		// clearing the role drops a seat and should remain allowed even though total active is over the limit
		await expect(
			api.request(
				updateUser(createdUsers[0]!, {
					role: null,
				}),
			),
		).resolves.toBeDefined();
	});

	test('can detach a direct admin policy from a user while over the limit', async () => {
		await fillSeatLimit('h');

		const adminPolicy = await directus.knex!('directus_policies').where({ admin_access: true }).select('id').first();

		// seed an extra admin-role user via knex to push over the limit
		const extra = randomUUID();

		await directus.knex!('directus_users').insert({
			id: extra,
			first_name: 'h_seat_entitlement_extra',
			email: `h_seat_entitlement_extra_${randomUUID()}@test.com`,
			status: 'active',
			role: adminRole,
		});

		createdUsers.push(extra);

		// seed a roleless user with a direct admin policy attachment, pushing one further over the limit
		const directUser = randomUUID();

		await directus.knex!('directus_users').insert({
			id: directUser,
			first_name: 'h_seat_entitlement_direct',
			email: `h_seat_entitlement_direct_${randomUUID()}@test.com`,
			status: 'active',
			role: null,
		});

		createdUsers.push(directUser);

		const accessId = randomUUID();

		await directus.knex!('directus_access').insert({
			id: accessId,
			user: directUser,
			role: null,
			policy: adminPolicy.id,
		});

		// detaching the direct policy drops a seat and should remain allowed even though total active is over the limit
		await expect(
			fetch(`http://localhost:${directus.apis[0].port}/access/${accessId}`, {
				method: 'DELETE',
				headers: { Authorization: 'Bearer admin' },
			}).then((res) => {
				if (!res.ok) throw new Error(`Detach failed with status ${res.status}`);
				return res;
			}),
		).resolves.toBeDefined();
	});

	test('can revoke admin and app access on a policy while over the limit', async () => {
		await fillSeatLimit('i');

		// seed an extra admin-role user via knex to push over the limit
		const extra = randomUUID();

		await directus.knex!('directus_users').insert({
			id: extra,
			first_name: 'i_seat_entitlement_extra',
			email: `i_seat_entitlement_extra_${randomUUID()}@test.com`,
			status: 'active',
			role: adminRole,
		});

		createdUsers.push(extra);

		// seed a custom policy + role + user attached via knex to push one further over the limit
		const policyId = randomUUID();
		const roleId = randomUUID();
		const userId = randomUUID();
		const accessId = randomUUID();

		await directus.knex!('directus_policies').insert({
			id: policyId,
			name: 'i_seat_entitlement_policy',
			icon: 'badge',
			admin_access: true,
			app_access: true,
		});

		await directus.knex!('directus_roles').insert({
			id: roleId,
			name: 'i_seat_entitlement_role',
			icon: 'supervised_user_circle',
		});

		await directus.knex!('directus_access').insert({
			id: accessId,
			role: roleId,
			user: null,
			policy: policyId,
		});

		await directus.knex!('directus_users').insert({
			id: userId,
			first_name: 'i_seat_entitlement_user',
			email: `i_seat_entitlement_user_${randomUUID()}@test.com`,
			status: 'active',
			role: roleId,
		});

		createdUsers.push(userId);

		// stripping app/admin access from the policy drops users on that policy out of the seat count
		await expect(
			api.request(
				updatePolicy(policyId, {
					admin_access: false,
					app_access: false,
				}),
			),
		).resolves.toBeDefined();
	});

	test('can clear a role from a user that retains a direct policy seat', async () => {
		await fillSeatLimit('j');

		const adminPolicy = await directus.knex!('directus_policies').where({ admin_access: true }).select('id').first();

		// seed an extra admin-role user via knex to push over the limit
		const extra = randomUUID();

		await directus.knex!('directus_users').insert({
			id: extra,
			first_name: 'j_seat_entitlement_extra',
			email: `j_seat_entitlement_extra_${randomUUID()}@test.com`,
			status: 'active',
			role: adminRole,
		});

		createdUsers.push(extra);

		// seed an active admin-role user with an additional direct admin policy attachment;
		// this user holds a seat through two paths (role + direct policy)
		const dualUser = randomUUID();

		await directus.knex!('directus_users').insert({
			id: dualUser,
			first_name: 'j_seat_entitlement_dual',
			email: `j_seat_entitlement_dual_${randomUUID()}@test.com`,
			status: 'active',
			role: adminRole,
		});

		createdUsers.push(dualUser);

		await directus.knex!('directus_access').insert({
			id: randomUUID(),
			user: dualUser,
			role: null,
			policy: adminPolicy.id,
		});

		// removing the role does not actually drop a seat (direct policy still grants admin access),
		// but should still be permitted because the total seat count does not increase
		await expect(
			api.request(
				updateUser(dualUser, {
					role: null,
				}),
			),
		).resolves.toBeDefined();
	});

	test('creating a non-seat user after editing a seat user should not throw LIMIT_EXCEEDED', async () => {
		await fillSeatLimit('k');

		// seed 2 active admin-role users directly via knex to push the seat count over the license limit
		const extra1 = randomUUID();
		const extra2 = randomUUID();

		await directus.knex!('directus_users').insert({
			id: extra1,
			first_name: 'k_seat_entitlement_extra_1',
			email: `k_seat_entitlement_extra_1_${randomUUID()}@test.com`,
			status: 'active',
			role: adminRole,
		});

		await directus.knex!('directus_users').insert({
			id: extra2,
			first_name: 'k_seat_entitlement_extra_2',
			email: `k_seat_entitlement_extra_2_${randomUUID()}@test.com`,
			status: 'active',
			role: adminRole,
		});

		createdUsers.push(extra1);
		createdUsers.push(extra2);

		// this edit clears the seats cache as a side effect (see UsersService.clearCaches when role changes)
		await api.request(
			updateUser(createdUsers[0]!, {
				role: null,
			}),
		);

		// a fresh non-seat (api) user does not push the seat count up, so this should succeed;
		// the bug is that the cleared cache plus the lingering over-limit state trips the
		// seat check at validate-user-count-integrity.ts:48 and an incorrect LIMIT_EXCEEDED is thrown
		const apiUser = await api.request(
			createUser({
				first_name: 'k_seat_entitlement_api',
				last_name: 'seat',
				email: `k_seat_entitlement_api_${randomUUID()}@test.com`,
				status: 'active',
				role: null,
			}),
		);

		createdUsers.push(apiUser['id'] as string);

		expect(apiUser).toBeDefined();
	});
});
