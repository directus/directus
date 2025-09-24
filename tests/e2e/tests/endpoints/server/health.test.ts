import { createDirectus, createUser, rest, serverHealth, staticToken } from '@directus/sdk';
import { expect, test } from 'vitest';
import { useOptions } from '@utils/useOptions.js';
import { useEnv } from '@utils/useEnv.js';
import { randomUUID } from 'crypto';
import { database, port } from '@utils/constants.js';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const options = useOptions();
const env = useEnv();

const dbMapped = {
	sqlite: 'sqlite3',
	postgres: 'pg',
	maria: 'mysql',
	oracle: 'oracledb',
	cockroachdb: 'cockroachdb',
	mssql: 'mssql',
	mysql: 'mysql',
}[database];

test('reading health as admin', async () => {
	const result = await api.request(serverHealth());

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
		serviceId: env.PUBLIC_URL,
		status: 'ok',
	});
});

test('reading health as user', async () => {
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

	const userApi = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken(token));

	const result = await userApi.request(serverHealth());

	expect(result).toEqual({
		status: 'ok',
	});
});

test('reading health public', async () => {
	const userApi = createDirectus(`http://localhost:${port}`).with(rest());

	const result = await userApi.request(serverHealth());

	expect(result).toEqual({
		status: 'ok',
	});
});
