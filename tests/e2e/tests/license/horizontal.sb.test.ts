import { activateLicense, readLicense } from '@directus/license';
import { createLicense, mockClient } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import { createDirectus, type DirectusClient, rest, type RestClient, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, beforeAll, expect, test } from 'vitest';

let directus: Sandbox;
let api1: DirectusClient<any> & RestClient<any>;
let api2: DirectusClient<any> & RestClient<any>;

const license = createLicense({ meta: { name: 'og-license' } });

beforeAll(async () => {
	const devMode = process.env['NODE_ENV'] === 'development';

	directus = await sandbox(database, {
		dev: devMode,
		watch: devMode,
		prefix: database,
		instances: '2',
		env: {
			CACHE_SCHEMA: 'false',
			DB_FILENAME: `directus_test_${getUID()}.db`,
		},
		hooks: {
			async beforeApi({ env }) {
				await mockClient.registerLicense(env.LICENSE_API_URL!, license);
			},
		},
		extras: {
			license: true,
			redis: true,
		},
		cache: false,
	});

	api1 = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
	api2 = createDirectus<any>(`http://localhost:${directus.apis[1]!.port}`).with(rest()).with(staticToken('admin'));
});

afterAll(async () => {
	await directus?.stop();
});

test('license key being synced on both instances', async () => {
	let license1 = await api1.request(readLicense());
	let license2 = await api2.request(readLicense());

	expect(license1).toEqual(license2);

	await api1.request(activateLicense({ license_key: license.key }));

	// wait for rpc to complete
	await new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve();
		}, 3000);
	});

	license1 = await api1.request(readLicense());
	license2 = await api2.request(readLicense());

	expect(license1).toEqual(license2);
});
