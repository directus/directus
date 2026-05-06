// Temporary shim that bypasses real JWT verification when LICENSE_MOCK is set,
// returning a hardcoded License object that matches the @directus/license spec.
//
// Set LICENSE_MOCK to one of: team | team-grace | team-expired | oig
// Any other value falls back to the real verifyLicense().

import { useEnv } from '@directus/env';
import { type License, verifyLicense } from '@directus/license';

const env = useEnv();

type MockScenario = 'team' | 'team-grace' | 'team-expired' | 'oig';

const DAY = 24 * 60 * 60;
const nowSec = () => Math.floor(Date.now() / 1000);

const TEAM_ENTITLEMENTS: License['entitlements'] = {
	seats: { limit: 10 },
	collections: { limit: 50 },
	flows: { limit: 25 },
	activity_historical_timeframe: { limit: 30 * DAY },
	revision_historical_timeframe: { limit: 30 * DAY },
	sso_enabled: { default: true },
	offline_enabled: { default: false },
	telemetry_required: { default: true },
	display_powered_by: 'NONE',
	custom_llms_enabled: { default: true },
	custom_permission_rules_enabled: { default: true },
	production_enabled: { default: true },
	ai_translations_enabled: { default: true },
};

const OIG_ENTITLEMENTS: License['entitlements'] = {
	seats: { limit: 5 },
	collections: { limit: 25 },
	flows: { limit: 10 },
	activity_historical_timeframe: { limit: 7 * DAY },
	revision_historical_timeframe: { limit: 7 * DAY },
	sso_enabled: { default: false },
	offline_enabled: { default: false },
	telemetry_required: { default: true },
	display_powered_by: 'OIG',
	custom_llms_enabled: { default: false },
	custom_permission_rules_enabled: { default: false },
	production_enabled: { default: false },
	ai_translations_enabled: { default: false },
};

function buildMock(scenario: MockScenario): License {
	switch (scenario) {
		case 'team':
			return {
				entitlements: TEAM_ENTITLEMENTS,
				meta: {
					name: 'Team',
					offline: false,
					grace_period: 30 * DAY,
					validation_interval: DAY,
					renews_at: nowSec() + 30 * DAY,
				},
			};
		case 'team-grace':
			return {
				entitlements: TEAM_ENTITLEMENTS,
				meta: {
					name: 'Team',
					offline: false,
					grace_period: 30 * DAY,
					validation_interval: DAY,
					expires_at: nowSec() - 2 * DAY,
				},
			};
		case 'team-expired':
			return {
				entitlements: TEAM_ENTITLEMENTS,
				meta: {
					name: 'Team',
					offline: false,
					grace_period: 30 * DAY,
					validation_interval: DAY,
					expires_at: nowSec() - 60 * DAY,
				},
			};
		case 'oig':
			return {
				entitlements: OIG_ENTITLEMENTS,
				meta: {
					name: 'Open Innovation Grant',
					offline: false,
					grace_period: 30 * DAY,
					validation_interval: DAY,
					renews_at: nowSec() + 90 * DAY,
				},
			};
	}
}

const SCENARIOS: ReadonlySet<string> = new Set(['team', 'team-grace', 'team-expired', 'oig']);

export async function verifyLicenseCompat(token: string): Promise<License> {
	const mock = String(env['LICENSE_MOCK'] ?? '');

	if (SCENARIOS.has(mock)) {
		return buildMock(mock as MockScenario);
	}

	return verifyLicense(token);
}
