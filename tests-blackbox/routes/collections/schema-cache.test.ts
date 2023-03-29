import config, { Env, getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import request from 'supertest';
import knex, { Knex } from 'knex';
import { spawn, ChildProcess } from 'child_process';
import { awaitDirectusConnection } from '@utils/await-connection';
import * as common from '@common/index';
import { cloneDeep } from 'lodash';

describe('Schema Caching Tests', () => {
	const databases = new Map<string, Knex>();
	const tzDirectus = {} as { [vendor: string]: ChildProcess[] };
	const envs = {} as { [vendor: string]: Env[] };
	const newCollectionName = 'schema-caching-test';

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			const env = cloneDeep(config.envs);
			env[vendor].CACHE_ENABLED = 'true';
			env[vendor].CACHE_AUTO_PURGE = 'true';
			env[vendor].CACHE_SCHEMA = 'true';
			env[vendor].CACHE_STORE = 'memory';
			env[vendor].CACHE_NAMESPACE = 'directus-schema-cache';
			env[vendor].MESSENGER_STORE = 'redis';
			env[vendor].MESSENGER_NAMESPACE = `directus-${vendor}`;
			env[vendor].MESSENGER_REDIS = `redis://localhost:6108/4`;

			const env2 = cloneDeep(env);
			env2[vendor].CACHE_NAMESPACE = env[vendor].CACHE_NAMESPACE + '2';

			const env3 = cloneDeep(env);
			env3[vendor].CACHE_NAMESPACE = env[vendor].CACHE_NAMESPACE + '3';
			delete env3[vendor].MESSENGER_STORE;
			delete env3[vendor].MESSENGER_NAMESPACE;
			delete env3[vendor].MESSENGER_REDIS;

			const env4 = cloneDeep(env3);
			env4[vendor].CACHE_NAMESPACE = env[vendor].CACHE_NAMESPACE + '4';

			const newServerPort = Number(env[vendor]!.PORT) + 150;
			const newServerPort2 = Number(env2[vendor]!.PORT) + 200;
			const newServerPort3 = Number(env3[vendor]!.PORT) + 250;
			const newServerPort4 = Number(env4[vendor]!.PORT) + 300;

			env[vendor]!.PORT = String(newServerPort);
			env2[vendor]!.PORT = String(newServerPort2);
			env3[vendor]!.PORT = String(newServerPort3);
			env4[vendor]!.PORT = String(newServerPort4);

			const server = spawn('node', ['api/cli', 'start'], { env: env[vendor] });
			const server2 = spawn('node', ['api/cli', 'start'], { env: env2[vendor] });
			const server3 = spawn('node', ['api/cli', 'start'], { env: env3[vendor] });
			const server4 = spawn('node', ['api/cli', 'start'], { env: env4[vendor] });

			tzDirectus[vendor] = [server, server2, server3, server4];
			envs[vendor] = [env, env2, env3, env4];

			promises.push(awaitDirectusConnection(newServerPort));
			promises.push(awaitDirectusConnection(newServerPort2));
			promises.push(awaitDirectusConnection(newServerPort3));
			promises.push(awaitDirectusConnection(newServerPort4));
		}

		// Give the server some time to start
		await Promise.all(promises);
	}, 180000);

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			for (const instance of tzDirectus[vendor]!) {
				instance.kill();
			}

			await connection.destroy();
		}
	});

	describe('GET /collections/:collection', () => {
		describe('schema change propagates across nodes using messenger', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const env = envs[vendor][0];
				const env2 = envs[vendor][1];

				await common.CreateCollection(vendor, { collection: newCollectionName, env });

				await request(getUrl(vendor, env))
					.post(`/utils/cache/clear`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
				await request(getUrl(vendor, env)).get(`/fields`).set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				await request(getUrl(vendor, env2))
					.post(`/utils/cache/clear`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
				await request(getUrl(vendor, env2)).get(`/fields`).set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Action
				const responseBefore = await request(getUrl(vendor, env))
					.get(`/collections/${newCollectionName}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
				const responseBefore2 = await request(getUrl(vendor, env2))
					.get(`/collections/${newCollectionName}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				await request(getUrl(vendor, env))
					.delete(`/collections/${newCollectionName}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				const responseAfter = await request(getUrl(vendor, env))
					.get(`/collections/${newCollectionName}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
				const responseAfter2 = await request(getUrl(vendor, env2))
					.get(`/collections/${newCollectionName}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(responseBefore.statusCode).toBe(200);
				expect(responseBefore2.statusCode).toBe(200);
				expect(responseAfter.statusCode).toBe(403);
				expect(responseAfter2.statusCode).toBe(403);
			});
		});

		describe('schema change does not propagate across nodes without messenger', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const env3 = envs[vendor][2];
				const env4 = envs[vendor][3];

				await common.CreateCollection(vendor, { collection: newCollectionName, env: env3 });

				await request(getUrl(vendor, env3))
					.post(`/utils/cache/clear`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
				await request(getUrl(vendor, env3)).get(`/fields`).set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				await request(getUrl(vendor, env4))
					.post(`/utils/cache/clear`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
				await request(getUrl(vendor, env4)).get(`/fields`).set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Action
				const responseBefore = await request(getUrl(vendor, env3))
					.get(`/collections/${newCollectionName}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
				const responseBefore2 = await request(getUrl(vendor, env4))
					.get(`/collections/${newCollectionName}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				await request(getUrl(vendor, env3))
					.delete(`/collections/${newCollectionName}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				const responseAfter = await request(getUrl(vendor, env3))
					.get(`/collections/${newCollectionName}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
				const responseAfter2 = await request(getUrl(vendor, env4))
					.get(`/collections/${newCollectionName}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(responseBefore.statusCode).toBe(200);
				expect(responseBefore2.statusCode).toBe(200);
				expect(responseAfter.statusCode).toBe(403);
				expect(responseAfter2.statusCode).toBe(200);
			});
		});
	});
});
