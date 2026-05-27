import { ChildProcess, spawn } from 'child_process';
import config, { type Env, getUrl, paths } from '@common/config';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import { awaitDirectusConnection } from '@utils/await-connection';
import { sleep } from '@utils/sleep';
import getPort from 'get-port';
import type { Knex } from 'knex';
import knex from 'knex';
import { cloneDeep } from 'lodash-es';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/flows', () => {
	const databases = new Map<Vendor, Knex>();
	const directusInstances = {} as Record<Vendor, ChildProcess>;
	const envs = {} as { [vendor: string]: Env };

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			const env = cloneDeep(config.envs);
			env[vendor]['CACHE_ENABLED'] = 'true';
			env[vendor]['CACHE_STORE'] = 'memory';

			const newServerPort = await getPort();
			env[vendor].PORT = String(newServerPort);

			const server = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: env[vendor] });

			directusInstances[vendor] = server;
			envs[vendor] = env;

			promises.push(awaitDirectusConnection(newServerPort));
		}

		// Give the server some time to start
		await Promise.all(promises);
	}, 180_000);

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			directusInstances[vendor].kill();
			await connection.destroy();
		}
	});

	describe('Webhook Trigger', () => {
		describe('cacheEnabled works for GET', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const env = envs[vendor];

				const payloadFlowCreate = {
					name: 'webhook flow',
					icon: 'bolt',
					color: null,
					description: null,
					status: 'active',
					accountability: null,
					trigger: 'webhook',
					options: {},
				};

				const payloadOperationCreate = {
					position_x: 19,
					position_y: 1,
					name: 'Get epoch milliseconds',
					key: 'op_exev',
					type: 'exec',
					options: { code: 'module.exports = async function() { return { epoch: Date.now() }; }' },
				};

				const flowId = (
					await request(getUrl(vendor, env))
						.post('/flows')
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
						.query({ fields: ['id'] })
						.send(payloadFlowCreate)
				).body.data.id;

				const flowCacheEnabledId = (
					await request(getUrl(vendor, env))
						.post('/flows')
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
						.query({ fields: ['id'] })
						.send({
							...payloadFlowCreate,
							name: 'webhook flow cache disabled',
							options: { ...payloadFlowCreate.options, cacheEnabled: true },
						})
				).body.data.id;

				const flowCacheDisabledId = (
					await request(getUrl(vendor, env))
						.post('/flows')
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
						.query({ fields: ['id'] })
						.send({
							...payloadFlowCreate,
							name: 'webhook flow cache enabled',
							options: { ...payloadFlowCreate.options, cacheEnabled: false },
						})
				).body.data.id;

				await request(getUrl(vendor, env))
					.patch(`/flows/${flowId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.send({ operation: { ...payloadOperationCreate, flow: flowId } });

				await request(getUrl(vendor, env))
					.patch(`/flows/${flowCacheEnabledId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.send({ operation: { ...payloadOperationCreate, flow: flowCacheEnabledId } });

				await request(getUrl(vendor, env))
					.patch(`/flows/${flowCacheDisabledId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.send({ operation: { ...payloadOperationCreate, flow: flowCacheDisabledId } });

				// Action
				const responseDefault = await request(getUrl(vendor, env)).get(`/flows/trigger/${flowId}`);
				const responseCacheEnabled = await request(getUrl(vendor, env)).get(`/flows/trigger/${flowCacheEnabledId}`);
				const responseCacheDisabled = await request(getUrl(vendor, env)).get(`/flows/trigger/${flowCacheDisabledId}`);

				await sleep(100);

				const responseDefault2 = await request(getUrl(vendor, env)).get(`/flows/trigger/${flowId}`);
				const responseCacheEnabled2 = await request(getUrl(vendor, env)).get(`/flows/trigger/${flowCacheEnabledId}`);
				const responseCacheDisabled2 = await request(getUrl(vendor, env)).get(`/flows/trigger/${flowCacheDisabledId}`);

				// Assert
				expect(responseDefault.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));
				expect(responseCacheEnabled.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));
				expect(responseCacheDisabled.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));
				expect(responseDefault2.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));
				expect(responseCacheEnabled.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));
				expect(responseCacheDisabled2.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));

				expect(responseDefault.body).toEqual(responseDefault2.body);
				expect(responseCacheEnabled.body).toEqual(responseCacheEnabled2.body);
				expect(responseCacheDisabled.body).not.toEqual(responseCacheDisabled2.body);
			});
		});

		describe('ignores cacheEnabled for POST', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const env = envs[vendor];

				const payloadFlowCreate = {
					name: 'POST webhook flow',
					icon: 'bolt',
					color: null,
					description: null,
					status: 'active',
					accountability: null,
					trigger: 'webhook',
					options: { method: 'POST' },
				};

				const payloadOperationCreate = {
					position_x: 19,
					position_y: 1,
					name: 'Get epoch milliseconds',
					key: 'op_exev',
					type: 'exec',
					options: { code: 'module.exports = async function() { return { epoch: Date.now() }; }' },
				};

				const flowId = (
					await request(getUrl(vendor, env))
						.post('/flows')
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
						.query({ fields: ['id'] })
						.send(payloadFlowCreate)
				).body.data.id;

				const flowCacheEnabledId = (
					await request(getUrl(vendor, env))
						.post('/flows')
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
						.query({ fields: ['id'] })
						.send({
							...payloadFlowCreate,
							name: 'POST webhook flow cache enabled',
							options: { ...payloadFlowCreate.options, cacheEnabled: false },
						})
				).body.data.id;

				await request(getUrl(vendor, env))
					.patch(`/flows/${flowId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.send({ operation: { ...payloadOperationCreate, flow: flowId } });

				await request(getUrl(vendor, env))
					.patch(`/flows/${flowCacheEnabledId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.send({ operation: { ...payloadOperationCreate, flow: flowCacheEnabledId } });

				await sleep(100);

				// Action
				const responseDefault = await request(getUrl(vendor, env)).post(`/flows/trigger/${flowId}`);
				const responseCacheEnabled = await request(getUrl(vendor, env)).post(`/flows/trigger/${flowCacheEnabledId}`);

				await sleep(100);

				const responseDefault2 = await request(getUrl(vendor, env)).post(`/flows/trigger/${flowId}`);
				const responseCacheEnabled2 = await request(getUrl(vendor, env)).post(`/flows/trigger/${flowCacheEnabledId}`);

				// Assert
				expect(responseDefault.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));
				expect(responseCacheEnabled.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));
				expect(responseDefault2.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));
				expect(responseCacheEnabled2.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));

				expect(responseDefault.body).not.toEqual(responseDefault2.body);
				expect(responseCacheEnabled.body).not.toEqual(responseCacheEnabled2.body);
			});
		});
	});
});
