import { activateLicense, readLicense } from '@directus/license';
import { mockClient } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import { createDirectus, type DirectusClient, rest, type RestClient, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createLicense } from './__fixtures__/licenses.js';
import { withDefaultSandboxOptions } from './__fixtures__/sandbox.js';

describe('boot with a license', () => {
	const license = createLicense({ meta: { name: 'horizontal-boot' } });

	let directus: Sandbox;
	let api1: DirectusClient<any> & RestClient<any>;
	let api2: DirectusClient<any> & RestClient<any>;

	beforeAll(async () => {
		directus = await sandbox(
			database,
			withDefaultSandboxOptions({
				instances: '2',
				env: { LICENSE_KEY: license.key },
				hooks: {
					async beforeApi({ env }) {
						await mockClient.registerLicense(env.LICENSE_API_URL!, license);
					},
				},
				extras: { license: true, redis: true },
			}),
		);

		api1 = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
		api2 = createDirectus<any>(`http://localhost:${directus.apis[1]!.port}`).with(rest()).with(staticToken('admin'));
	});

	afterAll(async () => {
		await directus?.stop();
	});

	test('every instance receives the same license', async () => {
		await expect
			.poll(() => api1.request(readLicense()), { timeout: 5000, interval: 100 })
			.toMatchObject({ name: license.meta.name, source: 'env', status: 'active' });

		await expect
			.poll(() => api2.request(readLicense()), { timeout: 5000, interval: 100 })
			.toMatchObject({ name: license.meta.name, source: 'env', status: 'active' });
	});

	test('a restart retains license cross instance', async () => {
		await directus.restartApi();

		api1 = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
		api2 = createDirectus<any>(`http://localhost:${directus.apis[1]!.port}`).with(rest()).with(staticToken('admin'));

		await expect
			.poll(() => api1.request(readLicense()), { timeout: 5000, interval: 100 })
			.toMatchObject({ name: license.meta.name, source: 'env', status: 'active' });

		await expect
			.poll(() => api2.request(readLicense()), { timeout: 5000, interval: 100 })
			.toMatchObject({ name: license.meta.name, source: 'env', status: 'active' });
	});
});

describe('activation post boot', () => {
	const license = createLicense({ meta: { name: 'horizontal-test' } });

	let directus: Sandbox;
	let api1: DirectusClient<any> & RestClient<any>;
	let api2: DirectusClient<any> & RestClient<any>;

	beforeAll(async () => {
		directus = await sandbox(
			database,
			withDefaultSandboxOptions({
				instances: '2',
				hooks: {
					async beforeApi({ env }) {
						await mockClient.registerLicense(env.LICENSE_API_URL!, license);
					},
				},
				extras: {
					license: true,
					redis: true,
				},
			}),
		);

		api1 = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
		api2 = createDirectus<any>(`http://localhost:${directus.apis[1]!.port}`).with(rest()).with(staticToken('admin'));
	});

	afterAll(async () => {
		await directus?.stop();
	});

	test('the license syncs to every other instance', async () => {
		const [before1, before2] = await Promise.all([api1.request(readLicense()), api2.request(readLicense())]);

		expect(before1).toEqual(before2);

		await api1.request(activateLicense({ license_key: license.key }));

		await expect
			.poll(() => api2.request(readLicense()), { timeout: 5000, interval: 100 })
			.toMatchObject({ name: license.meta.name, source: 'settings' });

		const [after1, after2] = await Promise.all([api1.request(readLicense()), api2.request(readLicense())]);

		expect(after1).toEqual(after2);
		expect(after1).toMatchObject({ name: license.meta.name, source: 'settings' });
		expect(after1).not.toEqual(before1);
	});
});
