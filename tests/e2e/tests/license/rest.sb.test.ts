import { activateLicense, readLicense, updateLicense } from '@directus/license';
import { createLicense } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import { createDirectus, type DirectusClient, rest, type RestClient, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, beforeAll, expect, test } from 'vitest';

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;
const now = Math.floor(Date.now() / 1000);

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
});

afterAll(async () => {
	await directus.stop();
});

const license = createLicense();
const otherLicense = createLicense();

test('activate a license key', async () => {
	await fetch(`http://localhost:${directus.env.LICENSE_PORT}/admin/license`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(license),
	});

	const activeLicense = await api.request(activateLicense({ license_key: license.key }));

	expect(activeLicense).toEqual(null);
});

test('prevent activating key on project with existing license', async () => {
	await expect(api.request(activateLicense({ license_key: license.key }))).rejects.toThrowError();
});

test('reading a license', async () => {
	const activeLicense = await api.request(readLicense());

	expect(activeLicense).toEqual({
		entitlements: license.entitlements,
		expires_at: now + 1000,
		grace_period: 10000,
		name: 'TEAM',
		offline: false,
		source: 'settings',
		status: 'active',
		usage: {
			collections: 0,
			flows: 0,
			seats: 1,
		},
	});
});

test('updating the license', async () => {
	const activeLicense = await api.request(updateLicense({ license_key: otherLicense.key }));
	expect(activeLicense).toEqual({});
});
