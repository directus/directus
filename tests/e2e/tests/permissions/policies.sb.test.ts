import { exec } from 'node:child_process';
import { sandbox } from '@directus/sandbox';
import { authentication, createDirectus, readUsers, rest, updateUser } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { expect, test } from 'vitest';

test('long timeouts when editing access policy', async () => {
	const directus = await sandbox(database, {
		env: {
			LOG_LEVEL: 'debug',
			DB_FILENAME: `directus_test_${getUID()}.db`,
			CACHE_STORE: 'memory',
			CACHE_AUTO_PURGE: 'true',
		},
		cache: true,
		extras: {
			redis: true,
		},
	});

	const api = createDirectus<unknown>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(authentication());

	await api.login({
		email: directus.env.ADMIN_EMAIL!,
		password: directus.env.ADMIN_PASSWORD!,
	});

	const result = await execRedis('flushall');

	expect(result[0]).toBe('OK');

	const admin = (await api.request(readUsers({ limit: 1 })))[0]!;

	const policyStart = performance.now();

	await api.request(
		updateUser(admin.id, {
			policies: [
				{
					policy: {
						name: 'Custom Policy',
						admin_access: true,
					},
				},
			],
		}),
	);

	const policy1End = performance.now() - policyStart;

	await execRedis(`eval "for i=1,1000000 do redis.call('set','junk:'..i,'x') end" 0`);

	const policy2Start = performance.now();

	await api.request(
		updateUser(admin.id, {
			policies: [
				{
					policy: {
						name: 'Custom Policy',
						admin_access: true,
					},
				},
			],
		}),
	);

	const policy2End = performance.now() - policy2Start;

	expect(
		Math.abs(policy2End - policy1End),
		`Expected 2nd (${Math.floor(policy2End)}ms) to be close to first (${Math.floor(policy1End)}ms)`,
	).toBeLessThan(1000);

	await directus.stop();
});

function execRedis(command: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		exec(`docker exec sandbox_sqlite_redis-redis-1 redis-cli ${command}`, (error, stdout, stderr) => {
			if (error) {
				reject(error);
				return;
			}

			if (stderr) {
				reject(stderr);
				return;
			}

			resolve(stdout.split('\n'));
		});
	});
}
