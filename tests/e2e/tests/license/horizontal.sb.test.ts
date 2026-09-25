import { activateLicense, readLicense } from '@directus/license';
import { type Sandbox } from '@directus/sandbox';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { useSandbox } from '@utils/sandbox.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { LICENSE_KEYS } from './__fixtures__/licenses.js';

function clients(directus: Sandbox) {
	return directus.apis.map(({ port }) =>
		createDirectus<any>(`http://localhost:${port}`).with(rest()).with(staticToken('admin')),
	);
}

async function expectLicenseOnEveryInstance(directus: Sandbox, expected: Record<string, unknown>) {
	for (const api of clients(directus)) {
		await expect.poll(() => api.request(readLicense()), { timeout: 5000, interval: 100 }).toMatchObject(expected);
	}
}

describe('boot with a license', () => {
	let directus: Sandbox;

	beforeAll(async () => {
		directus = await useSandbox(database, {
			port: sandboxPort(0),
			instances: '2',
			env: { LICENSE_KEY: LICENSE_KEYS.LIMITED },
			extras: { license: true, redis: true },
		});
	});

	afterAll(async () => {
		await directus?.stop();
	});

	test('every instance receives the same license', async () => {
		await expectLicenseOnEveryInstance(directus, { name: 'LIMITED', source: 'env', status: 'active' });
	});

	test('a restart retains license cross instance', async () => {
		await directus.restartApi();

		await expectLicenseOnEveryInstance(directus, { name: 'LIMITED', source: 'env', status: 'active' });
	});
});

describe('activation post boot', () => {
	let directus: Sandbox;

	beforeAll(async () => {
		directus = await useSandbox(database, {
			port: sandboxPort(1),
			instances: '2',
			extras: { license: true, redis: true },
		});
	});

	afterAll(async () => {
		await directus?.stop();
	});

	test('the license syncs to every other instance, and survives a restart', async () => {
		const [api1, api2] = clients(directus);

		const [before1, before2] = await Promise.all([api1!.request(readLicense()), api2!.request(readLicense())]);

		expect(before1).toEqual(before2);

		await api1!.request(activateLicense({ license_key: LICENSE_KEYS.LIMITED }));

		await expect
			.poll(() => api2!.request(readLicense()), { timeout: 5000, interval: 100 })
			.toMatchObject({ name: 'LIMITED', source: 'settings' });

		const [after1, after2] = await Promise.all([api1!.request(readLicense()), api2!.request(readLicense())]);

		expect(after1).toEqual(after2);
		expect(after1).not.toEqual(before1);

		await directus.restartApi();

		await expectLicenseOnEveryInstance(directus, { name: 'LIMITED', source: 'settings', status: 'active' });
	});
});
