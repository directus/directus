import { ChildProcess, spawn } from 'child_process';
import config, { type Env, getUrl, paths } from '@common/config';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import { awaitDirectusConnection } from '@utils/await-connection';
import { delayedSleep } from '@utils/sleep';
import getPort from 'get-port';
import type { Knex } from 'knex';
import knex from 'knex';
import { cloneDeep } from 'lodash-es';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, test } from 'vitest';
import { envTargetVariable, flowName, logPrefix, seedDBValues } from './schedule-hook.seed';

let isSeeded = false;

beforeAll(async () => {
	isSeeded = await seedDBValues();
}, 300_000);

test('Seed Database Values', () => {
	expect(isSeeded).toStrictEqual(true);
});

describe('Flows Schedule Hook Tests', () => {
	const databases = new Map<Vendor, Knex>();
	const directusInstances = {} as Record<Vendor, ChildProcess[]>;
	const envs = {} as Record<Vendor, Env[]>;
	const flowIds = {} as { [vendor: string]: string };

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			const envRedis1 = cloneDeep(config.envs);
			envRedis1[vendor]['FLOWS_ENV_ALLOW_LIST'] = envTargetVariable;
			envRedis1[vendor]['REDIS'] = `redis://localhost:6108/4`;
			envRedis1[vendor]['SYNCHRONIZATION_STORE'] = 'redis';
			envRedis1[vendor]['SYNCHRONIZATION_NAMESPACE'] = `directus-${vendor}`;
			envRedis1[vendor][envTargetVariable] = 'redis-1';
			envRedis1[vendor]['LOG_LEVEL'] = 'info';

			const envRedis2 = cloneDeep(envRedis1);
			envRedis2[vendor][envTargetVariable] = 'redis-2';

			const envMemory = cloneDeep(envRedis1);
			delete envMemory[vendor]['SYNCHRONIZATION_STORE'];
			envMemory[vendor][envTargetVariable] = 'memory-1';

			const newServerPort1 = await getPort();
			const newServerPort2 = await getPort();
			const newServerPort3 = await getPort();

			envRedis1[vendor].PORT = String(newServerPort1);
			envRedis2[vendor].PORT = String(newServerPort2);
			envMemory[vendor].PORT = String(newServerPort3);

			const server1 = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: envRedis1[vendor] });
			const server2 = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: envRedis2[vendor] });
			const server3 = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: envMemory[vendor] });

			directusInstances[vendor] = [server1, server2, server3];
			envs[vendor] = [envRedis1, envRedis2, envMemory];

			promises.push(
				awaitDirectusConnection(newServerPort1),
				awaitDirectusConnection(newServerPort2),
				awaitDirectusConnection(newServerPort3),
			);
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
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			).body.data[0].id;
		}
	}, 180_000);

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			for (const instance of directusInstances[vendor]) {
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

			// Create delayed sleep, set to 9s (4 flow executions, execution every 2s + a small delay)
			const { sleep, sleepStart, sleepHasStarted } = delayedSleep(9000);

			const flowExecutions: string[] = [];

			const processLogLine = (chunk: any) => {
				const logLine = String(chunk);

				if (logLine.includes(logPrefix)) {
					// Start sleep timer as soon as first flow has been executed
					if (!sleepHasStarted()) {
						sleepStart();
					}

					flowExecutions.push(logLine.substring(logLine.indexOf(logPrefix) + logPrefix.length));
				}
			};

			// Process logs of all instances
			for (const instance of directusInstances[vendor]) {
				// Discard data up to this point
				instance.stdout?.read();
				instance.stdout?.on('data', processLogLine);
			}

			// Action
			await request(getUrl(vendor, env))
				.patch(`/flows/${flowId}`)
				.send({ status: 'active' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			await sleep;

			// Stop processing logs
			for (const instance of directusInstances[vendor]) {
				instance.stdout?.off('data', processLogLine);
			}

			await request(getUrl(vendor, env))
				.patch(`/flows/${flowId}`)
				.send({ status: 'inactive' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const redisExecutionCount = flowExecutions.filter((execution) => execution.includes('redis-')).length;
			const memoryExecutionCount = flowExecutions.filter((execution) => execution.includes('memory-')).length;

			// Assert
			expect(redisExecutionCount).toBe(5);
			expect(memoryExecutionCount).toBe(5);
		});
	});
});
