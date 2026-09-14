import { sandbox } from '@directus/sandbox';
import {
	clearCache,
	createCollection,
	createDirectus,
	createPermission,
	createPermissions,
	createPolicy,
	deletePermission,
	deletePermissions,
	rest,
	staticToken,
	updatePermission,
	updatePermissions,
	updatePermissionsBatch,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { range } from 'lodash-es';
import { afterAll, expect, test } from 'vitest';

const CACHE_STATUS_HEADER = 'x-cache-status';
const COLLECTION = 'cache_purge_items';

/**
 * Mutating permissions has to purge the data cache even with `CACHE_AUTO_PURGE` off, since a
 * stale cache would serve data the new rules no longer allow. Auto purge is therefore left off
 * here: with it on, every mutation would purge anyway and the test would prove nothing.
 */
const directus = await sandbox(database, {
	port: sandboxPort(),
	inspect: false,
	prefix: 'cache-purge',
	cache: true,
	// Custom permission rules are an entitlement, so the mock license server has to be up
	extras: { license: true },
	env: {
		LICENSE_KEY: 'D0000-00000-00000-00000-0000K',
		CACHE_STATUS_HEADER,
		CACHE_AUTO_PURGE: 'false',
		CACHE_STORE: 'memory',
		CACHE_NAMESPACE: 'cache-purge',
		DB_FILENAME: `directus_test_${getUID()}.db`,
	},
	docker: { suffix: getUID() },
});

const url = `http://localhost:${directus.apis[0]!.port}`;
const api = createDirectus<any>(url).with(rest()).with(staticToken('admin'));

afterAll(async () => {
	await directus.stop();
});

await api.request(
	createCollection({
		collection: COLLECTION,
		fields: [
			{
				field: 'id',
				type: 'integer',
				meta: { hidden: true, interface: 'input', readonly: true },
				schema: { is_primary_key: true, has_auto_increment: true },
			},
		],
		schema: {},
		meta: { singleton: false },
	} as any),
);

const policy = await api.request(
	createPolicy({ name: 'Cache Purge Test', admin_access: false, app_access: false } as any),
);

const permission = () => ({ collection: COLLECTION, action: 'read', policy: policy.id });

/** A batch create also reports the system permissions it implies, which carry no id. */
const ids = (created: any[]) => created.map((item) => item.id).filter((id) => id !== undefined && id !== null);

/** Empties the cache, then fills it again by reading the collection once. */
async function primeCache() {
	await api.request(clearCache());
	await read();
}

async function read() {
	const response = await fetch(`${url}/items/${COLLECTION}`, { headers: { Authorization: 'Bearer admin' } });

	expect(response.status).toBe(200);

	return response.headers.get(CACHE_STATUS_HEADER);
}

const MUTATIONS: Record<string, () => Promise<void>> = {
	async createOne() {
		await primeCache();
		await api.request(createPermission(permission() as any));
	},

	async createMany() {
		await primeCache();
		await api.request(createPermissions(range(5).map(permission) as any));
	},

	async updateOne() {
		const created = await api.request(createPermission(permission() as any));
		await primeCache();
		await api.request(updatePermission(created.id, { action: 'update' } as any));
	},

	async updateMany() {
		const created = await api.request(createPermissions(range(5).map(permission) as any));
		await primeCache();
		await api.request(updatePermissions(ids(created), { action: 'update' } as any));
	},

	async updateBatch() {
		const created = await api.request(createPermissions(range(5).map(permission) as any));
		await primeCache();
		await api.request(updatePermissionsBatch(ids(created).map((id) => ({ id, action: 'update' })) as any));
	},

	async deleteOne() {
		const created = await api.request(createPermission(permission() as any));
		await primeCache();
		await api.request(deletePermission(created.id));
	},

	async deleteMany() {
		const created = await api.request(createPermissions(range(5).map(permission) as any));
		await primeCache();
		await api.request(deletePermissions(ids(created)));
	},
};

for (const [name, mutate] of Object.entries(MUTATIONS)) {
	test(`${name} on permissions purges the data cache`, async () => {
		await mutate();

		expect(await read()).toBe('MISS');
	});
}
