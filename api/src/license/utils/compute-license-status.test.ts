import { CORE_LICENSE } from '@directus/license';
import { merge } from 'lodash-es';
import { beforeEach, describe, expect, test, vi } from 'vitest';
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

const now = () => Math.floor(Date.now() / 1000);

beforeEach(() => {
	checkAll.mockReset();
	isInCoreGracePeriod.mockReset();
});

describe('no license (core)', () => {
	test('within core grace period, over limits -> grace', async () => {
		isInCoreGracePeriod.mockResolvedValue(true);
		checkAll.mockResolvedValue(false);

		await expect(computeLicenseStatus(null)).resolves.toBe('grace');
	});

	test('within core grace, within limits -> active', async () => {
		isInCoreGracePeriod.mockResolvedValue(false);
		checkAll.mockResolvedValue(true);

		await expect(computeLicenseStatus(null)).resolves.toBe('active');
	});

	test('outside core grace, within limits -> active', async () => {
		isInCoreGracePeriod.mockResolvedValue(false);
		checkAll.mockResolvedValue(true);

		await expect(computeLicenseStatus(null)).resolves.toBe('active');
	});

	test('outside core grace, over limits -> locked', async () => {
		isInCoreGracePeriod.mockResolvedValue(false);
		checkAll.mockResolvedValue(false);

		await expect(computeLicenseStatus(null)).resolves.toBe('locked');
	});
});

describe('with license', () => {
	test('over limits -> locked (regardless of expiry)', async () => {
		checkAll.mockResolvedValue(false);

		const license = merge({}, CORE_LICENSE, {
			meta: { expires_at: now() + 1000 },
		});

		await expect(computeLicenseStatus(license)).resolves.toBe('locked');
		expect(isInCoreGracePeriod).not.toHaveBeenCalled();
	});

	test('perpetual (expires_at === -1) -> active', async () => {
		checkAll.mockResolvedValue(true);

		const license = merge({}, CORE_LICENSE, {
			meta: { expires_at: -1 },
		});

		await expect(computeLicenseStatus(license)).resolves.toBe('active');
	});

	test('not yet expired -> active', async () => {
		checkAll.mockResolvedValue(true);

		const license = merge({}, CORE_LICENSE, {
			meta: { expires_at: now() + 100 },
		});

		await expect(computeLicenseStatus(license)).resolves.toBe('active');
	});

	test('past expiry but within grace -> grace', async () => {
		checkAll.mockResolvedValue(true);

		const license = merge({}, CORE_LICENSE, {
			meta: { expires_at: now() - 100, grace_period: 200 },
		});

		await expect(computeLicenseStatus(license)).resolves.toBe('grace');
	});

	test('past expiry + grace -> throws', async () => {
		checkAll.mockResolvedValue(true);

		const license = merge({}, CORE_LICENSE, {
			meta: { expires_at: now() - 1000, grace_period: 100 },
		});

		await expect(computeLicenseStatus(license)).rejects.toThrow(/expired beyond grace period/i);
	});

	test('falls back to renews_at when expires_at is null', async () => {
		checkAll.mockResolvedValue(true);

		const license = merge({}, CORE_LICENSE, {
			meta: { expires_at: null, renews_at: now() + 100 },
		});

		await expect(computeLicenseStatus(license)).resolves.toBe('active');
	});

	test('falls back to -1 (perpetual) when both expires_at and renews_at are null', async () => {
		checkAll.mockResolvedValue(true);

		const license = merge({}, CORE_LICENSE, {
			meta: { expires_at: null, renews_at: null },
		});

		await expect(computeLicenseStatus(license)).resolves.toBe('active');
	});
});
