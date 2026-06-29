import { randomUUID } from 'crypto';
import { createDirectus, createUser, graphql, rest, serverHealth, staticToken } from '@directus/sdk';
import { database, env, options, port } from '@utils/constants.js';
import { describe, expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken('admin'));

const dbMapped = {
	sqlite: 'sqlite3',
	postgres: 'pg',
	maria: 'mysql',
	oracle: 'oracledb',
	cockroachdb: 'cockroachdb',
	mssql: 'mssql',
	mysql: 'mysql',
}[database];

describe('health access', () => {
	test('deny reading health as public user', async () => {
		const userApi = createDirectus(`http://localhost:${port}`).with(rest()).with(graphql());

		// REST
		await expect(userApi.request(serverHealth())).rejects.toThrow("You don't have permission to access this.");

		// GQL
		await expect(() => userApi.query(`query { server_health }`, {}, 'system')).rejects.toThrow(
			"You don't have permission to access this.",
		);
	});

	test('only status returned reading health as non-admin user', async () => {
		const token = randomUUID();

		await api.request(
			createUser({
				first_name: 'Test',
				last_name: 'Permissions',
				email: `${token}@health.com`,
				password: 'password',
				token,
			}),
		);

		const userApi = createDirectus(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken(token));

		const restResult = await userApi.request(serverHealth());
		const gqlResult = await userApi.query(`query { server_health }`, {}, 'system');

		expect(restResult).toEqual({
			status: 'ok',
		});

		expect(gqlResult).toEqual({
			server_health: { status: 'ok' },
		});
	});

	test('full health information returned reading as admin', async () => {
		const result = await api.request(serverHealth());
		const gqlResult = await api.query(`query { server_health }`, {}, 'system');

		expect(result).toEqual({
			checks: {
				'email:connection': [
					{
						componentType: 'email',
						status: 'ok',
					},
				],
				[`${dbMapped}:connectionsAvailable`]: [
					{
						componentType: 'datastore',
						observedValue: expect.any(Number),
						status: 'ok',
					},
				],
				[`${dbMapped}:connectionsUsed`]: [
					{
						componentType: 'datastore',
						observedValue: expect.any(Number),
						status: 'ok',
					},
				],
				[`${dbMapped}:responseTime`]: [
					{
						componentType: 'datastore',
						observedUnit: 'ms',
						observedValue: expect.any(Number),
						status: 'ok',
						threshold: 150,
					},
				],
				'storage:local:responseTime': [
					{
						componentType: 'objectstore',
						observedUnit: 'ms',
						observedValue: expect.any(Number),
						status: 'ok',
						threshold: 750,
					},
				],
				...(env.REDIS_ENABLED === 'true'
					? {
							'redis:responseTime': [
								{
									componentType: 'cache',
									observedUnit: 'ms',
									observedValue: expect.any(Number),
									status: 'ok',
									threshold: 150,
								},
							],
						}
					: {}),
				...(options.extras?.minio
					? {
							'storage:minio:responseTime': [
								{
									componentType: 'objectstore',
									observedUnit: 'ms',
									observedValue: expect.any(Number),
									status: 'ok',
									threshold: 750,
								},
							],
						}
					: {}),
			},
			releaseId: expect.any(String),
			serviceId: expect.any(String),
			status: 'ok',
		});

		expect(gqlResult).toEqual({
			server_health: {
				checks: expect.any(Object),
				releaseId: expect.any(String),
				serviceId: expect.any(String),
				status: 'ok',
			},
		});
	});
});
