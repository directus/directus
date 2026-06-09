import type { ReadLicenseOutput } from '@directus/license';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
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

// Unix timestamp used as a fixed "now" across grace period tests (2025-01-01T00:00:00Z)
const FIXED_NOW_SEC = 1_735_689_600;

beforeEach(() => {
	setActivePinia(createPinia());
});

describe('graceDeadline', () => {
	test('returns null when status is not grace', () => {
		const licenseStore = useLicenseStore();
		licenseStore.info = createLicenseInfo({ status: 'active', expires_at: FIXED_NOW_SEC, grace_period: 86400 });
		expect(licenseStore.graceDeadline).toBeNull();
	});

	test('returns null when grace_period is falsy', () => {
		const licenseStore = useLicenseStore();
		licenseStore.info = createLicenseInfo({ status: 'grace', expires_at: FIXED_NOW_SEC, grace_period: 0, name: 'Pro' });
		expect(licenseStore.graceDeadline).toBeNull();
	});

	test('returns null for team plan with renews_at set', () => {
		const licenseStore = useLicenseStore();

		licenseStore.info = createLicenseInfo({
			status: 'grace',
			name: 'Team',
			expires_at: FIXED_NOW_SEC,
			grace_period: 86400,
			renews_at: FIXED_NOW_SEC + 86400,
		});

		expect(licenseStore.graceDeadline).toBeNull();
	});

	test('returns deadline date for non-team plan in grace', () => {
		const licenseStore = useLicenseStore();

		licenseStore.info = createLicenseInfo({
			status: 'grace',
			name: 'Pro',
			expires_at: FIXED_NOW_SEC,
			grace_period: 86400,
			renews_at: undefined,
		});

		expect(licenseStore.graceDeadline).toEqual(new Date((FIXED_NOW_SEC + 86400) * 1000));
	});

	test('returns deadline for team plan without renews_at', () => {
		const licenseStore = useLicenseStore();

		licenseStore.info = createLicenseInfo({
			status: 'grace',
			name: 'Team',
			expires_at: FIXED_NOW_SEC,
			grace_period: 86400,
			renews_at: undefined,
		});

		expect(licenseStore.graceDeadline).toEqual(new Date((FIXED_NOW_SEC + 86400) * 1000));
	});
});

describe('formattedGraceDeadline', () => {
	test('returns empty string when graceDeadline is null', () => {
		const licenseStore = useLicenseStore();
		licenseStore.info = createLicenseInfo({ status: 'active' });
		expect(licenseStore.formattedGraceDeadline).toBe('');
	});

	test('returns a formatted date string when graceDeadline is set', () => {
		const licenseStore = useLicenseStore();
		const deadline = new Date((FIXED_NOW_SEC + 86400) * 1000);

		licenseStore.info = createLicenseInfo({
			status: 'grace',
			name: 'Pro',
			expires_at: FIXED_NOW_SEC,
			grace_period: 86400,
			renews_at: undefined,
		});

		expect(licenseStore.formattedGraceDeadline).toBe(Intl.DateTimeFormat().format(deadline));
	});
});

describe('gracePeriodDaysRemaining', () => {
	beforeEach(() => {
		vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW_SEC * 1000);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('returns null when graceDeadline is null', () => {
		const licenseStore = useLicenseStore();
		licenseStore.info = createLicenseInfo({ status: 'active' });
		expect(licenseStore.gracePeriodDaysRemaining).toBeNull();
	});

	test('returns days remaining until deadline', () => {
		const licenseStore = useLicenseStore();

		licenseStore.info = createLicenseInfo({
			status: 'grace',
			name: 'Pro',
			expires_at: FIXED_NOW_SEC,
			grace_period: 3 * 86400,
			renews_at: undefined,
		});

		expect(licenseStore.gracePeriodDaysRemaining).toBe(3);
	});

	test('returns 0 when deadline has passed', () => {
		const licenseStore = useLicenseStore();

		licenseStore.info = createLicenseInfo({
			status: 'grace',
			name: 'Pro',
			expires_at: FIXED_NOW_SEC - 10 * 86400,
			grace_period: 5 * 86400,
			renews_at: undefined,
		});

		expect(licenseStore.gracePeriodDaysRemaining).toBe(0);
	});
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

describe('history timeframes', () => {
	test('returns a formatted timeframe for a positive limit', () => {
		const licenseStore = useLicenseStore();
		licenseStore.info = createLicenseInfo();

		expect(licenseStore.revisionHistoryTimeframe).not.toBeNull();
		expect(licenseStore.activityHistoryTimeframe).not.toBeNull();
	});

	test('returns null when the limit is -1 (unlimited)', () => {
		const licenseStore = useLicenseStore();

		licenseStore.info = createLicenseInfo({
			entitlements: {
				...entitlements,
				revision_historical_timeframe: { limit: -1 },
				activity_historical_timeframe: { limit: -1 },
			},
		});

		expect(licenseStore.revisionHistoryTimeframe).toBeNull();
		expect(licenseStore.activityHistoryTimeframe).toBeNull();
	});

	test('returns null when the entitlement is missing', () => {
		const licenseStore = useLicenseStore();

		const { revision_historical_timeframe: _r, activity_historical_timeframe: _a, ...rest } = entitlements;

		licenseStore.info = createLicenseInfo({ entitlements: rest as typeof entitlements });

		expect(licenseStore.revisionHistoryTimeframe).toBeNull();
		expect(licenseStore.activityHistoryTimeframe).toBeNull();
	});
});
