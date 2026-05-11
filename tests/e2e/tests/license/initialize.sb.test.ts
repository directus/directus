import { randomUUID } from 'crypto';
import { LICENSE_API_VERSION, readLicense } from '@directus/license';
import { createLicense } from '@directus/mock-license-server';
import { type Options, type Sandbox, sandbox } from '@directus/sandbox';
import { createDirectus, type DirectusClient, rest, type RestClient, staticToken } from '@directus/sdk';
import type { DeepPartial } from '@directus/types';
import { database } from '@utils/constants.js';
import { merge } from 'lodash-es';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const devMode = process.env['NODE_ENV'] === 'development';

type License = ReturnType<typeof createLicense>;

async function registerLicense(licensePort: string | number, license: License) {
	await fetch(`http://localhost:${licensePort}/admin/license`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(license),
	});
}

async function mocActivateKey(
	licensePort: string | number,
	body: { license_key: string; project_id: string; public_url: string },
) {
	const res = await fetch(`http://localhost:${licensePort}/api/licenses/activate`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Directus-License-Version': LICENSE_API_VERSION,
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		throw new Error(`Mock activate failed: ${res.status} ${await res.text()}`);
	}
}

function createSandboxOptions(overrides?: DeepPartial<Options>): DeepPartial<Options> {
	return merge(
		{
			dev: devMode,
			watch: devMode,
			prefix: database,
			docker: { keep: devMode },
			extras: { license: true },
			cache: false,
			knex: true,
			env: {
				CACHE_SCHEMA: 'false',
				DB_FILENAME: `directus_test_${randomUUID()}.db`,
			},
		},
		overrides,
	);
}

describe('new env LICENSE_KEY (Case D)', () => {
	const license = createLicense({ meta: { name: 'env-license-key' } });

	let directus: Sandbox;
	let api: DirectusClient<any> & RestClient<any>;

	beforeAll(async () => {
		directus = await sandbox(
			database,
			createSandboxOptions({
				env: { LICENSE_KEY: license.key },
				hooks: {
					beforeApi: async ({ env }) => {
						await registerLicense(env.LICENSE_PORT, license);
					},
				},
			}),
		);

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
	});

	afterAll(async () => {
		await directus?.stop();
	});

	test('loads license from env', async () => {
		const info = await api.request(readLicense());

		expect(info).toEqual({
			entitlements: license.entitlements,
			expires_at: license.meta.expires_at,
			grace_period: license.meta.grace_period,
			name: license.meta.name,
			offline: false,
			source: 'env',
			status: 'active',
			usage: expect.any(Object),
		});
	});
});

describe('env LICENSE_KEY changed (Case B)', () => {
	const port = 56885;
	const license = createLicense({ key: 'D1HH5-N7XMX-V2P45-H457R-2MRT6', meta: { name: 'env-license-key-og' } });
	const changedLicense = createLicense({ meta: { name: 'env-license-key-changed' } });

	const encryptedicenseKey =
		'1||scrypt||16384||8||1||Sh9S/mToJLytYhIgMuShhg==||/3UW2wcm3mCwEe4I||oIzoT+eGrwhZBcj+fjzsA7MtnDeOiW5AwCqddxg=||Ht7L4tOHrGw7pwsCgyz7mw==';

	let directus: Sandbox;
	let api: DirectusClient<any> & RestClient<any>;

	beforeAll(async () => {
		directus = await sandbox(
			database,
			createSandboxOptions({
				port,
				env: {
					LICENSE_KEY: changedLicense.key,
					SECRET: '7f96fdc0-cc0f-4359-b0db-d6d40d6b9982',
				},
				hooks: {
					beforeApi: async ({ env, knex }) => {
						await registerLicense(env.LICENSE_PORT, license);
						await registerLicense(env.LICENSE_PORT, changedLicense);

						const settings = await knex!.select('id', 'project_id').from('directus_settings').limit(1).first();

						// simulate activation of the original license against the mock server
						await mocActivateKey(env.LICENSE_PORT, {
							license_key: license.key,
							project_id: settings.project_id,
							public_url: env.PUBLIC_URL,
						});

						await knex!('directus_settings').update({ license_key: encryptedicenseKey }).where({ id: settings.id });
					},
				},
			}),
		);

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
	});

	afterAll(async () => {
		await directus?.stop();
	});

	test('migrates to new env LICENSE_KEY', async () => {
		const info = await api.request(readLicense());

		expect(info).toEqual({
			entitlements: changedLicense.entitlements,
			expires_at: changedLicense.meta.expires_at,
			grace_period: changedLicense.meta.grace_period,
			name: changedLicense.meta.name,
			offline: false,
			source: 'env',
			status: 'active',
			usage: expect.any(Object),
		});
	});
});

describe.todo('env LICENSE_KEY unchanged refreshes (Case C)');

describe('db license_key (Case G)', () => {
	const license = createLicense({ key: 'DKPB1-FRPVF-WDA27-842N0-VPNW2', meta: { name: 'db-license-key' } });

	const encryptedLicenseKey =
		'1||scrypt||16384||8||1||I7bgUT/x4id6JurTj3pwfw==||5pkD7eleVLHqG3F6||+aKhaR0E5A5I8pmjB+2/FvZwSIlMhQCjVNRVyMk=||u+XCnhjK6bcc5QdvHNubFw==';

	let directus: Sandbox;
	let api: DirectusClient<any> & RestClient<any>;

	beforeAll(async () => {
		directus = await sandbox(
			database,
			createSandboxOptions({
				env: { SECRET: 'b05c5a1d-be33-4dbc-bb79-91c8492a8b00' },
				hooks: {
					beforeApi: async ({ env, knex }) => {
						await registerLicense(env.LICENSE_PORT, license);

						const settings = await knex!.select('id').from('directus_settings').limit(1).first();
						await knex!('directus_settings').update({ license_key: encryptedLicenseKey }).where({ id: settings.id });
					},
				},
			}),
		);

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
	});

	afterAll(async () => {
		await directus?.stop();
	});

	test('loads license from directus_settings', async () => {
		const info = await api.request(readLicense());

		expect(info).toEqual({
			entitlements: license.entitlements,
			expires_at: license.meta.expires_at,
			grace_period: license.meta.grace_period,
			name: license.meta.name,
			offline: false,
			source: 'settings',
			status: 'active',
			usage: expect.any(Object),
		});
	});
});
