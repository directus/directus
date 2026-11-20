import type { ReadLicenseOutput } from '@directus/license';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, type MockInstance, test, vi } from 'vitest';
import { useLicenseStore } from './license';
import { i18n } from '@/lang';
import sdk from '@/sdk';
import { useCollectionsStore } from '@/stores/collections';
import { useFlowsStore } from '@/stores/flows';
import { useUserStore } from '@/stores/user';
import { localizedFormat } from '@/utils/localized-format';

vi.mock('@/sdk', () => ({ default: { request: vi.fn() } }));

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
		editable: true,
		source: 'settings',
		name: 'Team',
		renews_at: 1_800_000_000,
		offline: false,
		grace_period: 0,
		invalid_reason: null,
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

		expect(licenseStore.formattedGraceDeadline).toBe(
			localizedFormat(deadline, String(i18n.global.t('date-fns_date_short'))),
		);
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

describe('invalid reason', () => {
	test('reports a downgrade reason once running on core', () => {
		const licenseStore = useLicenseStore();

		licenseStore.info = createLicenseInfo({ source: null, invalid_reason: 'expired' });

		expect(licenseStore.downgradeReason).toBe('expired');
		expect(licenseStore.warningReason).toBeNull();
	});

	test('reports a warning reason while the license is still applied', () => {
		const licenseStore = useLicenseStore();

		licenseStore.info = createLicenseInfo({ source: 'settings', invalid_reason: 'binding_mismatch' });

		expect(licenseStore.warningReason).toBe('binding_mismatch');
		expect(licenseStore.downgradeReason).toBeNull();
	});

	test('reports no reason without an invalid reason', () => {
		const licenseStore = useLicenseStore();

		licenseStore.info = createLicenseInfo({ source: null, invalid_reason: null });

		expect(licenseStore.downgradeReason).toBeNull();
		expect(licenseStore.warningReason).toBeNull();
	});
});

describe('tokenExpiresAt', () => {
	test('returns null without a token expiry', () => {
		const licenseStore = useLicenseStore();
		licenseStore.info = createLicenseInfo();
		expect(licenseStore.tokenExpiresAt).toBeNull();
	});

	test('returns the date the token expires', () => {
		const licenseStore = useLicenseStore();
		licenseStore.info = createLicenseInfo({ token_expires_at: FIXED_NOW_SEC });
		expect(licenseStore.tokenExpiresAt).toEqual(new Date(FIXED_NOW_SEC * 1000));
	});
});

describe('licenseWarning', () => {
	beforeEach(() => {
		vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW_SEC * 1000);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('returns null without a token expiry or on core', () => {
		const licenseStore = useLicenseStore();

		licenseStore.info = createLicenseInfo({ invalid_reason: 'binding_mismatch' });
		expect(licenseStore.licenseWarning).toBeNull();

		licenseStore.info = createLicenseInfo({ source: null, invalid_reason: 'expired', token_expires_at: FIXED_NOW_SEC });
		expect(licenseStore.licenseWarning).toBeNull();
	});

	test('falls back to a generic danger warning for other reasons', () => {
		const licenseStore = useLicenseStore();

		licenseStore.info = createLicenseInfo({
			invalid_reason: 'verification',
			token_expires_at: FIXED_NOW_SEC + 2.5 * 86400,
		});

		expect(licenseStore.licenseWarning).toEqual({ reason: 'generic', severity: 'danger', daysRemaining: 3 });
	});

	test('treats an unreachable licensing service as a warning', () => {
		const licenseStore = useLicenseStore();

		licenseStore.info = createLicenseInfo({ invalid_reason: 'unavailable', token_expires_at: FIXED_NOW_SEC + 86400 });

		expect(licenseStore.licenseWarning).toEqual({ reason: 'unavailable', severity: 'warning', daysRemaining: 1 });
	});
});

describe('hasPinnedNotice', () => {
	test('is true for a warning, grace or core grace, unless locked', () => {
		const licenseStore = useLicenseStore();

		licenseStore.info = createLicenseInfo();
		expect(licenseStore.hasPinnedNotice).toBe(false);

		licenseStore.info = createLicenseInfo({ invalid_reason: 'binding_mismatch', token_expires_at: FIXED_NOW_SEC });
		expect(licenseStore.hasPinnedNotice).toBe(true);

		licenseStore.info = createLicenseInfo({ source: null, status: 'grace' });
		expect(licenseStore.hasPinnedNotice).toBe(true);

		licenseStore.info = createLicenseInfo({
			status: 'locked',
			invalid_reason: 'binding_mismatch',
			token_expires_at: FIXED_NOW_SEC,
		});

		expect(licenseStore.hasPinnedNotice).toBe(false);
	});
});

describe('resolved items', () => {
	const AT = '2026-11-20T00:00:00.000Z';

	const output = {
		collections: { limit: 25, usage: 25, candidates: [{ id: 'c1', resolved_at: AT }] },
		flows: { limit: 5, usage: 5, candidates: [{ id: 'f1', name: 'a', resolved_at: AT }] },
		sso_users: {
			entitled: false,
			candidates: [{ id: 's1', first_name: null, last_name: null, avatar: null, email: null, resolved_at: AT }],
		},
	};

	function asAdmin(admin = true) {
		useUserStore().currentUser = { id: 'admin', admin_access: admin } as any;
	}

	let collectionsHydrate: MockInstance;
	let flowsHydrate: MockInstance;

	beforeEach(() => {
		collectionsHydrate = vi.spyOn(useCollectionsStore(), 'hydrate').mockResolvedValue();
		flowsHydrate = vi.spyOn(useFlowsStore(), 'hydrate').mockResolvedValue();
	});

	afterEach(() => {
		vi.mocked(sdk.request).mockReset();
	});

	function requestPaths() {
		return vi.mocked(sdk.request).mock.calls.map(([command]) => (command as any)().path);
	}

	test('hydrateResolvedItems requests GET /license/resolved', async () => {
		asAdmin();
		vi.mocked(sdk.request).mockResolvedValue(output);
		const store = useLicenseStore();

		await store.hydrateResolvedItems();

		expect(requestPaths()).toEqual(['/license/resolved']);
		expect(store.resolvedItems).toEqual(output);
	});

	test('resolvedCount sums all sections', () => {
		const store = useLicenseStore();
		store.resolvedItems = output as any;

		expect(store.resolvedCount).toBe(3);
	});

	test('restore posts the payload and re-hydrates info and resolved items', async () => {
		asAdmin();
		vi.mocked(sdk.request).mockResolvedValue(undefined);
		const store = useLicenseStore();

		await store.restore({ flows: ['f1'] });

		const [restoreCommand] = vi.mocked(sdk.request).mock.calls[0]!;

		expect((restoreCommand as any)()).toMatchObject({
			path: '/license/restore',
			method: 'POST',
			body: JSON.stringify({ flows: ['f1'] }),
		});

		expect(requestPaths()).toContain('/license/resolved');
		expect(requestPaths()).toContain('/license');
	});

	test('restore returns the restored ids', async () => {
		asAdmin();
		vi.mocked(sdk.request).mockResolvedValueOnce({ flows: ['f1'] });

		await expect(useLicenseStore().restore({ flows: ['f1'] })).resolves.toEqual({ flows: ['f1'] });
	});

	test('restore re-hydrates the collections and flows stores when they were restored', async () => {
		asAdmin();
		vi.mocked(sdk.request).mockResolvedValueOnce({ collections: ['c1'], flows: ['f1'] });

		await useLicenseStore().restore({ collections: ['c1'], flows: ['f1'] });

		expect(collectionsHydrate).toHaveBeenCalledOnce();
		expect(flowsHydrate).toHaveBeenCalledOnce();
	});

	test('restore skips the collections and flows stores when only users were restored', async () => {
		asAdmin();
		vi.mocked(sdk.request).mockResolvedValueOnce({ seats: ['u1'] });

		await useLicenseStore().restore({ seats: ['u1'] });

		expect(collectionsHydrate).not.toHaveBeenCalled();
		expect(flowsHydrate).not.toHaveBeenCalled();
	});

	test('resolve re-hydrates resolved items', async () => {
		asAdmin();
		vi.mocked(sdk.request).mockResolvedValue(undefined);

		await useLicenseStore().resolve({ flows: ['f1'] });

		expect(requestPaths()).toContain('/license/resolved');
	});

	test('non-admins skip hydrateResolvedItems', async () => {
		asAdmin(false);

		await useLicenseStore().hydrateResolvedItems();

		expect(sdk.request).not.toHaveBeenCalled();
	});
});
