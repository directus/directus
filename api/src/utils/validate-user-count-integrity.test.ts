import { LimitExceededError } from '@directus/errors';
import { UserIntegrityCheckFlag } from '@directus/types';
import type { Knex } from 'knex';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getEntitlementManager } from '../license/index.js';
import { validateRemainingAdminCount } from '../permissions/modules/validate-remaining-admin/validate-remaining-admin-count.js';
import { checkUserLimits } from '../telemetry/utils/check-user-limits.js';
import { shouldCheckUserLimits } from '../telemetry/utils/should-check-user-limits.js';
import { fetchUserCount } from './fetch-user-count/fetch-user-count.js';
import { validateUserCountIntegrity } from './validate-user-count-integrity.js';

vi.mock('./fetch-user-count/fetch-user-count.js');
vi.mock('../license/index.js');
vi.mock('../permissions/modules/validate-remaining-admin/validate-remaining-admin-count.js');
vi.mock('../telemetry/utils/check-user-limits.js');
vi.mock('../telemetry/utils/should-check-user-limits.js');

const knex = {} as Knex;

const assertSeats = vi.fn();

beforeEach(() => {
	vi.mocked(fetchUserCount).mockResolvedValue({ admin: 1, app: 0, api: 0 });
	vi.mocked(shouldCheckUserLimits).mockReturnValue(false);
	vi.mocked(getEntitlementManager).mockReturnValue({ assert: assertSeats } as any);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('flag gating', () => {
	test('returns early when no flags are set', async () => {
		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.None, knex });

		expect(fetchUserCount).not.toHaveBeenCalled();
		expect(assertSeats).not.toHaveBeenCalled();
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
	test('asserts seats when UserLimits flag is set', async () => {
		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.UserLimits, knex });

		expect(assertSeats).toHaveBeenCalledWith('seats');
	});

	test('does not assert seats when UserLimits flag is unset', async () => {
		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.RemainingAdmins, knex });

		expect(assertSeats).not.toHaveBeenCalled();
	});

	test('propagates LimitExceededError thrown by the entitlement manager', async () => {
		assertSeats.mockRejectedValueOnce(new LimitExceededError({ category: 'seats' }));

		await expect(validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.UserLimits, knex })).rejects.toBeInstanceOf(
			LimitExceededError,
		);
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

	test('runs both seats assert and admin validation when All is set', async () => {
		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.All, knex });

		expect(assertSeats).toHaveBeenCalledWith('seats');
		expect(validateRemainingAdminCount).toHaveBeenCalledWith(1);
	});
});
