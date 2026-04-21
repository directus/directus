import { afterEach, describe, expect, test, vi } from 'vitest';
import { readLicenseGateSnapshot, refreshLicenseGateSnapshot } from './cache-license-gate-snapshot.js';
import { defaultEntitlements } from './defaults.js';
import { getLicenseEntitlements } from './summary.js';

vi.mock('./cache-license-gate-snapshot.js', () => ({
	readLicenseGateSnapshot: vi.fn().mockResolvedValue(undefined),
	refreshLicenseGateSnapshot: vi.fn(),
}));

const mockedReadLicenseGateSnapshot = vi.mocked(readLicenseGateSnapshot);
const mockedRefreshLicenseGateSnapshot = vi.mocked(refreshLicenseGateSnapshot);

afterEach(() => {
	mockedReadLicenseGateSnapshot.mockReset();
	mockedRefreshLicenseGateSnapshot.mockReset();
	mockedReadLicenseGateSnapshot.mockResolvedValue(undefined);
});

describe('getLicenseEntitlements', () => {
	test('resolved numeric gates from payload without merging local defaults back in', async () => {
		mockedRefreshLicenseGateSnapshot.mockResolvedValue({
			durableStatus: 'active',
			terminal: null,
			graceOn: null,
			payloadState: 'valid',
			payload: {
				metadata: {
					status: 'active',
					entitlements: {
						seats: { limit: 20, is_overage_allowed: true },
					},
				},
			},
		} as any);

		await expect(getLicenseEntitlements()).resolves.toMatchObject({
			seats: {
				limit: 20,
				is_overage_allowed: true,
			},
		});
	});

	test('fell back to default entitlements when payload omitted a gate', async () => {
		mockedRefreshLicenseGateSnapshot.mockResolvedValue({
			durableStatus: 'active',
			terminal: null,
			graceOn: null,
			payloadState: 'valid',
			payload: {
				metadata: {
					status: 'active',
					entitlements: {},
				},
			},
		} as any);

		await expect(getLicenseEntitlements()).resolves.toEqual(defaultEntitlements);
	});

	test('preserved boolean gates from payload', async () => {
		mockedRefreshLicenseGateSnapshot.mockResolvedValue({
			durableStatus: 'active',
			terminal: null,
			graceOn: null,
			payloadState: 'valid',
			payload: {
				metadata: {
					status: 'active',
					entitlements: {
						sso_enabled: true,
						custom_policy_rules_enabled: true,
					},
				},
			},
		} as any);

		await expect(getLicenseEntitlements()).resolves.toMatchObject({
			sso_enabled: true,
			custom_policy_rules_enabled: true,
		});
	});

	test('returned grace entitlements during onboarding grace', async () => {
		mockedRefreshLicenseGateSnapshot.mockResolvedValue({
			durableStatus: null,
			terminal: null,
			graceOn: new Date().toISOString(),
			payloadState: 'missing',
			payload: null,
		} as any);

		await expect(getLicenseEntitlements()).resolves.toMatchObject({
			collections: {
				limit: null,
				hard_limit: null,
				is_overage_allowed: true,
			},
			seats: {
				limit: null,
				hard_limit: null,
				is_overage_allowed: true,
			},
			activity_history_days: {
				limit: null,
			},
			revisions_history_days: {
				limit: null,
			},
			sso_enabled: true,
			offline_enabled: true,
			custom_policy_rules_enabled: true,
			scheduled_publishing_enabled: true,
			custom_llm_enabled: true,
			analytics_opt_out_enabled: true,
			hide_directus_branding_enabled: true,
		});
	});

	test('preserved payload entitlements during expiration grace', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-07T12:00:00.000Z'));

		mockedRefreshLicenseGateSnapshot.mockResolvedValue({
			durableStatus: 'active',
			terminal: null,
			graceOn: null,
			payloadState: 'valid',
			payload: {
				exp: Math.floor(Date.parse('2026-04-06T12:00:00.000Z') / 1000),
				metadata: {
					status: 'expired',
					grace_period: 2 * 24 * 60 * 60,
					entitlements: {
						seats: {
							limit: 3,
							hard_limit: 3,
							is_overage_allowed: false,
						},
						sso_enabled: false,
					},
				},
			},
		} as any);

		await expect(getLicenseEntitlements()).resolves.toMatchObject({
			seats: {
				limit: 3,
				hard_limit: 3,
				is_overage_allowed: false,
			},
			sso_enabled: false,
		});

		vi.useRealTimers();
	});
});
