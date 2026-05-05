import { randomUUID } from 'crypto';
import { activateLicense } from '@directus/license';
import type { License } from '@directus/license-mock';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import { env, port } from '@utils/constants.js';
import { expect, test } from 'vitest';

const api = createDirectus<any>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const now = Math.floor(Date.now() / 1000);

test('activate a license key', async () => {
	const key = 'D0000-00000-00000-00000-00000';

	const license: License = {
		activated: false,
		key,
		addons: [],
		type: 'test-license',
		project_id: randomUUID(),
		token: {
			meta: {
				type: 'TEAM',
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
				custom_policy_rules_enabled: { default: false },
				production_enabled: { default: true },
			},
		},
	};

	await fetch(`http://localhost:${env.LICENSE_PORT}/admin/license`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(license),
	});

	const activeLicense = await api.request(activateLicense(key));

	expect(activeLicense).toEqual({});
});
