import { InternalServerError, LimitExceededError } from '@directus/errors';
import { UserIntegrityCheckFlag } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getLicenseEntitlements } from '../license/summary.js';
import { validateRemainingAdminCount } from '../permissions/modules/validate-remaining-admin/validate-remaining-admin-count.js';
import { fetchUserCount } from './fetch-user-count/fetch-user-count.js';
import { ensureUserCountBaseline, validateUserCountIntegrity } from './validate-user-count-integrity.js';

const { mockedEnv } = vi.hoisted(() => ({
	mockedEnv: {
		USERS_ADMIN_ACCESS_LIMIT: 3,
		USERS_APP_ACCESS_LIMIT: 3,
		USERS_API_ACCESS_LIMIT: 3,
	},
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue(mockedEnv),
}));

vi.mock('../license/summary.js', () => ({
	getLicenseEntitlements: vi.fn(),
}));

vi.mock('../permissions/modules/validate-remaining-admin/validate-remaining-admin-count.js', () => ({
	validateRemainingAdminCount: vi.fn(),
}));

vi.mock('./fetch-user-count/fetch-user-count.js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./fetch-user-count/fetch-user-count.js')>();

	return {
		...actual,
		fetchUserCount: vi.fn(),
	};
});

const mockedFetchUserCount = vi.mocked(fetchUserCount);
const mockedGetLicenseEntitlements = vi.mocked(getLicenseEntitlements);
const mockedValidateRemainingAdminCount = vi.mocked(validateRemainingAdminCount);

afterEach(() => {
	vi.clearAllMocks();
	mockedEnv.USERS_ADMIN_ACCESS_LIMIT = 3;
	mockedEnv.USERS_APP_ACCESS_LIMIT = 3;
	mockedEnv.USERS_API_ACCESS_LIMIT = 3;
});

describe('ensureUserCountBaseline', () => {
	test('returned undefined when user limits were not requested', async () => {
		await expect(
			ensureUserCountBaseline({ flags: UserIntegrityCheckFlag.RemainingAdmins, knex: {} as any }),
		).resolves.toBeUndefined();

		expect(mockedFetchUserCount).not.toHaveBeenCalled();
	});

	test('returns the provided counts', async () => {
		await expect(
			ensureUserCountBaseline({
				flags: UserIntegrityCheckFlag.UserLimits,
				knex: {} as any,
				userCountBaseline: { admin: 1, app: 2, api: 3 },
			}),
		).resolves.toEqual({ admin: 1, app: 2, api: 3 });

		expect(mockedFetchUserCount).not.toHaveBeenCalled();
	});

	test('loads the full user counts', async () => {
		mockedFetchUserCount.mockResolvedValue({ admin: 2, app: 3, api: 99 });

		await expect(
			ensureUserCountBaseline({ flags: UserIntegrityCheckFlag.UserLimits, knex: {} as any }),
		).resolves.toEqual({ admin: 2, app: 3, api: 99 });
	});
});

describe('validateUserCountIntegrity', () => {
	test('no-oped when no integrity checks were requested', async () => {
		await validateUserCountIntegrity({ flags: UserIntegrityCheckFlag.None, knex: {} as any });

		expect(mockedFetchUserCount).not.toHaveBeenCalled();
		expect(mockedGetLicenseEntitlements).not.toHaveBeenCalled();
	});

	test('validated user seats using admin and app users only', async () => {
		mockedEnv.USERS_ADMIN_ACCESS_LIMIT = Infinity;
		mockedEnv.USERS_APP_ACCESS_LIMIT = Infinity;
		mockedEnv.USERS_API_ACCESS_LIMIT = Infinity;

		mockedFetchUserCount.mockResolvedValue({ admin: 2, app: 2, api: 500 });

		mockedGetLicenseEntitlements.mockResolvedValue({
			seats: { limit: 3, hard_limit: 3, is_overage_allowed: false },
		} as any);

		const promise = validateUserCountIntegrity({
			flags: UserIntegrityCheckFlag.UserLimits,
			knex: {} as any,
			userCountBaseline: { admin: 1, app: 2, api: 500 },
		});

		await expect(promise).rejects.toMatchObject({
			message: 'Users limit exceeded.',
			extensions: {
				category: 'Users',
				limit_type: 'license',
			},
		});
	});

	test('allowed neutral seat usage while already over limit', async () => {
		mockedFetchUserCount.mockResolvedValue({ admin: 2, app: 2, api: 0 });

		mockedGetLicenseEntitlements.mockResolvedValue({
			seats: { limit: 3, hard_limit: 3, is_overage_allowed: false },
		} as any);

		await expect(
			validateUserCountIntegrity({
				flags: UserIntegrityCheckFlag.UserLimits,
				knex: {} as any,
				userCountBaseline: { admin: 2, app: 2, api: 0 },
			}),
		).resolves.toBeUndefined();
	});

	test('fails closed when user limits are requested without a baseline', async () => {
		mockedFetchUserCount.mockResolvedValue({ admin: 2, app: 2, api: 0 });

		mockedGetLicenseEntitlements.mockResolvedValue({
			seats: { limit: 3, hard_limit: 3, is_overage_allowed: false },
		} as any);

		await expect(
			validateUserCountIntegrity({
				flags: UserIntegrityCheckFlag.UserLimits,
				knex: {} as any,
			}),
		).rejects.toBeInstanceOf(InternalServerError);
	});

	test('allowed decreasing seat usage while already over limit', async () => {
		mockedFetchUserCount.mockResolvedValue({ admin: 1, app: 1, api: 0 });

		mockedGetLicenseEntitlements.mockResolvedValue({
			seats: { limit: 1, hard_limit: 1, is_overage_allowed: false },
		} as any);

		await expect(
			validateUserCountIntegrity({
				flags: UserIntegrityCheckFlag.UserLimits,
				knex: {} as any,
				userCountBaseline: { admin: 2, app: 2, api: 0 },
			}),
		).resolves.toBeUndefined();
	});

	test('enforced the configured admin env limit on increases', async () => {
		mockedFetchUserCount.mockResolvedValue({ admin: 4, app: 0, api: 0 });

		mockedGetLicenseEntitlements.mockResolvedValue({
			seats: { limit: 10, hard_limit: 10, is_overage_allowed: false },
		} as any);

		await expect(
			validateUserCountIntegrity({
				flags: UserIntegrityCheckFlag.UserLimits,
				knex: {} as any,
				userCountBaseline: { admin: 3, app: 0, api: 0 },
			}),
		).rejects.toBeInstanceOf(LimitExceededError);
	});

	test('allowed api decreases while current usage stayed over the configured env limit', async () => {
		mockedFetchUserCount.mockResolvedValue({ admin: 0, app: 0, api: 4 });

		mockedGetLicenseEntitlements.mockResolvedValue({
			seats: { limit: 10, hard_limit: 10, is_overage_allowed: false },
		} as any);

		await expect(
			validateUserCountIntegrity({
				flags: UserIntegrityCheckFlag.UserLimits,
				knex: {} as any,
				userCountBaseline: { admin: 0, app: 0, api: 5 },
			}),
		).resolves.toBeUndefined();
	});

	test('validated remaining admins with the admin-only query when seat checks were not requested', async () => {
		mockedFetchUserCount.mockResolvedValue({ admin: 1, app: 0, api: 0 });

		await validateUserCountIntegrity({
			flags: UserIntegrityCheckFlag.RemainingAdmins,
			knex: {} as any,
		});

		expect(mockedFetchUserCount).toHaveBeenCalledWith({
			flags: UserIntegrityCheckFlag.RemainingAdmins,
			knex: {} as any,
			adminOnly: true,
		});

		expect(mockedValidateRemainingAdminCount).toHaveBeenCalledWith(1);
	});

	test('ran both seat and remaining-admin validation when both flags were requested', async () => {
		mockedFetchUserCount.mockResolvedValue({ admin: 1, app: 1, api: 0 });

		mockedGetLicenseEntitlements.mockResolvedValue({
			seats: { limit: 3, hard_limit: 3, is_overage_allowed: false },
		} as any);

		await validateUserCountIntegrity({
			flags: UserIntegrityCheckFlag.All,
			knex: {} as any,
			userCountBaseline: { admin: 1, app: 0, api: 0 },
		});

		expect(mockedValidateRemainingAdminCount).toHaveBeenCalledWith(1);
	});
});
