import { Directus, DIRECTUS_CORE_LICENSE, type LicenseStatus } from '@directus/license';
import type { DeepPartial } from '@directus/types';
import { merge } from 'lodash-es';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { computeLicenseStatus } from './compute-license-status.js';

const checkAll = vi.fn<() => Promise<boolean>>();
const fork = vi.fn((_entitlements: Directus.Entitlements | null) => ({ checkAll }));
const isInCoreGracePeriod = vi.fn<() => Promise<boolean>>();

vi.mock('../index.js', () => ({
	getEntitlementManager: () => ({ fork }),
}));

vi.mock('./is-in-core-grace-period.js', () => ({
	isInCoreGracePeriod: () => isInCoreGracePeriod(),
}));

const FIXED_NOW_MS = 1_735_689_600_000; // 2025-01-01T00:00:00Z
const NOW = FIXED_NOW_MS / 1000;

beforeEach(() => {
	vi.useFakeTimers({ now: FIXED_NOW_MS });
	checkAll.mockReset();
	fork.mockClear();
	isInCoreGracePeriod.mockReset();
});

afterEach(() => {
	vi.useRealTimers();
});

function createLicense(overrides: DeepPartial<Directus.License>) {
	return merge({}, DIRECTUS_CORE_LICENSE, overrides);
}

describe('core', () => {
	test('limits are checked against core entitlements', async () => {
		await computeLicenseStatus(null);

		expect(fork).toHaveBeenCalledWith(null);
	});

	test.each<[string, [boolean, boolean], string]>([
		['over limits within the core grace period returns grace', [false, true], 'grace'],
		['over limits outside the core grace period returns locked', [false, false], 'locked'],
		['within limits returns active within grace period returns active', [true, true], 'active'],
		['within limits returns active outside grace period returns active', [true, false], 'active'],
	])('%s', async (_, [withinLimit, inCoreGrace], result) => {
		checkAll.mockResolvedValue(withinLimit);
		isInCoreGracePeriod.mockResolvedValue(inCoreGrace);

		await expect(computeLicenseStatus(null)).resolves.toBe(result);
	});
});

describe('with license', () => {
	test('limits are checked against the license entitlements', async () => {
		const license = createLicense({
			entitlements: {
				seats: {
					limit: 10,
				},
			},
		});

		await computeLicenseStatus(license);

		expect(fork).toHaveBeenCalledWith(license.entitlements);
	});

	test('over limits returns locked irrespective of expiry', async () => {
		checkAll.mockResolvedValue(false);

		await expect(computeLicenseStatus(createLicense({ meta: { expires_at: NOW + 1000 } }))).resolves.toBe('locked');

		// The core grace period is for unlicensed installs only
		expect(isInCoreGracePeriod).not.toHaveBeenCalled();
	});

	test.each<[string, DeepPartial<Directus.License['meta']>, LicenseStatus | null]>([
		['perpetual expiry returns active', { expires_at: -1, grace_period: 200 }, 'active'],
		['no expiry and no renewal returns active', { expires_at: null, renews_at: null, grace_period: 200 }, 'active'],
		['second before expiry returns active', { expires_at: NOW + 1, grace_period: 200 }, 'active'],
		[
			'falls back to renews_at when expires_at:null',
			{ expires_at: null, renews_at: NOW + 1, grace_period: 200 },
			'active',
		],
		[
			'expires_at wins over a later renews_at',
			{ expires_at: NOW - 1, renews_at: NOW + 10_000, grace_period: 200 },
			'grace',
		],
		['at expiry but before grace returns grace', { expires_at: NOW, grace_period: 200 }, 'grace'],
		['second before end of grace returns grace', { expires_at: NOW - 199, grace_period: 200 }, 'grace'],
		['perpetual grace returns grace after expiry', { expires_at: NOW - 1, grace_period: -1 }, 'grace'],
		['renews_at past grace returns null', { expires_at: null, renews_at: NOW - 1000, grace_period: 100 }, null],
		['second after grace returns null', { expires_at: NOW - 200, grace_period: 200 }, null],
		['no grace at all returns null', { expires_at: NOW - 1, grace_period: 0 }, null],
	])('%s', async (_, meta, expected) => {
		checkAll.mockResolvedValue(true);
		await expect(computeLicenseStatus(createLicense({ meta }))).resolves.toBe(expected);
	});
});
