import { LimitExceededError } from '@directus/errors';
import { UserIntegrityCheckFlag } from '@directus/types';
import type { Knex } from 'knex';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getEntitlementManager } from '../license/entitlements/manager.js';
import { validateRemainingAdminCount } from '../permissions/modules/validate-remaining-admin/validate-remaining-admin-count.js';
import { checkUserLimits } from '../telemetry/utils/check-user-limits.js';
import { shouldCheckUserLimits } from '../telemetry/utils/should-check-user-limits.js';
import { fetchUserCount } from './fetch-user-count/fetch-user-count.js';
import { validateUserCountIntegrity } from './validate-user-count-integrity.js';

vi.mock('./fetch-user-count/fetch-user-count.js');
vi.mock('../license/entitlements/manager.js');
vi.mock('../permissions/modules/validate-remaining-admin/validate-remaining-admin-count.js');
vi.mock('../telemetry/utils/check-user-limits.js');
vi.mock('../telemetry/utils/should-check-user-limits.js');

const knex = {} as Knex;

const getCached = vi.fn();
const clearCache = vi.fn();
const getEntitlementLimit = vi.fn();

beforeEach(() => {
	vi.mocked(fetchUserCount).mockResolvedValue({ admin: 1, app: 0, api: 0 });
	vi.mocked(shouldCheckUserLimits).mockReturnValue(false);
	getEntitlementLimit.mockReturnValue(-1);
	getCached.mockReturnValue(undefined);
	clearCache.mockReturnValue(undefined);
	vi.mocked(getEntitlementManager).mockReturnValue({ getCached, getEntitlementLimit, clearCache } as any);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('flag gating', () => {
	test('returns early when no flags are set', async () => {
		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.None, knex });

		expect(fetchUserCount).not.toHaveBeenCalled();
		expect(getEntitlementLimit).not.toHaveBeenCalled();
		expect(checkUserLimits).not.toHaveBeenCalled();
		expect(validateRemainingAdminCount).not.toHaveBeenCalled();
	});

	test('passes adminOnly to fetchUserCount when only RemainingAdmins is set', async () => {
		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.RemainingAdmins, knex });

		expect(fetchUserCount).toHaveBeenCalledWith(expect.objectContaining({ adminOnly: true }));
	});

	test('does not pass adminOnly when UserLimits is also set', async () => {
		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.All, knex });

		expect(fetchUserCount).toHaveBeenCalledWith(expect.objectContaining({ adminOnly: false }));
	});
});

describe('seats entitlement enforcement', () => {
	test('does not read seats entitlement when UserLimits flag is unset', async () => {
		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.RemainingAdmins, knex });

		expect(getEntitlementLimit).not.toHaveBeenCalled();
	});

	test('allows any count when the seat limit is unlimited (-1)', async () => {
		getEntitlementLimit.mockReturnValue(-1);
		vi.mocked(fetchUserCount).mockResolvedValue({ admin: 100, app: 9000, api: 0 });

		await expect(
			validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.UserLimits, knex }),
		).resolves.toBeUndefined();
	});

	test('allows the count when within the seat limit', async () => {
		getEntitlementLimit.mockReturnValue(5);
		vi.mocked(fetchUserCount).mockResolvedValue({ admin: 2, app: 3, api: 99 });

		await expect(
			validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.UserLimits, knex }),
		).resolves.toBeUndefined();
	});

	test('throws when over the limit and no cached count exists', async () => {
		getEntitlementLimit.mockReturnValue(5);
		vi.mocked(fetchUserCount).mockResolvedValue({ admin: 3, app: 3, api: 0 });

		await expect(validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.UserLimits, knex })).rejects.toBeInstanceOf(
			LimitExceededError,
		);
	});

	test('throws when over the limit and adding a seat', async () => {
		getEntitlementLimit.mockReturnValue(5);
		vi.mocked(fetchUserCount).mockResolvedValue({ admin: 3, app: 4, api: 0 });

		await expect(
			validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.UserLimits, previousSeatCount: 6, knex }),
		).rejects.toBeInstanceOf(LimitExceededError);
	});

	test('allows removing/editing when over the limit but with no limit change', async () => {
		getEntitlementLimit.mockReturnValue(5);
		vi.mocked(fetchUserCount).mockResolvedValue({ admin: 5, app: 5, api: 0 });

		await expect(
			validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.UserLimits, previousSeatCount: 10, knex }),
		).resolves.toBeUndefined();
	});

	test('clear cache after validating user limit and count has changed', async () => {
		getEntitlementLimit.mockReturnValue(11);
		vi.mocked(fetchUserCount).mockResolvedValue({ admin: 5, app: 5, api: 0 });

		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.UserLimits, previousSeatCount: 11, knex });

		expect(clearCache).toHaveBeenCalled();
	});
});

describe('env-var user limits', () => {
	test('runs checkUserLimits when UserLimits is set and shouldCheckUserLimits returns true', async () => {
		vi.mocked(shouldCheckUserLimits).mockReturnValue(true);
		vi.mocked(fetchUserCount).mockResolvedValue({ admin: 1, app: 2, api: 3 });

		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.UserLimits, knex });

		expect(checkUserLimits).toHaveBeenCalledWith({ admin: 1, app: 2, api: 3 });
	});

	test('skips checkUserLimits when shouldCheckUserLimits returns false', async () => {
		vi.mocked(shouldCheckUserLimits).mockReturnValue(false);

		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.UserLimits, knex });

		expect(checkUserLimits).not.toHaveBeenCalled();
	});

	test('skips checkUserLimits when only RemainingAdmins is set', async () => {
		vi.mocked(shouldCheckUserLimits).mockReturnValue(true);

		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.RemainingAdmins, knex });

		expect(checkUserLimits).not.toHaveBeenCalled();
	});
});

describe('remaining admin enforcement', () => {
	test('validates admin count when RemainingAdmins is set', async () => {
		vi.mocked(fetchUserCount).mockResolvedValue({ admin: 2, app: 0, api: 0 });

		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.RemainingAdmins, knex });

		expect(validateRemainingAdminCount).toHaveBeenCalledWith(2);
	});

	test('skips admin validation when RemainingAdmins is unset', async () => {
		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.UserLimits, knex });

		expect(validateRemainingAdminCount).not.toHaveBeenCalled();
	});

	test('runs both seats check and admin validation when All is set', async () => {
		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.All, knex });

		expect(getEntitlementLimit).toHaveBeenCalledWith('seats');
		expect(validateRemainingAdminCount).toHaveBeenCalledWith(1);
	});
});
