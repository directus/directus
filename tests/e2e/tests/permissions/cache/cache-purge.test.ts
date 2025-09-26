import { sandbox } from '@directus/sandbox';
import {
	clearCache,
	createDirectus,
	createPermission,
	createPermissions,
	createPolicy,
	deletePermission,
	deletePermissions,
	readItems,
	rest,
	staticToken,
	updatePermission,
	updatePermissions,
	updatePermissionsBatch,
	type DirectusClient,
	type RestClient,
	type StaticTokenClient,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import getPort from 'get-port';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { getUID } from '@utils/getUID.js';

const uid = getUID();

const all = process.env['ALL'] === 'true';

if (!all) {
	const directusMemPort = await getPort();

	const directusMem = await sandbox(database, {
		cache: true,
		prefix: 'cache-mem',
		port: directusMemPort,
		schema: join(import.meta.dirname, 'snapshot.json'),
		inspect: false,
		silent: true,
		docker: {
			basePort: directusMemPort + 1,
			suffix: `${uid}_mem`,
		},
		env: {
			CACHE_STATUS_HEADER: 'x-cache-status',
			CACHE_AUTO_PURGE: 'false',
			CACHE_AUTO_PURGE_IGNORE_LIST: `directus_activity,directus_presets,ignored`,
		},
	});

	const directusMemPurgePort = await getPort();

	const directusMemPurge = await sandbox(database, {
		cache: true,
		prefix: 'cache-mem-purge',
		port: directusMemPurgePort,
		schema: join(import.meta.dirname, 'snapshot.json'),
		inspect: false,
		silent: true,
		docker: {
			basePort: directusMemPurgePort + 1,
			suffix: `${uid}_mem_purge`,
		},
		env: {
			CACHE_STATUS_HEADER: 'x-cache-status',
			CACHE_AUTO_PURGE: 'true',
			CACHE_AUTO_PURGE_IGNORE_LIST: `directus_activity,directus_presets,ignored`,
		},
	});

	const directusRedisPort = await getPort();

	const directusRedis = await sandbox(database, {
		cache: true,
		prefix: 'cache-redis',
		port: directusRedisPort,
		schema: join(import.meta.dirname, 'snapshot.json'),
		inspect: false,
		silent: true,
		docker: {
			basePort: directusRedisPort + 1,
			suffix: `${uid}_redis`,
		},
		extras: {
			redis: true,
		},
		env: {
			CACHE_STATUS_HEADER: 'x-cache-status',
			CACHE_AUTO_PURGE: 'false',
			CACHE_AUTO_PURGE_IGNORE_LIST: `directus_activity,directus_presets,ignored`,
		},
	});

	const directusRedisPurgePort = await getPort();

	const directusRedisPurge = await sandbox(database, {
		cache: true,
		prefix: 'cache-redis-purge',
		port: directusRedisPurgePort,
		schema: join(import.meta.dirname, 'snapshot.json'),
		inspect: false,
		silent: true,
		docker: {
			basePort: directusRedisPurgePort + 1,
			suffix: `${uid}_redis_purge`,
		},
		extras: {
			redis: true,
		},
		env: {
			CACHE_STATUS_HEADER: 'x-cache-status',
			CACHE_AUTO_PURGE: 'true',
			CACHE_AUTO_PURGE_IGNORE_LIST: `directus_activity,directus_presets,ignored`,
		},
	});

	const instances = [directusMem, directusMemPurge, directusRedis, directusRedisPurge];

	type Api = DirectusClient<Schema> & RestClient<Schema> & StaticTokenClient<Schema>;

	for (const instance of instances) {
		describe('Permissions Cache Purging Tests', async () => {
			const action = 'read';
			const updatedAction = 'update';
			let policyId: string;
			const collection = 'collection';

			const mutations = {
				createOne: async (api: Api) => {
					const item = { collection, action, policy: policyId };

					await api.request(clearCache());
					await api.request(readItems(collection as any));

					await api.request(createPermission(item));
				},
				createMany: async (api: Api) => {
					const items = Array(5).fill({ collection, action, policy: policyId });

					await api.request(clearCache());
					await api.request(readItems(collection as any));

					await api.request(createPermissions(items));
				},
				updateOne: async (api: Api) => {
					const item = { collection, action, policy: policyId };
					const updatedItem = { action: updatedAction };

					const itemId = (await api.request(createPermission(item))).id;

					await api.request(clearCache());
					await api.request(readItems(collection as any));

					await api.request(updatePermission(itemId, updatedItem));
				},
				updateMany: async (api: Api) => {
					const items = Array(5).fill({ collection, action, policy: policyId });

					const updatedItem = { action: updatedAction };

					const itemIds = (await api.request(createPermissions(items))).map((item) => item.id).filter((v) => v);

					await api.request(clearCache());
					await api.request(readItems(collection as any));

					await api.request(updatePermissions(itemIds, updatedItem));
				},
				updateBatch: async (api: Api) => {
					const items = Array(5).fill({ collection, action, policy: policyId });

					const itemIds = (await api.request(createPermissions(items))).map((item) => item.id).filter((v) => v);

					const updatedItems = Array(5)
						.fill(0)
						.map((_, index) => {
							return { id: itemIds[index]!, action: updatedAction };
						});

					await api.request(clearCache());
					await api.request(readItems(collection as any));

					await api.request(updatePermissionsBatch(updatedItems));
				},
				deleteOne: async (api: Api) => {
					const item = { collection, action, policy: policyId };

					const itemId = (await api.request(createPermission(item))).id;

					await api.request(clearCache());
					await api.request(readItems(collection as any));

					await api.request(deletePermission(itemId));
				},
				deleteMany: async (api: Api) => {
					const items = Array(5).fill({ collection, action, policy: policyId });

					const itemIds = (await api.request(createPermissions(items))).map((item) => item.id).filter((v) => v);

					await api.request(clearCache());
					await api.request(readItems(collection as any));

					await api.request(deletePermissions(itemIds));
				},
			};

			describe(instance.env.PORT, async () => {
				const api = createDirectus<Schema>(`http://localhost:${instance.env.PORT}`)
					.with(rest())
					.with(staticToken('admin'));

				const newPolicy = await api.request(
					createPolicy({
						admin_access: false,
						app_access: false,
						name: 'Cache Purge Test',
					}),
				);

				policyId = newPolicy.id;

				test.each(Object.keys(mutations))('Purge cache after %s in permissions', async (mutationKey) => {
					// Action
					await mutations[mutationKey as keyof typeof mutations](api);

					const response = await fetch(`http://localhost:${instance.env.PORT}/items/collection`, {
						headers: {
							Authorization: 'Bearer admin',
						},
					});

					// Assert
					expect(response.status).toBe(200);
					expect(response.headers.get('x-cache-status')).toBe('MISS');
				});
			});
		});
	}
}
