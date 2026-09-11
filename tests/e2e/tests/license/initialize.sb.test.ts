import { DIRECTUS_CORE_LICENSE, readLicense } from '@directus/license';
import { sandbox, type Sandbox } from '@directus/sandbox';
import { createDirectus, type DirectusClient, rest, type RestClient, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { withDefaultSandboxOptions } from './__fixtures__/sandbox.js';

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
		name: DIRECTUS_CORE_LICENSE.meta.name,
		source: null,
		status: 'active',
		entitlements: DIRECTUS_CORE_LICENSE.entitlements,
	});
});
