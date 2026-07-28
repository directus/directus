import { activateLicense, CORE_LICENSE, readLicense } from '@directus/license';
import { mockClient } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import { createDirectus, type DirectusClient, rest, type RestClient, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createLicense } from './__fixtures__/licenses.js';
import { withDefaultSandboxOptions } from './__fixtures__/sandbox.js';

describe('boot from env LICENSE_KEY', () => {
	const license = createLicense({ meta: { name: 'init-env-key' } });

	let directus: Sandbox;
	let api: DirectusClient<any> & RestClient<any>;

	beforeAll(async () => {
		directus = await sandbox(
			database,
			withDefaultSandboxOptions({
				env: { LICENSE_KEY: license.key },
				hooks: {
					beforeApi: async ({ env }) => {
						await mockClient.registerLicense(env.LICENSE_API_URL!, license);
					},
				},
				extras: { license: true },
			}),
		);

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
	});

	afterAll(async () => {
		await directus?.stop();
	});

	test('env LICENSE_KEY at boot return license active with source=env', async () => {
		const info = await api.request(readLicense());

		expect(info).toMatchObject({
			name: license.meta.name,
			source: 'env',
			status: 'active',
			entitlements: license.entitlements,
		});
	});
});

describe('boot persisted DB key', () => {
	const license = createLicense({ meta: { name: 'init-db-key' } });

	let directus: Sandbox;
	let api: DirectusClient<any> & RestClient<any>;

	beforeAll(async () => {
		directus = await sandbox(
			database,
			withDefaultSandboxOptions({
				hooks: {
					beforeApi: async ({ env }) => {
						await mockClient.registerLicense(env.LICENSE_API_URL!, license);
					},
				},
				extras: { license: true },
			}),
		);

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

		await api.request(activateLicense({ license_key: license.key }));
		await directus.restartApi();

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
	});

	afterAll(async () => {
		await directus?.stop();
	});

	test('persisted DB return license active with source=settings', async () => {
		const info = await api.request(readLicense());

		expect(info).toMatchObject({
			name: license.meta.name,
			source: 'settings',
			status: 'active',
			entitlements: license.entitlements,
		});
	});
});

describe('boot core', () => {
	let directus: Sandbox;
	let api: DirectusClient<any> & RestClient<any>;

	beforeAll(async () => {
		directus = await sandbox(
			database,
			withDefaultSandboxOptions({
				extras: { license: true },
			}),
		);

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
	});

	afterAll(async () => {
		await directus?.stop();
	});

	test('no key or token at boot returns CORE with source=null', async () => {
		const info = await api.request(readLicense());

		expect(info).toMatchObject({
			name: CORE_LICENSE.meta.name,
			source: null,
			status: 'active',
			entitlements: CORE_LICENSE.entitlements,
		});
	});
});
