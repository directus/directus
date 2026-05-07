import { randomUUID } from 'crypto';
import { type LicenseInfoOutput, readLicense } from '@directus/license';
import { sandbox } from '@directus/sandbox';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { describe, expect } from 'vitest';
import { createLicense } from '../../../mock-license-server/dist/index.js';

describe('env LICENSE_KEY (Case D)', async () => {
	const license = createLicense({ meta: { name: 'env-license-key' } });
	const devMode = process.env['NODE_ENV'] === 'development';

	const directus = await sandbox(database, {
		dev: devMode,
		watch: devMode,
		prefix: database,
		env: {
			CACHE_SCHEMA: 'false',
			DB_FILENAME: `directus_test_${randomUUID()}.db`,
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
				// create key now that the license server is up
				await fetch(`http://localhost:${env.LICENSE_PORT}/admin/license`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(license),
				});
			},
		},
	});

	const api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

	const info: LicenseInfoOutput = await api.request(readLicense());

	// Confirm License Meta
	expect(info.source).toBe('env');
	expect(info.status).toBe('active');
	expect(info.name).toBe('env-license-key');

	// Confirm DB sync
	const settings = await directus.knex!('directus_settings').select('license_key', 'license_token').first();

	expect(settings?.license_key).toBeTruthy();
	expect(settings?.license_token).toBeTruthy();

	await directus.stop();
});

describe('db license_key (Case G)', async () => {
	const license = createLicense({ key: 'DKPB1-FRPVF-WDA27-842N0-VPNW2', meta: { name: 'db-license-key' } });

	const encryptedLicenseKey =
		'1||scrypt||16384||8||1||I7bgUT/x4id6JurTj3pwfw==||5pkD7eleVLHqG3F6||+aKhaR0E5A5I8pmjB+2/FvZwSIlMhQCjVNRVyMk=||u+XCnhjK6bcc5QdvHNubFw==';

	const devMode = process.env['NODE_ENV'] === 'development';

	const directus = await sandbox(database, {
		dev: devMode,
		watch: devMode,
		prefix: database,
		env: {
			CACHE_SCHEMA: 'false',
			SECRET: 'b05c5a1d-be33-4dbc-bb79-91c8492a8b00',
			DB_FILENAME: `directus_test_${randomUUID()}.db`,
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
				// create key now that the license server is up
				await fetch(`http://localhost:${env.LICENSE_PORT}/admin/license`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(license),
				});

				const settings = await knex!.select('id').from('directus_settings').limit(1).first();
				await knex?.('directus_settings').update({ license_key: encryptedLicenseKey }).where({ id: settings.id });
			},
		},
	});

	const api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

	const info: LicenseInfoOutput = await api.request(readLicense());

	// Confirm License Meta
	expect(info.source).toBe('settings');
	expect(info.status).toBe('active');
	expect(info.name).toBe('db-license-key');

	await directus.stop();
});
