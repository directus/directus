import { randomUUID } from 'node:crypto';
import { sandbox, type Sandbox } from '@directus/sandbox';
import {
	createCollection,
	createDirectus,
	createFlow,
	createUser,
	deleteCollection,
	deleteFlow,
	deleteUser,
	type DirectusClient,
	readMe,
	rest,
	type RestClient,
	staticToken,
	updateCollection,
	updateFlow,
	updateUser,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { LICENSE_KEYS } from './__fixtures__/licenses.js';
import { withDefaultSandboxOptions } from './__fixtures__/sandbox.js';

const LIMIT_EXCEEDED = {
	errors: [expect.objectContaining({ extensions: expect.objectContaining({ code: 'LIMIT_EXCEEDED' }) })],
};

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;
let adminRole: string;

beforeAll(async () => {
	directus = await sandbox(
		database,
		withDefaultSandboxOptions({
			env: { LICENSE_KEY: LICENSE_KEYS.TINY },
			extras: { license: true },
			knex: true,
		}),
	);

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

	const me = await api.request(readMe());
	adminRole = me['role'] as string;
});

afterAll(async () => {
	await directus?.stop();
});

async function seedActiveAdmins(count: number) {
	const ids: string[] = Array.from({ length: count }, () => randomUUID());

	await directus.knex!('directus_users').insert(
		ids.map((id) => ({
			id,
			first_name: `seat_extra_${id}`,
			email: `seat_extra_${id}@test.com`,
			status: 'active',
			role: adminRole,
		})),
	);

	return ids;
}

describe('entitlements limits restrictions', () => {
	describe('collections (limit=1)', () => {
		test('creating 2nd collection rejects with LIMIT_EXCEEDED', async () => {
			const first = `collection_${randomUUID()}`;
			const second = `collection_${randomUUID()}`;

			try {
				await api.request(createCollection({ collection: first, meta: {}, schema: {} }));

				await expect(api.request(createCollection({ collection: second, meta: {}, schema: {} }))).rejects.toMatchObject(
					LIMIT_EXCEEDED,
				);
			} finally {
				await api.request(deleteCollection(first)).catch(() => {});
			}
		});

		test('folder collection (schema:null) does not consume the limit', async () => {
			const folder = `collection_${randomUUID()}`;
			const regular = `collection_${randomUUID()}`;

			try {
				await api.request(createCollection({ collection: folder, meta: { collection: folder }, schema: null }));

				await expect(
					api.request(createCollection({ collection: regular, meta: {}, schema: {} })),
				).resolves.toBeDefined();
			} finally {
				await api.request(deleteCollection(regular)).catch(() => {});
				await api.request(deleteCollection(folder)).catch(() => {});
			}
		});

		test('inactive collection (status:"inactive") does not consume the limit', async () => {
			const inactive = `collection_${randomUUID()}`;
			const regular = `collection_${randomUUID()}`;

			try {
				await api.request(createCollection({ collection: inactive, meta: { status: 'inactive' }, schema: {} }));

				await expect(
					api.request(createCollection({ collection: regular, meta: {}, schema: {} })),
				).resolves.toBeDefined();
			} finally {
				await api.request(deleteCollection(regular)).catch(() => {});
				await api.request(deleteCollection(inactive)).catch(() => {});
			}
		});

		test('updating a collection to inactive reduces the limit', async () => {
			const first = `collection_${randomUUID()}`;
			const second = `collection_${randomUUID()}`;

			try {
				await api.request(createCollection({ collection: first, meta: {}, schema: {} }));
				await api.request(updateCollection(first, { meta: { status: 'inactive' } }));

				await expect(
					api.request(createCollection({ collection: second, meta: {}, schema: {} })),
				).resolves.toBeDefined();
			} finally {
				await api.request(deleteCollection(first)).catch(() => {});
				await api.request(deleteCollection(second)).catch(() => {});
			}
		});

		test('updating a non-status field at the limit succeeds', async () => {
			const first = `collection_${randomUUID()}`;

			try {
				await api.request(createCollection({ collection: first, meta: {}, schema: {} }));

				// Pure update at the limit — no status field, so it isn't counted as a new active collection.
				await expect(api.request(updateCollection(first, { meta: { note: 'updated note' } }))).resolves.toBeDefined();
			} finally {
				await api.request(deleteCollection(first)).catch(() => {});
			}
		});

		test('updating a collection to inactive while over the limit succeeds', async () => {
			const first = `collection_${randomUUID()}`;
			const extras = [`collection_${randomUUID()}`, `collection_${randomUUID()}`];

			try {
				await api.request(createCollection({ collection: first, meta: {}, schema: {} }));

				// Push the active count over the limit directly via knex (real tables + active rows).
				for (const name of extras) {
					await directus.knex!.schema.createTable(name, (table) => {
						table.increments('id').primary();
					});

					await directus.knex!('directus_collections').insert({ collection: name });
				}

				// Going inactive is always allowed, even while over the limit.
				await expect(api.request(updateCollection(first, { meta: { status: 'inactive' } }))).resolves.toBeDefined();
			} finally {
				for (const name of [first, ...extras]) {
					await api.request(deleteCollection(name)).catch(() => {});
				}
			}
		});

		test('activating a collection while over the limit rejects with LIMIT_EXCEEDED', async () => {
			const active = `collection_${randomUUID()}`;
			const inactive = `collection_${randomUUID()}`;

			try {
				await api.request(createCollection({ collection: active, meta: {}, schema: {} }));
				await api.request(createCollection({ collection: inactive, meta: { status: 'inactive' }, schema: {} }));

				await expect(api.request(updateCollection(inactive, { meta: { status: 'active' } }))).rejects.toMatchObject(
					LIMIT_EXCEEDED,
				);
			} finally {
				await api.request(deleteCollection(active)).catch(() => {});
				await api.request(deleteCollection(inactive)).catch(() => {});
			}
		});
	});

	describe('seats (limit=1)', () => {
		test('creating a new active admin user rejects with LIMIT_EXCEEDED', async () => {
			await expect(
				api.request(
					createUser({
						first_name: 'over',
						email: `over_${randomUUID()}@test.com`,
						password: 'pw',
						status: 'active',
						role: adminRole,
					}),
				),
			).rejects.toMatchObject(LIMIT_EXCEEDED);
		});

		test('creating an invited user succeeds', async () => {
			let userId;

			try {
				const user = await api.request(
					createUser({
						first_name: 'invited',
						email: `invited_${randomUUID()}@test.com`,
						status: 'invited',
						role: adminRole,
					}),
				);

				userId = user['id'] as string;

				expect(user).toBeDefined();
			} finally {
				if (userId) {
					await api.request(deleteUser(userId)).catch(() => {});
				}
			}
		});

		test('activating a user rejects with LIMIT_EXCEEDED', async () => {
			const invited = await api.request(
				createUser({
					first_name: 'activating',
					email: `activating_${randomUUID()}@test.com`,
					status: 'invited',
					role: adminRole,
				}),
			);

			try {
				await expect(api.request(updateUser(invited['id'] as string, { status: 'active' }))).rejects.toMatchObject(
					LIMIT_EXCEEDED,
				);
			} finally {
				await api.request(deleteUser(invited['id'] as string)).catch(() => {});
			}
		});

		test('suspending a user while over the limit succeeds', async () => {
			const ids = await seedActiveAdmins(2);

			try {
				await expect(api.request(updateUser(ids[0]!, { status: 'suspended' }))).resolves.toBeDefined();
			} finally {
				await directus.knex!('directus_users').whereIn('id', ids).delete();
			}
		});

		test("clearing a user's role while over the limit succeeds", async () => {
			const ids = await seedActiveAdmins(2);

			try {
				await expect(api.request(updateUser(ids[0]!, { role: null }))).resolves.toBeDefined();
			} finally {
				await directus.knex!('directus_users').whereIn('id', ids).delete();
			}
		});

		test('creating a non-seat (role:null) user while over the limit succeeds', async () => {
			const ids = await seedActiveAdmins(2);

			try {
				await api.request(updateUser(ids[0]!, { role: null }));

				const apiUser = await api.request(
					createUser({
						first_name: 'non_seat',
						email: `non_seat_${randomUUID()}@test.com`,
						status: 'active',
						role: null,
					}),
				);

				ids.push(apiUser['id'] as string);

				expect(apiUser).toBeDefined();
			} finally {
				await directus.knex!('directus_users').whereIn('id', ids).delete();
			}
		});
	});

	describe('flows (limit=1)', () => {
		test('creating 2nd active flow rejects with LIMIT_EXCEEDED', async () => {
			const first = await api.request(
				createFlow({ name: `flow_${randomUUID()}`, trigger: 'manual', status: 'active' }),
			);

			try {
				await expect(
					api.request(createFlow({ name: `flow_${randomUUID()}`, trigger: 'manual', status: 'active' })),
				).rejects.toMatchObject(LIMIT_EXCEEDED);
			} finally {
				await api.request(deleteFlow(first['id'] as string)).catch(() => {});
			}
		});

		test('inactive flow above the limit succeeds', async () => {
			const active = await api.request(
				createFlow({ name: `flow_${randomUUID()}`, trigger: 'manual', status: 'active' }),
			);

			let inactiveId;

			try {
				const inactive = await api.request(
					createFlow({ name: `flow_${randomUUID()}`, trigger: 'manual', status: 'inactive' }),
				);

				inactiveId = inactive['id'] as string;

				expect(inactive).toBeDefined();
			} finally {
				await api.request(deleteFlow(active['id'] as string)).catch(() => {});
				if (inactiveId) await api.request(deleteFlow(inactiveId)).catch(() => {});
			}
		});

		test('updating a flow to inactive reduces the limit', async () => {
			const first = await api.request(
				createFlow({ name: `flow_${randomUUID()}`, trigger: 'manual', status: 'active' }),
			);

			let secondId;

			try {
				await api.request(updateFlow(first['id'] as string, { status: 'inactive' }));

				const second = await api.request(
					createFlow({ name: `flow_${randomUUID()}`, trigger: 'manual', status: 'active' }),
				);

				secondId = second['id'] as string;

				expect(second).toBeDefined();
			} finally {
				await api.request(deleteFlow(first['id'] as string)).catch(() => {});
				if (secondId) await api.request(deleteFlow(secondId)).catch(() => {});
			}
		});

		test('updating a flow to inactive while over the limit succeeds', async () => {
			const first = await api.request(
				createFlow({ name: `flow_${randomUUID()}`, trigger: 'manual', status: 'active' }),
			);

			const extras = [randomUUID(), randomUUID()];

			try {
				// Seed extra active flows directly via knex to push the count over the limit.
				for (const id of extras) {
					await directus.knex!('directus_flows').insert({
						id,
						name: `flow_extra_${id}`,
						status: 'active',
						trigger: 'manual',
					});
				}

				await expect(api.request(updateFlow(first['id'] as string, { status: 'inactive' }))).resolves.toBeDefined();
			} finally {
				await api.request(deleteFlow(first['id'] as string)).catch(() => {});

				for (const id of extras) {
					await api.request(deleteFlow(id)).catch(() => {});
				}
			}
		});

		test('activating a flow while over the limit rejects with LIMIT_EXCEEDED', async () => {
			const active = await api.request(
				createFlow({ name: `flow_${randomUUID()}`, trigger: 'manual', status: 'active' }),
			);

			const inactive = await api.request(
				createFlow({ name: `flow_${randomUUID()}`, trigger: 'manual', status: 'inactive' }),
			);

			try {
				await expect(api.request(updateFlow(inactive['id'] as string, { status: 'active' }))).rejects.toMatchObject(
					LIMIT_EXCEEDED,
				);
			} finally {
				await api.request(deleteFlow(active['id'] as string)).catch(() => {});
				await api.request(deleteFlow(inactive['id'] as string)).catch(() => {});
			}
		});
	});
});
