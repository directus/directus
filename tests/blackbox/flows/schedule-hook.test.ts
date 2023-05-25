import config, { Env, getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import * as common from '@common/index';
import { awaitDirectusConnection } from '@utils/await-connection';
import { sleep } from '@utils/sleep';
import { ChildProcess, spawn } from 'child_process';
import type { Knex } from 'knex';
import knex from 'knex';
import { cloneDeep } from 'lodash';
import request from 'supertest';
import { collection, envTargetVariable, fieldData, flowName, seedDBValues } from './schedule-hook.seed';

let isSeeded = false;

beforeAll(async () => {
	isSeeded = await seedDBValues();
}, 300000);

test('Seed Database Values', () => {
	expect(isSeeded).toStrictEqual(true);
});

describe('Flows Schedule Hook Tests', () => {
	const databases = new Map<string, Knex>();
	const directusInstances = {} as { [vendor: string]: ChildProcess[] };
	const envs = {} as { [vendor: string]: Env[] };
	const flowIds = {} as { [vendor: string]: string };

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			const envRedis1 = cloneDeep(config.envs);
			envRedis1[vendor].FLOWS_ENV_ALLOW_LIST = envTargetVariable;
			envRedis1[vendor].MESSENGER_STORE = 'redis';
			envRedis1[vendor].MESSENGER_NAMESPACE = `directus-${vendor}`;
			envRedis1[vendor].MESSENGER_REDIS = `redis://localhost:6108/4`;
			envRedis1[vendor].SYNCHRONIZATION_STORE = 'redis';
			envRedis1[vendor].SYNCHRONIZATION_NAMESPACE = `directus-${vendor}`;
			envRedis1[vendor].SYNCHRONIZATION_REDIS = `redis://localhost:6108/4`;
			envRedis1[vendor][envTargetVariable] = 'redis-1';

			const envRedis2 = cloneDeep(envRedis1);
			envRedis2[vendor][envTargetVariable] = 'redis-2';

			const envMemory = cloneDeep(envRedis1);
			delete envMemory[vendor].SYNCHRONIZATION_STORE;
			delete envMemory[vendor].SYNCHRONIZATION_REDIS;
			envMemory[vendor][envTargetVariable] = 'memory-1';

			const newServerPort1 = Number(envRedis1[vendor]!.PORT) + 150;
			const newServerPort2 = Number(envRedis2[vendor]!.PORT) + 200;
			const newServerPort3 = Number(envMemory[vendor]!.PORT) + 250;

			envRedis1[vendor]!.PORT = String(newServerPort1);
			envRedis2[vendor]!.PORT = String(newServerPort2);
			envMemory[vendor]!.PORT = String(newServerPort3);

			const server1 = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: envRedis1[vendor] });
			const server2 = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: envRedis2[vendor] });
			const server3 = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: envMemory[vendor] });

			directusInstances[vendor] = [server1, server2, server3];
			envs[vendor] = [envRedis1, envRedis2, envMemory];

			promises.push(awaitDirectusConnection(newServerPort1));
			promises.push(awaitDirectusConnection(newServerPort2));
			promises.push(awaitDirectusConnection(newServerPort3));
		}

		// Give the server some time to start
		await Promise.all(promises);

		for (const vendor of vendors) {
			flowIds[vendor] = (
				await request(getUrl(vendor, envs[vendor][0]))
					.get(`/flows`)
					.query({
						filter: JSON.stringify({ name: { _eq: flowName } }),
					})
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
			).body.data[0].id;
		}
	}, 180000);

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			for (const instance of directusInstances[vendor]!) {
				instance.kill();
			}

			await connection.destroy();
		}
	});

	describe('scheduled hooks are synchronized using redis', () => {
		it.each(vendors)('%s', async (vendor) => {
			// Setup
			const env = envs[vendor][0]; // All instances are connected via MESSENGER
			const flowId = flowIds[vendor];

			// Action
			await request(getUrl(vendor, env))
				.patch(`/flows/${flowId}`)
				.send({ status: 'active' })
				.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

			await sleep(10000);

			await request(getUrl(vendor, env))
				.patch(`/flows/${flowId}`)
				.send({ status: 'inactive' })
				.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

			const redisRunCount = (
				await request(getUrl(vendor, env))
					.get(`/items/${collection}`)
					.query({
						filter: JSON.stringify({
							[fieldData]: { _starts_with: 'redis' },
						}),
						aggregate: {
							count: 'id',
						},
					})
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
			).body.data[0].count.id;

			const memoryRunCount = (
				await request(getUrl(vendor, env))
					.get(`/items/${collection}`)
					.query({
						filter: JSON.stringify({
							[fieldData]: { _starts_with: 'memory' },
						}),
						aggregate: {
							count: 'id',
						},
					})
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
			).body.data[0].count.id;

			// Assert
			expect(parseInt(redisRunCount)).toBe(5);
			expect(parseInt(memoryRunCount)).toBe(5);
		});
	});
});
