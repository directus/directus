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

/**
 * The `*:responseTime` checks compare measured latency against a threshold, so a loaded runner
 * legitimately reports `warn`. Only `error` signals an actual failure, so that's all we exclude.
 */
const healthStatus = expect.stringMatching(/^(ok|warn)$/);

const latencyCheck = (componentType: string) => ({
	componentType,
	observedUnit: 'ms',
	observedValue: expect.any(Number),
	threshold: expect.any(Number),
});

const expectedChecks: Record<string, Record<string, unknown>> = {
	'email:connection': { componentType: 'email' },
	[`${dbMapped}:connectionsAvailable`]: { componentType: 'datastore', observedValue: expect.any(Number) },
	[`${dbMapped}:connectionsUsed`]: { componentType: 'datastore', observedValue: expect.any(Number) },
	[`${dbMapped}:responseTime`]: latencyCheck('datastore'),
	'storage:local:responseTime': latencyCheck('objectstore'),
	...(env.REDIS_ENABLED === 'true' ? { 'redis:responseTime': latencyCheck('cache') } : {}),
	...(options.extras?.minio ? { 'storage:minio:responseTime': latencyCheck('objectstore') } : {}),
};

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

		const gqlResult = await userApi.query<{ server_health: Record<string, any> }>(
			`query { server_health }`,
			{},
			'system',
		);

		// `status` must be the only key: the rest of the payload leaks infrastructure details.
		for (const result of [restResult, gqlResult.server_health]) {
			expect(Object.keys(result)).toEqual(['status']);
			expect(result).toEqual({ status: healthStatus });
		}
	});

	test('full health information returned reading as admin', async () => {
		const restResult = await api.request(serverHealth());
		const gqlResult = await api.query<{ server_health: Record<string, any> }>(`query { server_health }`, {}, 'system');

		for (const result of [restResult, gqlResult.server_health] as Record<string, any>[]) {
			expect(result).toEqual({
				checks: expect.any(Object),
				releaseId: expect.any(String),
				serviceId: expect.any(String),
				status: healthStatus,
			});

			expect(Object.keys(result['checks']).sort()).toEqual(Object.keys(expectedChecks).sort());

			for (const [name, expected] of Object.entries(expectedChecks)) {
				// A failing check adds an `output` field and an `error` status, so this reports the cause.
				expect(result['checks'][name], name).toEqual([{ ...expected, status: healthStatus }]);
			}
		}
	});
});
