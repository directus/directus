import {
	activateLicense,
	CORE_LICENSE,
	deactivateLicense,
	type LicenseInfoOutput,
	readLicense,
	updateLicense,
} from '@directus/license';
import { createLicense } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import { createDirectus, type DirectusClient, rest, type RestClient, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, beforeAll, expect, test } from 'vitest';

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;

const license = createLicense({ meta: { name: 'og-license' } });
const otherLicense = createLicense({ meta: { name: 'changed-license' } });

beforeAll(async () => {
	const devMode = process.env['NODE_ENV'] === 'development';

	directus = await sandbox(database, {
		dev: devMode,
		watch: devMode,
		prefix: database,
		env: {
			CACHE_SCHEMA: 'false',
			DB_FILENAME: `directus_test_${getUID()}.db`,
		},
		extras: {
			license: true,
		},
		cache: false,
	});

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

	await fetch(`http://localhost:${directus.env.LICENSE_PORT}/admin/license`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(license),
	});

	await fetch(`http://localhost:${directus.env.LICENSE_PORT}/admin/license`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(otherLicense),
	});
});

afterAll(async () => {
	await directus.stop();
});

test('activate a license key', async () => {
	await api.request(activateLicense({ license_key: license.key }));

	const licenseInfo: LicenseInfoOutput = await api.request(readLicense());

	expect(licenseInfo.name).toEqual(license.meta.name);
	expect(licenseInfo.entitlements).toEqual(license.entitlements);
});

test('prevent activating key on project with existing license', async () => {
	await expect(api.request(activateLicense({ license_key: license.key }))).rejects.toThrowError(
		'A license was already activated',
	);
});

test('reading a license', async () => {
	const activeLicense = await api.request(readLicense());

	expect(activeLicense).toEqual({
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

test('updating the license', async () => {
	await api.request(updateLicense({ license_key: otherLicense.key }));

	const licenseInfo: LicenseInfoOutput = await api.request(readLicense());

	expect(licenseInfo.name).toEqual(otherLicense.meta.name);
	expect(licenseInfo.entitlements).toEqual(otherLicense.entitlements);
});

test('reading the other license', async () => {
	const activeLicense = await api.request(readLicense());

	expect(activeLicense).toEqual({
		entitlements: otherLicense.entitlements,
		expires_at: otherLicense.meta.expires_at,
		grace_period: otherLicense.meta.grace_period,
		name: otherLicense.meta.name,
		offline: false,
		source: 'settings',
		status: 'active',
		usage: expect.any(Object),
	});
});

test('deactivate the license', async () => {
	await api.request(deactivateLicense());

	const activeLicense = await api.request(readLicense());

	expect(activeLicense).toEqual({
		entitlements: CORE_LICENSE.entitlements,
		expires_at: CORE_LICENSE.meta.expires_at,
		grace_period: CORE_LICENSE.meta.grace_period,
		name: CORE_LICENSE.meta.name,
		offline: false,
		source: 'settings',
		status: 'active',
		usage: expect.any(Object),
	});
});
