import config, { getUrl, paths, type Env } from '@common/config';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import { awaitDirectusConnection } from '@utils/await-connection';
import { ChildProcess, spawn } from 'child_process';
import getPort from 'get-port';
import { cloneDeep } from 'lodash-es';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { collection, type Collection } from './cache-purge.seed';

describe('Permissions Cache Purging Tests', () => {
	const cacheStatusHeader = 'x-cache-status';

	const action = 'read';
	const updatedAction = 'update';

	const mutations = {
		createOne: async (vendor: Vendor, env: Env) => {
			const item = { collection, action };

			await clearCacheAndFetchOnce(vendor, env);

			await request(getUrl(vendor, env))
				.post('/permissions')
				.send(item)
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
		},
		createMany: async (vendor: Vendor, env: Env) => {
			const items = Array(5).fill({ collection, action });

			await clearCacheAndFetchOnce(vendor, env);

			await request(getUrl(vendor, env))
				.post('/permissions')
				.send(items)
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
		},
		updateOne: async (vendor: Vendor, env: Env) => {
			const item = { collection, action };
			const updatedItem = { action: updatedAction };

			const itemId = (
				await request(getUrl(vendor, env))
					.post('/permissions')
					.send(item)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			).body.data.id;

			await clearCacheAndFetchOnce(vendor, env);

			await request(getUrl(vendor, env))
				.patch(`/permissions/${itemId}`)
				.send(updatedItem)
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
		},
		updateMany: async (vendor: Vendor, env: Env) => {
			const items = Array(5).fill({ collection, action });

			const updatedItem = { action: updatedAction };

			const itemIds = (
				await request(getUrl(vendor, env))
					.post('/permissions')
					.send(items)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			).body.data
				.map((item: Collection) => {
					return item.id;
				})
				.filter((v: any) => v);

			await clearCacheAndFetchOnce(vendor, env);

			await request(getUrl(vendor, env))
				.patch('/permissions')
				.send({ keys: itemIds, data: updatedItem })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
		},
		updateBatch: async (vendor: Vendor, env: Env) => {
			const items = Array(5).fill({ collection, action });

			const itemIds = (
				await request(getUrl(vendor, env))
					.post('/permissions')
					.send(items)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			).body.data.map((item: Collection) => {
				return item.id;
			});

			const updatedItems = Array(5)
				.fill(0)
				.map((_, index) => {
					return { id: itemIds[index], action: updatedAction };
				});

			await clearCacheAndFetchOnce(vendor, env);

			await request(getUrl(vendor, env))
				.patch('/permissions')
				.send(updatedItems)
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
		},
		deleteOne: async (vendor: Vendor, env: Env) => {
			const item = { collection, action };

			const itemId = (
				await request(getUrl(vendor, env))
					.post('/permissions')
					.send(item)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			).body.data.id;

			await clearCacheAndFetchOnce(vendor, env);

			await request(getUrl(vendor, env))
				.delete(`/permissions/${itemId}`)
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
		},
		deleteMany: async (vendor: Vendor, env: Env) => {
			const items = Array(5).fill({ collection, action });

			const itemIds = (
				await request(getUrl(vendor, env))
					.post('/permissions')
					.send(items)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			).body.data
				.map((item: Collection) => {
					return item.id;
				})
				.filter((v: any) => v);

			await clearCacheAndFetchOnce(vendor, env);

			await request(getUrl(vendor, env))
				.delete('/permissions')
				.send(itemIds)
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
		},
	};

	describe.each(vendors)('%s', (vendor) => {
		const cacheNamespacePrefix = 'directus-perms-caching';

		const envMem = cloneDeep(config.envs);
		envMem[vendor]['CACHE_ENABLED'] = 'true';
		envMem[vendor]['CACHE_STATUS_HEADER'] = cacheStatusHeader;
		envMem[vendor]['CACHE_AUTO_PURGE'] = 'false';
		envMem[vendor]['CACHE_STORE'] = 'memory';
		envMem[vendor]['CACHE_NAMESPACE'] = `${cacheNamespacePrefix}_mem`;

		const envMemPurge = cloneDeep(envMem);
		envMemPurge[vendor]['CACHE_AUTO_PURGE'] = 'true';
		envMemPurge[vendor]['CACHE_NAMESPACE'] = `${cacheNamespacePrefix}_mem_purge`;

		const envRedis = cloneDeep(envMem);
		envRedis[vendor]['REDIS_HOST'] = 'localhost';
		envRedis[vendor]['REDIS_PORT'] = '6108';
		envRedis[vendor]['CACHE_STORE'] = 'redis';
		envRedis[vendor]['CACHE_NAMESPACE'] = `${cacheNamespacePrefix}_redis`;

		const envRedisPurge = cloneDeep(envRedis);
		envRedisPurge[vendor]['CACHE_AUTO_PURGE'] = 'true';
		envRedisPurge[vendor]['CACHE_NAMESPACE'] = `${cacheNamespacePrefix}_redis_purge`;

		describe.each([
			['memory', envMem],
			['memory (purge)', envMemPurge],
			['redis', envRedis],
			['redis (purge)', envRedisPurge],
		])('%s', (_, env) => {
			let instance: ChildProcess;

			beforeAll(async () => {
				const newServerPort = await getPort();

				env[vendor].PORT = String(newServerPort);

				instance = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: env[vendor] });

				await awaitDirectusConnection(newServerPort);
			}, 60_000);

			afterAll(() => {
				instance.kill();
			});

			it.each(Object.keys(mutations))('Purges cache after %s in permissions', async (mutationKey) => {
				// Action
				await mutations[mutationKey as keyof typeof mutations](vendor, env);

				const response = await request(getUrl(vendor, env))
					.get(`/items/${collection}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toBe(200);
				expect(response.headers[cacheStatusHeader]).toBe('MISS');
			});
		});
	});
});

async function clearCacheAndFetchOnce(vendor: Vendor, env: Env) {
	await request(getUrl(vendor, env)).post(`/utils/cache/clear`).set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

	await request(getUrl(vendor, env)).get(`/items/${collection}`).set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
}
