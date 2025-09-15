import { createDirectus, rest, serverHealth, staticToken } from '@directus/sdk';
import { expect, test } from 'vitest';
import { useOptions } from '../../../utils/useOptions';
import { useEnv } from '../../../utils/useEnv';

const api = createDirectus(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const options = useOptions();
const env = useEnv();

const db = process.env['DATABASE']!;
const dbMapped = { sqlite: 'sqlite3', postgres: 'pg', maria: 'mysql', oracle: 'oracledb' }[db] ?? db;

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
