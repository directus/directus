import type { ReadLicenseOutput } from '@directus/license';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test } from 'vitest';
import { useLicenseStore } from './license';

const entitlements: ReadLicenseOutput['entitlements'] = {
	seats: { limit: 10 },
	collections: { limit: 5, addon: 2 },
	flows: { limit: -1 },
	activity_historical_timeframe: { limit: 30 },
	revision_historical_timeframe: { limit: 30 },
	sso_enabled: { default: false },
	offline_enabled: { default: false },
	telemetry_required: { default: true },
	display_powered_by: 'DIRECTUS',
	custom_llms_enabled: { default: false },
	custom_permission_rules_enabled: { default: false },
	production_enabled: { default: true },
	ai_translations_enabled: { default: false },
};

function createLicenseInfo(overrides: Partial<ReadLicenseOutput> = {}): ReadLicenseOutput {
	return {
		status: 'active',
		source: 'settings',
		name: 'Team',
		renews_at: 1_800_000_000,
		offline: false,
		grace_period: 0,
		entitlements,
		usage: {
			seats: 8,
			collections: 7,
			flows: 100,
		},
		...overrides,
	};
}

beforeEach(() => {
	setActivePinia(createPinia());
});

describe('limits', () => {
	test('groups countable entitlement capacity by key', () => {
		const licenseStore = useLicenseStore();
		licenseStore.info = createLicenseInfo();

		expect(licenseStore.limits.seats).toEqual({
			remaining: 2,
			hasRemaining: true,
		});

		expect(licenseStore.limits.collections).toEqual({
			remaining: 0,
			hasRemaining: false,
		});

		expect(licenseStore.limits.flows).toEqual({
			remaining: null,
			hasRemaining: true,
		});
	});

	test('does not treat missing license info as unlimited capacity', () => {
		const licenseStore = useLicenseStore();

		expect(licenseStore.limits.seats).toEqual({
			remaining: null,
			hasRemaining: false,
		});
	});

	test('treats loading license info as available capacity', () => {
		const licenseStore = useLicenseStore();
		licenseStore.loading = true;

		expect(licenseStore.limits.flows).toEqual({
			remaining: null,
			hasRemaining: true,
		});
	});
});
