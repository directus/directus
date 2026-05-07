import { type LicenseInfoOutput, readLicense } from '@directus/license';
import { type License as MockLicense } from '@directus/license-mock';
import { sandbox } from '@directus/sandbox';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import type { DeepPartial } from '@directus/types';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { merge } from 'lodash-es';
import { describe, expect, test } from 'vitest';

function createLicenseKey(key: string, overrides?: DeepPartial<MockLicense>): MockLicense {
	const now = Math.floor(Date.now() / 1000);

	return merge(
		{
			key,
			max_projects: 10,
			projects: [],
			addons: [],
			name: `mock-${key}`,
			meta: {
				name: 'TEAM',
				version: '1',
				public_url: 'http://localhost',
				grace_period: 10_000,
				validation_interval: 1000,
				expires_at: now + 100_000,
				offline: false,
			},
			entitlements: {
				collections: { limit: 100 },
				seats: { limit: 100 },
				activity_historical_timeframe: { limit: 2_592_000 },
				revision_historical_timeframe: { limit: 2_582_000 },
				sso_enabled: { default: true },
				offline_enabled: { default: false },
				telemetry_required: { default: false },
				display_powered_by: 'NONE',
				custom_llms_enabled: { default: true },
				custom_permission_rules_enabled: { default: true },
				ai_translations_enabled: { default: true },
				production_enabled: { default: true },
				flows: { limit: 100 },
			},
		},
		overrides,
	);
}

describe('initialization', () => {
	test('Activate LICENSE_KEY (Case D)', async () => {
		const envKey = 'D0000-00000-00000-00000-00001';
		const devMode = process.env['DEV'] === 'true';

		const directus = await sandbox(database, {
			dev: devMode,
			watch: devMode,
			prefix: database,
			env: {
				CACHE_SCHEMA: 'false',
				DB_FILENAME: `directus_test_${getUID()}.db`,
				LICENSE_KEY: envKey,
			},
			docker: {
				keep: devMode,
			},
			extras: {
				license: true,
			},
			cache: false,
			knex: true,
			hooks: {
				beforeApi: async ({ env }) => {
					// create key
					await await fetch(`http://localhost:${env.LICENSE_PORT}/admin/license`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(
							createLicenseKey(envKey, {
								meta: {
									name: 'env-license-key',
								},
							}),
						),
					});
				},
			},
		});

		const api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`)
			.with(rest())
			.with(staticToken('admin'));

		const info: LicenseInfoOutput = await api.request(readLicense());

		// Confirm License Meta
		expect(info.source).toBe('env');
		expect(info.status).toBe('active');
		expect(info.name).toBe('env-license-key');

		// Confirm DB sync
		const settings = await directus.knex!('directus_settings').select('license_key', 'license_token').first();

		expect(settings?.license_key).toBe(envKey);
		expect(settings?.license_token).toBeTruthy();

		await directus.stop();
	});

	test('Activate db license_key (Case G)', async () => {
		const dbKey = 'D0000-00000-00000-00000-00002';
		const devMode = process.env['DEV'] === 'true';

		const directus = await sandbox(database, {
			dev: devMode,
			watch: devMode,
			prefix: database,
			env: {
				CACHE_SCHEMA: 'false',
				DB_FILENAME: `directus_test_${getUID()}.db`,
			},
			docker: {
				keep: devMode,
			},
			extras: {
				license: true,
			},
			cache: false,
			knex: true,
			hooks: {
				beforeApi: async ({ env, knex }) => {
					// create key
					await await fetch(`http://localhost:${env.LICENSE_PORT}/admin/license`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(
							createLicenseKey(dbKey, {
								meta: {
									name: 'db-license-key',
								},
							}),
						),
					});

					// add to db
					await knex!('directus_settings').update({ license_key: dbKey });
				},
			},
		});

		const api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`)
			.with(rest())
			.with(staticToken('admin'));

		const info: LicenseInfoOutput = await api.request(readLicense());

		// Confirm License Meta
		expect(info.source).toBe('settings');
		expect(info.status).toBe('active');
		expect(info.name).toBe('db-license-key');

		await directus.stop();
	});
});
