import config, { Env, getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import * as common from '@common/index';
import request from 'supertest';
import { awaitDirectusConnection } from '@utils/await-connection';
import { ChildProcess, spawn } from 'child_process';
import knex, { Knex } from 'knex';
import { cloneDeep } from 'lodash';
import { sleep } from '@utils/sleep';

describe('/flows', () => {
	const databases = new Map<string, Knex>();
	const directusInstances = {} as { [vendor: string]: ChildProcess };
	const envs = {} as { [vendor: string]: Env };

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			const env = cloneDeep(config.envs);
			env[vendor].CACHE_ENABLED = 'true';
			env[vendor].CACHE_STORE = 'memory';

			const newServerPort = Number(env[vendor]!.PORT) + 150;
			env[vendor]!.PORT = String(newServerPort);

			const server = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: env[vendor] });

			directusInstances[vendor] = server;
			envs[vendor] = env;

			promises.push(awaitDirectusConnection(newServerPort));
		}

		// Give the server some time to start
		await Promise.all(promises);
	}, 180000);

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			directusInstances[vendor].kill();
			await connection.destroy();
		}
	});

	describe('Webhook Trigger', () => {
		it.each(vendors)('%s', async (vendor) => {
			// Setup
			const env = envs[vendor];

			const payloadFlowCreate = {
				name: 'webhook flow',
				icon: 'bolt',
				color: null,
				description: null,
				status: 'active',
				accountability: 'all',
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
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					.query({ fields: ['id'] })
					.send(payloadFlowCreate)
			).body.data.id;

			const flowCacheDisabledId = (
				await request(getUrl(vendor, env))
					.post('/flows')
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					.query({ fields: ['id'] })
					.send({ ...payloadFlowCreate, name: 'webhook flow cacheEnabled', options: { cacheEnabled: false } })
			).body.data.id;

			await request(getUrl(vendor, env))
				.patch(`/flows/${flowId}`)
				.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
				.send({ operation: { ...payloadOperationCreate, flow: flowId } });

			await request(getUrl(vendor, env))
				.patch(`/flows/${flowCacheDisabledId}`)
				.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
				.send({ operation: { ...payloadOperationCreate, flow: flowCacheDisabledId } });

			// Action
			const response = await request(getUrl(vendor, env)).get(`/flows/trigger/${flowId}`);
			const responseCacheDisabled = await request(getUrl(vendor, env)).get(`/flows/trigger/${flowCacheDisabledId}`);

			await sleep(100);

			const response2 = await request(getUrl(vendor, env)).get(`/flows/trigger/${flowId}`);
			const responseCacheDisabled2 = await request(getUrl(vendor, env)).get(`/flows/trigger/${flowCacheDisabledId}`);

			// Assert
			expect(response.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));
			expect(responseCacheDisabled.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));
			expect(response2.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));
			expect(responseCacheDisabled2.body).toEqual(expect.objectContaining({ epoch: expect.any(Number) }));

			expect(response.body).toEqual(response2.body);
			expect(responseCacheDisabled.body).not.toEqual(responseCacheDisabled2.body);
		});
	});
});
