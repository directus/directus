import { CORE_LICENSE } from '@directus/license';
import { merge } from 'lodash-es';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { computeLicenseStatus } from './compute-license-status.js';

const checkAll = vi.fn<() => Promise<boolean>>();
const isInCoreGracePeriod = vi.fn<() => Promise<boolean>>();

vi.mock('../index.js', () => ({
	getEntitlementManager: () => ({
		fork: () => ({ checkAll }),
	}),
}));

vi.mock('./is-in-core-grace-period.js', () => ({
	isInCoreGracePeriod: () => isInCoreGracePeriod(),
}));

const FIXED_NOW_MS = 1_735_689_600_000; // 2025-01-01T00:00:00Z
const FIXED_NOW_SEC = FIXED_NOW_MS / 1000;

beforeEach(() => {
	vi.useFakeTimers({ now: FIXED_NOW_MS });
	checkAll.mockReset();
	isInCoreGracePeriod.mockReset();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('no license (core install)', () => {
	test('within core grace and over limits returns grace', async () => {
		isInCoreGracePeriod.mockResolvedValue(true);
		checkAll.mockResolvedValue(false);

		await expect(computeLicenseStatus(null)).resolves.toBe('grace');
	});

	test('within core grace and within limits returns active', async () => {
		isInCoreGracePeriod.mockResolvedValue(true);
		checkAll.mockResolvedValue(true);

		await expect(computeLicenseStatus(null)).resolves.toBe('active');
	});

	test('outside core grace and within limits returns active', async () => {
		isInCoreGracePeriod.mockResolvedValue(false);
		checkAll.mockResolvedValue(true);

		await expect(computeLicenseStatus(null)).resolves.toBe('active');
	});

	test('outside core grace and over limits returns locked', async () => {
		isInCoreGracePeriod.mockResolvedValue(false);
		checkAll.mockResolvedValue(false);

		await expect(computeLicenseStatus(null)).resolves.toBe('locked');
	});
});

describe('with license', () => {
	test('over limits returns locked irrespective of expiry', async () => {
		checkAll.mockResolvedValue(false);
		const license = merge({}, CORE_LICENSE, { meta: { expires_at: FIXED_NOW_SEC + 1000 } });

		await expect(computeLicenseStatus(license)).resolves.toBe('locked');
		expect(isInCoreGracePeriod).not.toHaveBeenCalled();
	});

	test('perpetual (expires_at = -1): returns active', async () => {
		checkAll.mockResolvedValue(true);
		const license = merge({}, CORE_LICENSE, { meta: { expires_at: -1 } });

		await expect(computeLicenseStatus(license)).resolves.toBe('active');
	});

	test('not yet expired returns active', async () => {
		checkAll.mockResolvedValue(true);
		const license = merge({}, CORE_LICENSE, { meta: { expires_at: FIXED_NOW_SEC + 100 } });

		await expect(computeLicenseStatus(license)).resolves.toBe('active');
	});

	test('past expiry but within grace_period returns grace', async () => {
		checkAll.mockResolvedValue(true);

		const license = merge({}, CORE_LICENSE, {
			meta: { expires_at: FIXED_NOW_SEC - 100, grace_period: 200 },
		});

		await expect(computeLicenseStatus(license)).resolves.toBe('grace');
	});

	test('past expiry and grace_period throws', async () => {
		checkAll.mockResolvedValue(true);

		const license = merge({}, CORE_LICENSE, {
			meta: { expires_at: FIXED_NOW_SEC - 1000, grace_period: 100 },
		});

		await expect(computeLicenseStatus(license)).rejects.toThrow(/expired beyond grace period/i);
	});

	test('expires_at:null but renews_at defined returns active', async () => {
		checkAll.mockResolvedValue(true);

		const license = merge({}, CORE_LICENSE, {
			meta: { expires_at: null, renews_at: FIXED_NOW_SEC + 100 },
		});

		await expect(computeLicenseStatus(license)).resolves.toBe('active');
	});

	test('expires_at and renews_at both null returns active', async () => {
		checkAll.mockResolvedValue(true);
		const license = merge({}, CORE_LICENSE, { meta: { expires_at: null, renews_at: null } });

		await expect(computeLicenseStatus(license)).resolves.toBe('active');
	});
});
