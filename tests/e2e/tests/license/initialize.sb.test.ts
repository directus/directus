import { type LicenseInfoOutput, readLicense } from '@directus/license';
import { type License as MockLicense } from '@directus/license-mock';
import { sandbox } from '@directus/sandbox';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { describe, expect, test } from 'vitest';
import { createLicense } from '../../../license-mock/dist/index.js';

describe('initialization', () => {
	test('Activate LICENSE_KEY (Case D)', async () => {
		const license = createLicense({ meta: { name: 'env-license-key' } });
		const devMode = process.env['NODE_ENV'] === 'development';

		const directus = await sandbox(database, {
			dev: devMode,
			watch: devMode,
			prefix: database,
			env: {
				CACHE_SCHEMA: 'false',
				DB_FILENAME: `directus_test_${getUID()}.db`,
				LICENSE_KEY: license.key,
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
						body: JSON.stringify(license),
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

		expect(settings?.license_key).toBe(license.key);
		expect(settings?.license_token).toBeTruthy();

		await directus.stop();
	});

	test('Activate db license_key (Case G)', async () => {
		const license = createLicense({ meta: { name: 'db-license-key' } });
		const devMode = process.env['NODE_ENV'] === 'development';

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
						body: JSON.stringify(license),
					});

					// add to db
					await knex!('directus_settings').update({ license_key: license.key });
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
