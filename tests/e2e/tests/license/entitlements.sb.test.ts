import { randomUUID } from 'node:crypto';
import { readLicense } from '@directus/license';
import { type Sandbox } from '@directus/sandbox';
import {
	createCollection,
	createDirectus,
	createFlow,
	createPermission,
	createPermissions,
	createPolicy,
	createUser,
	deleteCollection,
	deleteFlow,
	deletePolicy,
	deleteUser,
	type DirectusClient,
	readActivities,
	readItems,
	readMe,
	readRevisions,
	readSettings,
	rest,
	type RestClient,
	staticToken,
	updateCollection,
	updateFlow,
	updateSettings,
	updateUser,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getHelpers } from '@utils/db-helpers/index.js';
import { directusError } from '@utils/errors.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { useSandbox } from '@utils/sandbox.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { LICENSE_KEYS } from './__fixtures__/licenses.js';

function clearSystemCache() {
	return fetch(`http://localhost:${directus.apis[0].port}/utils/cache/clear?system`, {
		method: 'POST',
		headers: { Authorization: 'Bearer admin' },
	});
}

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;
let adminRole: string;

beforeAll(async () => {
	directus = await useSandbox(database, {
		port: sandboxPort(0),
		env: { LICENSE_KEY: LICENSE_KEYS.TINY },
		extras: { license: true },
		knex: true,
	});

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

	const me = await api.request(readMe());
	adminRole = me['role'];
});

afterAll(async () => {
	await directus?.stop();
});

describe('collections (limit=1)', () => {
	test('folders and inactive collections are not counted, a 2nd active collection rejects', async () => {
		const folder = `collection_${randomUUID()}`;
		const inactive = `collection_${randomUUID()}`;
		const first = `collection_${randomUUID()}`;
		const second = `collection_${randomUUID()}`;

		try {
			await api.request(createCollection({ collection: folder, meta: { collection: folder }, schema: null }));
			await api.request(createCollection({ collection: inactive, meta: { status: 'inactive' }, schema: {} }));
			await api.request(createCollection({ collection: first, meta: {}, schema: {} }));

			await expect(api.request(createCollection({ collection: second, meta: {}, schema: {} }))).rejects.toMatchObject(
				directusError('LIMIT_EXCEEDED'),
			);
		} finally {
			for (const collection of [first, inactive, folder]) {
				await api.request(deleteCollection(collection)).catch(() => {});
			}
		}
	});

	test('activating at the limit rejects, and deactivating another frees the slot', async () => {
		const [active, inactive] = [`collection_${randomUUID()}`, `collection_${randomUUID()}`];

		try {
			await api.request(createCollection({ collection: active, meta: {}, schema: {} }));
			await api.request(createCollection({ collection: inactive, meta: { status: 'inactive' }, schema: {} }));

			await expect(api.request(updateCollection(inactive, { meta: { status: 'active' } }))).rejects.toMatchObject(
				directusError('LIMIT_EXCEEDED'),
			);

			await api.request(updateCollection(active, { meta: { status: 'inactive' } }));

			await expect(api.request(updateCollection(inactive, { meta: { status: 'active' } }))).resolves.toBeDefined();
		} finally {
			await api.request(deleteCollection(active)).catch(() => {});
			await api.request(deleteCollection(inactive)).catch(() => {});
		}
	});

	test('while over the limit, the instance locks but deactivating and creating a folder are allowed', async () => {
		const collection = `collection_${randomUUID()}`;
		const extra = `collection_${randomUUID()}`;
		const folder = `collection_${randomUUID()}`;

		await api.request(createCollection({ collection, meta: {}, schema: {} }));
		await directus.knex!.schema.createTable(extra, (table) => table.increments('id').primary());
		await directus.knex!('directus_collections').insert({ collection: extra });
		await clearSystemCache();

		try {
			expect(await api.request(readLicense())).toMatchObject({ status: 'locked' });

			await expect(api.request(readItems(collection))).rejects.toMatchObject(
				directusError('RESOURCE_RESTRICTED', { category: 'items' }),
			);

			await expect(api.request(updateCollection(collection, { meta: { status: 'inactive' } }))).resolves.toBeDefined();

			await expect(
				api.request(createCollection({ collection: folder, meta: { collection: folder }, schema: null })),
			).resolves.toBeDefined();
		} finally {
			for (const name of [collection, extra, folder]) {
				await api.request(deleteCollection(name)).catch(() => {});
			}

			await clearSystemCache();
		}
	});
});

describe('seats (limit=1, taken by the admin)', () => {
	test('creating a new active admin user rejects with LIMIT_EXCEEDED', async () => {
		await expect(
			api.request(
				createUser({ email: `over_${randomUUID()}@test.com`, password: 'pw', status: 'active', role: adminRole }),
			),
		).rejects.toMatchObject(directusError('LIMIT_EXCEEDED'));
	});

	test('an invited user is not counted, but activating them rejects with LIMIT_EXCEEDED', async () => {
		const invited = await api.request(
			createUser({ email: `invited_${randomUUID()}@test.com`, status: 'invited', role: adminRole }),
		);

		try {
			await expect(api.request(updateUser(invited['id'], { status: 'active' }))).rejects.toMatchObject(
				directusError('LIMIT_EXCEEDED'),
			);
		} finally {
			await api.request(deleteUser(invited['id'])).catch(() => {});
		}
	});

	test('while over the limit, suspending a seat user and creating a non-seat user are allowed', async () => {
		const ids = [randomUUID(), randomUUID()];

		await directus.knex!('directus_users').insert(
			ids.map((id) => ({ id, email: `seat_extra_${id}@test.com`, status: 'active', role: adminRole })),
		);

		try {
			await expect(api.request(updateUser(ids[0]!, { status: 'suspended' }))).resolves.toBeDefined();

			const nonSeat = await api.request(
				createUser({ email: `non_seat_${randomUUID()}@test.com`, status: 'active', role: null }),
			);

			ids.push(nonSeat['id']);
		} finally {
			await directus.knex!('directus_users').whereIn('id', ids).delete();
		}
	});
});

describe('flows (limit=1)', () => {
	test('inactive flows are not counted, a 2nd active flow rejects on create and on activate', async () => {
		const flow = (status: string) => createFlow({ name: `flow_${randomUUID()}`, trigger: 'manual', status });

		const inactive = await api.request(flow('inactive'));
		const active = await api.request(flow('active'));

		try {
			await expect(api.request(flow('active'))).rejects.toMatchObject(directusError('LIMIT_EXCEEDED'));

			await expect(api.request(updateFlow(inactive['id'], { status: 'active' }))).rejects.toMatchObject(
				directusError('LIMIT_EXCEEDED'),
			);
		} finally {
			await api.request(deleteFlow(active['id'])).catch(() => {});
			await api.request(deleteFlow(inactive['id'])).catch(() => {});
		}
	});

	test('while over the limit, the instance locks but deactivating and creating an inactive flow are allowed', async () => {
		const flow = await api.request(createFlow({ name: `flow_${randomUUID()}`, trigger: 'manual', status: 'active' }));
		const extra = randomUUID();
		let inactive: string | undefined;

		await directus.knex!('directus_flows').insert({ id: extra, name: 'extra', status: 'active', trigger: 'manual' });
		await clearSystemCache();

		try {
			expect(await api.request(readLicense())).toMatchObject({ status: 'locked' });

			await expect(api.request(updateFlow(flow['id'], { status: 'inactive' }))).resolves.toBeDefined();

			inactive = (
				await api.request(createFlow({ name: `flow_${randomUUID()}`, trigger: 'manual', status: 'inactive' }))
			)['id'];
		} finally {
			for (const id of [flow['id'], extra, inactive]) {
				if (id) await api.request(deleteFlow(id)).catch(() => {});
			}

			await clearSystemCache();
		}
	});
});

describe('custom_llms_enabled (default=false)', () => {
	test('PATCH /settings setting an LLM field rejects with RESOURCE_RESTRICTED', async () => {
		await expect(api.request(updateSettings({ ai_openai_compatible_name: 'test' }))).rejects.toMatchObject(
			directusError('RESOURCE_RESTRICTED', { category: 'custom_llms_enabled' }),
		);
	});

	test('GET /settings strips LLM fields', async () => {
		await directus.knex!('directus_settings').update({ ai_openai_compatible_name: 'leaked' });

		try {
			const settings = await api.request(readSettings());

			expect(settings['ai_openai_compatible_name']).toBeNull();
		} finally {
			await directus.knex!('directus_settings').update({ ai_openai_compatible_name: null });
		}
	});
});

describe('custom_permission_rules_enabled (default=false)', () => {
	test('creating a full-access permission is allowed, a custom one rejects with RESOURCE_RESTRICTED', async () => {
		const policy = await api.request(createPolicy({ name: `ent-custom-rule-${randomUUID()}` }));

		try {
			await expect(
				api.request(
					createPermission({ action: 'read', collection: 'directus_users', policy: policy['id'], fields: ['*'] }),
				),
			).resolves.toBeDefined();

			await expect(
				api.request(
					createPermission({ action: 'read', collection: 'articles', policy: policy['id'], fields: ['first_name'] }),
				),
			).rejects.toMatchObject(directusError('RESOURCE_RESTRICTED', { category: 'custom_permission_rules_enabled' }));
		} finally {
			await api.request(deletePolicy(policy['id'])).catch(() => {});
		}
	});

	test('batch and nested creates with a custom row reject with RESOURCE_RESTRICTED', async () => {
		const policy = await api.request(createPolicy({ name: `ent-custom-rule-${randomUUID()}` }));
		const custom = { collection: 'articles', action: 'read', fields: ['first_name'] };

		try {
			await expect(
				api.request(
					createPermissions([
						{ action: 'read', collection: 'directus_users', policy: policy['id'], fields: ['*'] },
						{ ...custom, policy: policy['id'] },
					]),
				),
			).rejects.toMatchObject(directusError('RESOURCE_RESTRICTED', { category: 'custom_permission_rules_enabled' }));

			await expect(
				api.request(createPolicy({ name: `ent-custom-rule-${randomUUID()}`, permissions: [custom] })),
			).rejects.toMatchObject(directusError('RESOURCE_RESTRICTED', { category: 'custom_permission_rules_enabled' }));
		} finally {
			await api.request(deletePolicy(policy['id'])).catch(() => {});
		}
	});
});

describe('historical timeframes (limit=7d)', () => {
	const HISTORY_SEED = [
		{ item: 'within', daysAgo: 1 },
		{ item: 'edge_in', daysAgo: 6 },
		{ item: 'edge_out', daysAgo: 8 },
		{ item: 'outside', daysAgo: 60 },
	];

	test('GET /activity and GET /revisions exclude rows older than the timeframe', async () => {
		const tag = `history_${randomUUID()}`;
		const { date } = getHelpers(directus.knex!);

		for (const { item, daysAgo } of HISTORY_SEED) {
			const timestamp = date.writeTimestamp(new Date(Date.now() - daysAgo * 86_400_000).toISOString());

			const [activity] = await directus.knex!('directus_activity').insert(
				{ action: 'create', timestamp, collection: tag, item },
				['id'],
			);

			await directus.knex!('directus_revisions').insert({
				activity: activity?.id ?? activity,
				collection: tag,
				item,
				data: '{}',
				delta: '{}',
			});
		}

		try {
			const query = { filter: { collection: { _eq: tag } }, limit: -1 };
			const activity = await api.request(readActivities(query));
			const revisions = await api.request(readRevisions(query));

			expect(activity.map((r) => r['item']).sort()).toEqual(['edge_in', 'within']);
			expect(revisions.map((r) => r['item']).sort()).toEqual(['edge_in', 'within']);
		} finally {
			await directus.knex!('directus_revisions').where({ collection: tag }).delete();
			await directus.knex!('directus_activity').where({ collection: tag }).delete();
		}
	});
});
