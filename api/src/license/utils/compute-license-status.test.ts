import { CORE_LICENSE, type License } from '@directus/license';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { EntitlementManager } from '../entitlements/manager.js';
import { computeLicenseStatus } from './compute-license-status.js';
import { isInCoreGracePeriod } from './is-in-core-grace-period.js';

vi.mock('./is-in-core-grace-period.js', () => ({
	isInCoreGracePeriod: vi.fn(),
}));

let checkAll: ReturnType<typeof vi.fn>;
let manager: EntitlementManager;

beforeEach(() => {
	checkAll = vi.fn();
	manager = { checkAll } as unknown as EntitlementManager;
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('when no license is present (core install)', () => {
	test('returns "grace" when the install is in the core upgrade grace period', async () => {
		vi.mocked(isInCoreGracePeriod).mockResolvedValue(true);

		const result = await computeLicenseStatus(null, manager);

		expect(result).toEqual('grace');
		expect(checkAll).not.toHaveBeenCalled();
	});

	test('returns "locked" when out of grace and over entitlement limits', async () => {
		vi.mocked(isInCoreGracePeriod).mockResolvedValue(false);
		checkAll.mockResolvedValue(false);

		const result = await computeLicenseStatus(null, manager);

		expect(result).toEqual('locked');
	});

	test('returns "active" when out of grace and within entitlement limits', async () => {
		vi.mocked(isInCoreGracePeriod).mockResolvedValue(false);
		checkAll.mockResolvedValue(true);

		const result = await computeLicenseStatus(null, manager);

		expect(result).toEqual('active');
	});
});

describe('when a license is present', () => {
	test('returns "locked" when over entitlement limits, regardless of expiry', async () => {
		checkAll.mockResolvedValue(false);

		const result = await computeLicenseStatus(
			{ meta: { expires_at: Math.floor(Date.now() / 1000) - 100 } } as License,
			manager,
		);

		expect(result).toEqual('locked');
		expect(isInCoreGracePeriod).not.toHaveBeenCalled();
	});

	test('returns "active" for a perpetual license (expires_at = -1)', async () => {
		checkAll.mockResolvedValue(true);

		const result = await computeLicenseStatus(CORE_LICENSE, manager);

		expect(result).toEqual('active');
	});

	test('returns "active" when expires_at is in the future', async () => {
		checkAll.mockResolvedValue(true);

		const result = await computeLicenseStatus(
			{ meta: { expires_at: Math.floor(Date.now() / 1000) + 100 } } as License,
			manager,
		);

		expect(result).toEqual('active');
	});

	test('returns "grace" when expires_at is in the past', async () => {
		checkAll.mockResolvedValue(true);

		const result = await computeLicenseStatus(
			{ meta: { expires_at: Math.floor(Date.now() / 1000) - 100 } } as License,
			manager,
		);

		expect(result).toEqual('grace');
	});

	test('"active" when expires_at is null and renews_at is in the future', async () => {
		checkAll.mockResolvedValue(true);

		const result = await computeLicenseStatus(
			{ meta: { expires_at: null, renews_at: Math.floor(Date.now() / 1000) + 100 } } as License,
			manager,
		);

		expect(result).toEqual('active');
	});

	test('"grace" when expires_at is null and renews_at is in the past', async () => {
		checkAll.mockResolvedValue(true);

		const result = await computeLicenseStatus(
			{ meta: { expires_at: null, renews_at: Math.floor(Date.now() / 1000) - 100 } } as License,
			manager,
		);

		expect(result).toEqual('grace');
	});

	test('treats license as perpetual when both expires_at and renews_at are absent', async () => {
		checkAll.mockResolvedValue(true);

		const result = await computeLicenseStatus({ meta: { expires_at: null, renews_at: null } } as License, manager);

		expect(result).toEqual('active');
	});
});
