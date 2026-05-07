import { activateLicense, readLicense } from '@directus/license';
import type { License } from '@directus/license-mock';
import { sandbox, type Sandbox } from '@directus/sandbox';
import { createDirectus, type DirectusClient, rest, type RestClient, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, beforeAll, expect, test } from 'vitest';

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;
let now: number;

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
	now = Math.floor(Date.now() / 1000);
});

afterAll(async () => {
	await directus.stop();
});

const key = 'DX043-MN4TJ-7NSGJ-1K4QF-TMP8W';

test('activate a license key', async () => {
	const license: License = {
		projects: [],
		max_projects: 2,
		key,
		addons: [],
		name: 'test-license',
		meta: {
			name: 'TEAM',
			grace_period: 10000,
			validation_interval: 1000,
			expires_at: now + 1000,
			offline: false,
			version: '1.0',
			public_url: 'heh?',
		},
		entitlements: {
			collections: { limit: 10 },
			seats: { limit: 10 },
			activity_historical_timeframe: {
				limit: 2592000,
				overage: 0,
				addon: 2292000,
			},
			revision_historical_timeframe: { limit: 2582000 },
			sso_enabled: { default: true },
			offline_enabled: { default: false },
			telemetry_required: { default: true },
			display_powered_by: 'NONE',
			custom_llms_enabled: { default: false, override: true },
			custom_permission_rules_enabled: { default: false },
			ai_translations_enabled: { default: false },
			production_enabled: { default: true },
			flows: { limit: 10 },
		},
	};

	await fetch(`http://localhost:${directus.env.LICENSE_PORT}/admin/license`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(license),
	});

	let activeLicense = await api.request(activateLicense({ license_key: key }));

	expect(activeLicense).toEqual(null);

	activeLicense = await api.request(readLicense());

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

test('prevent activating key on project with existing license', async () => {
	await expect(api.request(activateLicense({ license_key: key }))).rejects.toThrowError();
});
