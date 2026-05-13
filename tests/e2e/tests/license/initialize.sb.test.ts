import { activateLicense, readLicense } from '@directus/license';
import { createLicense } from '@directus/mock-license-server';
import { type Sandbox, sandbox } from '@directus/sandbox';
import { createDirectus, type DirectusClient, rest, type RestClient, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createSandboxOptions, mocActivateKey, registerLicense } from './shared.js';

describe('env license source', () => {
	describe('Case D — new LICENSE_KEY', () => {
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

		test('activate license', async () => {
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

	describe('Case B — LICENSE_KEY changed', () => {
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

	describe('Case C — LICENSE_KEY unchanged', () => {
		const license = createLicense({ meta: { name: 'env-license-key-unchanged' } });

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

			await directus.restartApi();

			api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
		});

		afterAll(async () => {
			await directus?.stop();
		});

		test('keeps license active via refresh', async () => {
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
});

describe('db license source', () => {
	describe('Case G — license_key only', () => {
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

	describe('Case F — license_key + license_token', () => {
		const license = createLicense({ meta: { name: 'db-license-key-and-token' } });

		let directus: Sandbox;
		let api: DirectusClient<any> & RestClient<any>;

		beforeAll(async () => {
			directus = await sandbox(
				database,
				createSandboxOptions({
					hooks: {
						beforeApi: async ({ env }) => {
							await registerLicense(env.LICENSE_PORT, license);
						},
					},
				}),
			);

			api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

			await api.request(activateLicense({ license_key: license.key }));

			await directus.restartApi();
		});

		afterAll(async () => {
			await directus?.stop();
		});

		test('verifies token and loads license from settings', async () => {
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
});
