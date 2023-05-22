import config, { Env, getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import * as common from '@common/index';
import { awaitDirectusConnection } from '@utils/await-connection';
import { ChildProcess, spawn } from 'child_process';
import type { Knex } from 'knex';
import knex from 'knex';
import { cloneDeep } from 'lodash';
import request from 'supertest';
import { Collection, collection } from './cache-purge.seed';

describe('Permissions Cache Purging Tests', () => {
	const databases = new Map<string, Knex>();
	const directusInstances = {} as { [vendor: string]: ChildProcess[] };
	const envKeys = ['envMem', 'envMemPurge', 'envRedis', 'envRedisPurge'];
	type EnvTypes = Record<(typeof envKeys)[number], Env>;
	const envs = {} as { [vendor: string]: EnvTypes };
	const cacheNamespacePrefix = 'directus-perms-caching';
	const cacheStatusHeader = 'x-cache-status';

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			const envMem = cloneDeep(config.envs);
			envMem[vendor].CACHE_ENABLED = 'true';
			envMem[vendor].CACHE_STATUS_HEADER = cacheStatusHeader;
			envMem[vendor].CACHE_AUTO_PURGE = 'false';
			envMem[vendor].CACHE_STORE = 'memory';
			envMem[vendor].CACHE_NAMESPACE = `${cacheNamespacePrefix}_mem`;

			const envMemPurge = cloneDeep(envMem);
			envMemPurge[vendor].CACHE_AUTO_PURGE = 'true';
			envMemPurge[vendor].CACHE_NAMESPACE = `${cacheNamespacePrefix}_mem_purge`;

			const envRedis = cloneDeep(envMem);
			envRedis[vendor].CACHE_STORE = 'redis';
			envRedis[vendor].CACHE_REDIS_HOST = 'localhost';
			envRedis[vendor].CACHE_REDIS_PORT = '6108';
			envRedis[vendor].CACHE_NAMESPACE = `${cacheNamespacePrefix}_redis`;

			const envRedisPurge = cloneDeep(envRedis);
			envRedisPurge[vendor].CACHE_AUTO_PURGE = 'true';
			envRedisPurge[vendor].CACHE_NAMESPACE = `${cacheNamespacePrefix}_redis_purge`;

			const newServerPortMem = Number(envMem[vendor]!.PORT) + 150;
			const newServerPortMemPurge = Number(envMemPurge[vendor]!.PORT) + 200;
			const newServerPortRedis = Number(envRedis[vendor]!.PORT) + 250;
			const newServerPortRedisPurge = Number(envRedisPurge[vendor]!.PORT) + 300;

			envMem[vendor]!.PORT = String(newServerPortMem);
			envMemPurge[vendor]!.PORT = String(newServerPortMemPurge);
			envRedis[vendor]!.PORT = String(newServerPortRedis);
			envRedisPurge[vendor]!.PORT = String(newServerPortRedisPurge);

			const serverMem = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: envMem[vendor] });
			const serverMemPurge = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: envMemPurge[vendor] });
			const serverRedis = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: envRedis[vendor] });
			const serverRedisPurge = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: envRedisPurge[vendor] });

			directusInstances[vendor] = [serverMem, serverMemPurge, serverRedis, serverRedisPurge];
			envs[vendor] = { envMem, envMemPurge, envRedis, envRedisPurge };

			promises.push(awaitDirectusConnection(newServerPortMem));
			promises.push(awaitDirectusConnection(newServerPortMemPurge));
			promises.push(awaitDirectusConnection(newServerPortRedis));
			promises.push(awaitDirectusConnection(newServerPortRedisPurge));
		}

		// Give the server some time to start
		await Promise.all(promises);
	}, 180000);

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			for (const instance of directusInstances[vendor]!) {
				instance.kill();
			}

			await connection.destroy();
		}
	});

	async function clearCacheAndFetchOnce(vendor: string, env: Env) {
		await request(getUrl(vendor, env))
			.post(`/utils/cache/clear`)
			.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

		await request(getUrl(vendor, env))
			.get(`/items/${collection}`)
			.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
	}

	const action = 'read';
	const updatedAction = 'update';

	const mutations = {
		createOne: async (vendor: string, env: Env) => {
			const item = { collection, action };

			await clearCacheAndFetchOnce(vendor, env);

			await request(getUrl(vendor, env))
				.post('/permissions')
				.send(item)
				.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
		},
		createMany: async (vendor: string, env: Env) => {
			const items = Array(5).fill({ collection, action });

			await clearCacheAndFetchOnce(vendor, env);

			await request(getUrl(vendor, env))
				.post('/permissions')
				.send(items)
				.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
		},
		updateOne: async (vendor: string, env: Env) => {
			const item = { collection, action };
			const updatedItem = { action: updatedAction };

			const itemId = (
				await request(getUrl(vendor, env))
					.post('/permissions')
					.send(item)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
			).body.data.id;

			await clearCacheAndFetchOnce(vendor, env);

			await request(getUrl(vendor, env))
				.patch(`/permissions/${itemId}`)
				.send(updatedItem)
				.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
		},
		updateMany: async (vendor: string, env: Env) => {
			const items = Array(5).fill({ collection, action });

			const updatedItem = { action: updatedAction };

			const itemIds = (
				await request(getUrl(vendor, env))
					.post('/permissions')
					.send(items)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
			).body.data
				.map((item: Collection) => {
					return item.id;
				})
				.filter((v: any) => v);

			await clearCacheAndFetchOnce(vendor, env);

			await request(getUrl(vendor, env))
				.patch('/permissions')
				.send({ keys: itemIds, data: updatedItem })
				.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
		},
		updateBatch: async (vendor: string, env: Env) => {
			const items = Array(5).fill({ collection, action });

			const itemIds = (
				await request(getUrl(vendor, env))
					.post('/permissions')
					.send(items)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
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
				.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
		},
		deleteOne: async (vendor: string, env: Env) => {
			const item = { collection, action };

			const itemId = (
				await request(getUrl(vendor, env))
					.post('/permissions')
					.send(item)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
			).body.data.id;

			await clearCacheAndFetchOnce(vendor, env);

			await request(getUrl(vendor, env))
				.delete(`/permissions/${itemId}`)
				.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
		},
		deleteMany: async (vendor: string, env: Env) => {
			const items = Array(5).fill({ collection, action });

			const itemIds = (
				await request(getUrl(vendor, env))
					.post('/permissions')
					.send(items)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
			).body.data
				.map((item: Collection) => {
					return item.id;
				})
				.filter((v: any) => v);

			await clearCacheAndFetchOnce(vendor, env);

			await request(getUrl(vendor, env))
				.delete('/permissions')
				.send(itemIds)
				.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
		},
	};

	describe.each(Object.keys(mutations))('Purges cache after %s in permissions', (mutationKey) => {
		describe.each(envKeys)('%s', (key) => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const env = envs[vendor][key as keyof EnvTypes];

				// Action
				await mutations[mutationKey as keyof typeof mutations](vendor, env);

				const response = await request(getUrl(vendor, env))
					.get(`/items/${collection}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toBe(200);
				expect(response.headers[cacheStatusHeader]).toBe('MISS');
			});
		});
	});
});
