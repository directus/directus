import config, { Env, getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import * as common from '@common/index';
import { awaitDirectusConnection } from '@utils/await-connection';
import { ChildProcess, spawn } from 'child_process';
import type { Knex } from 'knex';
import knex from 'knex';
import { cloneDeep } from 'lodash';
import request from 'supertest';
import { collectionFirst, collectionIgnored, seedDBValues } from './cache.seed';
import { v4 as uuid } from 'uuid';

let isSeeded = false;

beforeAll(async () => {
	isSeeded = await seedDBValues();
}, 300000);

test('Seed Database Values', () => {
	expect(isSeeded).toStrictEqual(true);
});

describe('App Caching Tests', () => {
	const databases = new Map<string, Knex>();
	const directusInstances = {} as { [vendor: string]: ChildProcess[] };
	const envKeys = ['envMem', 'envMemPurge', 'envRedis', 'envRedisPurge'];
	type EnvTypes = Record<(typeof envKeys)[number], Env>;
	const envs = {} as { [vendor: string]: EnvTypes };
	const cacheNamespacePrefix = 'directus-app-cache';
	const cacheStatusHeader = 'x-cache-status';
	const publicURL = 'http://example.com';

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			const envMem = cloneDeep(config.envs);
			envMem[vendor].PUBLIC_URL = publicURL;
			envMem[vendor].CACHE_ENABLED = 'true';
			envMem[vendor].CACHE_STATUS_HEADER = cacheStatusHeader;
			envMem[vendor].CACHE_AUTO_PURGE = 'false';
			envMem[vendor].CACHE_AUTO_PURGE_IGNORE_LIST = `directus_activity,directus_presets,${collectionIgnored}`;
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

	describe('Does not purge cache browsing app without Referer header', () => {
		describe.each(envKeys)('%s', (key) => {
			describe.each([collectionFirst, collectionIgnored])('%s', (collection) => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const env = envs[vendor][key as keyof EnvTypes];

					await request(getUrl(vendor, env))
						.post(`/utils/cache/clear`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Action
					await request(getUrl(vendor, env))
						.get(`/items/${collection}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					await request(getUrl(vendor, env))
						.patch('/users/me/track/page')
						.send({ last_page: `/content/${collection}` })
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const presetId = (
						await request(getUrl(vendor, env))
							.post('/presets')
							.send({
								collection,
							})
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					).body.data.id;

					await request(getUrl(vendor, env))
						.patch(`/presets/${presetId}`)
						.send({
							collection,
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const response = await request(getUrl(vendor, env))
						.get(`/items/${collection}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.headers[cacheStatusHeader]).toBe('HIT');
				});
			});
		});
	});

	describe('Does not purge cache when browsing app with Referer header', () => {
		describe.each(envKeys)('%s', (key) => {
			describe.each([collectionFirst, collectionIgnored])('%s', (collection) => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const env = envs[vendor][key as keyof EnvTypes];
					const referer = `${publicURL}/admin/content/${collection}/`;

					await request(getUrl(vendor, env))
						.post(`/utils/cache/clear`)
						.set('Referer', referer)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Action
					await request(getUrl(vendor, env))
						.get(`/items/${collection}`)
						.set('Referer', referer)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					await request(getUrl(vendor, env))
						.patch('/users/me/track/page')
						.send({ last_page: `/content/${collection}` })
						.set('Referer', referer)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const presetId = (
						await request(getUrl(vendor, env))
							.post('/presets')
							.send({
								collection,
							})
							.set('Referer', referer)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					).body.data.id;

					await request(getUrl(vendor, env))
						.patch(`/presets/${presetId}`)
						.send({
							collection,
						})
						.set('Referer', referer)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const response = await request(getUrl(vendor, env))
						.get(`/items/${collection}`)
						.set('Referer', referer)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					if (collection === collectionFirst) {
						const expectedCacheStatus = key.endsWith('Purge') ? 'HIT' : 'MISS';

						expect(response.statusCode).toBe(200);
						expect(response.headers[cacheStatusHeader]).toBe(expectedCacheStatus);
					} else {
						expect(response.statusCode).toBe(200);
						expect(response.headers[cacheStatusHeader]).toBe('MISS');
					}
				});
			});
		});
	});

	describe('Purges cache when item is mutated', () => {
		describe.each(envKeys)('%s', (key) => {
			describe.each([collectionFirst, collectionIgnored])('%s', (collection) => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const env = envs[vendor][key as keyof EnvTypes];

					await request(getUrl(vendor, env))
						.post(`/utils/cache/clear`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Action
					await request(getUrl(vendor, env))
						.get(`/items/${collection}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					await request(getUrl(vendor, env))
						.post(`/items/${collection}`)
						.send({ string_field: uuid() })
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const response = await request(getUrl(vendor, env))
						.get(`/items/${collection}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					if (collection === collectionFirst) {
						const expectedCacheStatus = key.endsWith('Purge') ? 'MISS' : 'HIT';

						expect(response.statusCode).toBe(200);
						expect(response.headers[cacheStatusHeader]).toBe(expectedCacheStatus);
					} else {
						expect(response.statusCode).toBe(200);
						expect(response.headers[cacheStatusHeader]).toBe('HIT');
					}
				});
			});
		});
	});

	describe('Purges cache when item is mutated with Referer header', () => {
		describe.each(envKeys)('%s', (key) => {
			describe.each([collectionFirst, collectionIgnored])('%s', (collection) => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const env = envs[vendor][key as keyof EnvTypes];
					const referer = `${publicURL}/admin/content/${collection}/`;

					await request(getUrl(vendor, env))
						.post(`/utils/cache/clear`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Action
					await request(getUrl(vendor, env))
						.get(`/items/${collection}`)
						.set('Referer', referer)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					await request(getUrl(vendor, env))
						.post(`/items/${collection}`)
						.send({ string_field: uuid() })
						.set('Referer', referer)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const response = await request(getUrl(vendor, env))
						.get(`/items/${collection}`)
						.set('Referer', referer)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.headers[cacheStatusHeader]).toBe('MISS');
				});
			});
		});
	});

	describe('Purges cache when item is mutated with an external Referer header', () => {
		describe.each(envKeys)('%s', (key) => {
			describe.each([collectionFirst, collectionIgnored])('%s', (collection) => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const env = envs[vendor][key as keyof EnvTypes];
					const referer = `http://external.com/admin/content/${collection}`;

					await request(getUrl(vendor, env))
						.post(`/utils/cache/clear`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Action
					await request(getUrl(vendor, env))
						.get(`/items/${collection}`)
						.set('Referer', referer)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					await request(getUrl(vendor, env))
						.post(`/items/${collection}`)
						.send({ string_field: uuid() })
						.set('Referer', referer)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const response = await request(getUrl(vendor, env))
						.get(`/items/${collection}`)
						.set('Referer', referer)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					if (collection === collectionFirst) {
						const expectedCacheStatus = key.endsWith('Purge') ? 'MISS' : 'HIT';

						expect(response.statusCode).toBe(200);
						expect(response.headers[cacheStatusHeader]).toBe(expectedCacheStatus);
					} else {
						expect(response.statusCode).toBe(200);
						expect(response.headers[cacheStatusHeader]).toBe('HIT');
					}
				});
			});
		});
	});
});
