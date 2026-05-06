import { activateLicense, readLicense } from '@directus/license';
import type { License } from '@directus/license-mock';
import { sandbox, type Sandbox } from '@directus/sandbox';
import { createDirectus, type DirectusClient, readSettings, rest, type RestClient, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, beforeAll, expect, test } from 'vitest';

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;
let now: number;

beforeAll(async () => {
	const devMode = process.env['DEV'] === 'true';

	directus = await sandbox(database, {
		dev: devMode,
		watch: devMode,
		prefix: database,
		env: {
			CACHE_SCHEMA: 'false',
			DB_FILENAME: `directus_test_${getUID()}.db`,
		},
		docker: {
			keep: devMode,
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

test('activate a license key', async () => {
	const key = 'DX043-MN4TJ-7NSGJ-1K4QF-TMP8W';

	const { project_id } = await api.request(readSettings({ fields: ['project_id'] }));

	const license: License = {
		activated: false,
		key,
		addons: [],
		name: 'test-license',
		project_id,
		token: {
			meta: {
				name: 'TEAM',
				grace_period: 10000,
				validation_interval: 1000,
				expires_at: now + 1000,
				offline: false,
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

	expect(activeLicense).toEqual({});
});
