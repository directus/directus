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
});
