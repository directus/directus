import { sandbox } from '@directus/sandbox';
import { createDirectus, graphql, rest, serverHealth, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { describe, expect, test } from 'vitest';

describe('health check configuration', () => {
	test('not found when HEALTHCHECK_ENABLED=false', { timeout: 120_000 }, async () => {
		const directus = await sandbox(database, {
			env: {
				HEALTHCHECK_ENABLED: 'false',
				DB_FILENAME: `directus_test_${getUID()}.db`,
			},
		});

		const api = createDirectus(`http://localhost:${directus.apis[0].port}`)
			.with(rest())
			.with(graphql())
			.with(staticToken('admin'));

		// REST
		await expect(() => api.request(serverHealth())).rejects.toThrowError("Route /server/health doesn't exist.");

		// GQL
		await expect(() => api.query(`query { server_health }`, {}, 'system')).rejects.toThrowError();

		await directus.stop();
	});

	test('only includes database checks when HEALTHCHECK_SERVICES=database', { timeout: 120_000 }, async () => {
		const directus = await sandbox(database, {
			env: {
				HEALTHCHECK_SERVICES: 'database',
				HEALTHCHECK_CACHE_TTL: '0',
				DB_FILENAME: `directus_test_${getUID()}.db`,
			},
		});

		const api = createDirectus(`http://localhost:${directus.apis[0].port}`)
			.with(rest())
			.with(graphql())
			.with(staticToken('admin'));

		const restResult = await api.request(serverHealth());
		const gqlResult = await api.query<{ server_health: Record<string, any> }>(`query { server_health }`, {}, 'system');

		for (const result of [restResult, gqlResult.server_health] as Record<string, any>[]) {
			expect(result).toEqual({
				status: expect.stringMatching(/ok|warn/),
				releaseId: expect.any(String),
				serviceId: expect.any(String),
				checks: expect.any(Object),
			});

			const checkKeys = Object.keys(result['checks']);
			expect(checkKeys.length).toBeGreaterThan(0);

			for (const key of checkKeys) {
				expect(key).toMatch(new RegExp(`^${directus.env.DB_CLIENT}:`));
			}
		}

		await directus.stop();
	});

	test('exclude email checks when EMAIL_VERIFY_SETUP=false', { timeout: 120_000 }, async () => {
		const directus = await sandbox(database, {
			env: {
				EMAIL_VERIFY_SETUP: 'false',
				HEALTHCHECK_CACHE_TTL: '0',
				DB_FILENAME: `directus_test_${getUID()}.db`,
			},
		});

		const api = createDirectus(`http://localhost:${directus.apis[0].port}`)
			.with(rest())
			.with(graphql())
			.with(staticToken('admin'));

		const restResult = await api.request(serverHealth());
		const gqlResult = await api.query<{ server_health: Record<string, any> }>(`query { server_health }`, {}, 'system');

		for (const result of [restResult, gqlResult.server_health] as Record<string, any>[]) {
			expect(result['status']).toMatch(/ok|warn/);

			const checkKeys = Object.keys(result['checks']);
			expect(checkKeys.some((key: string) => key.startsWith('email:'))).toBe(false);
		}

		await directus.stop();
	});
});
