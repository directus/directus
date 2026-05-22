import { LimitExceededError } from '@directus/errors';
import { UserIntegrityCheckFlag } from '@directus/types';
import type { Knex } from 'knex';
import { validateRemainingAdminCount } from '../permissions/modules/validate-remaining-admin/validate-remaining-admin-count.js';
import { checkUserLimits } from '../telemetry/utils/check-user-limits.js';
import { shouldCheckUserLimits } from '../telemetry/utils/should-check-user-limits.js';
import { fetchUserCount, type FetchUserCountOptions, type UserCount } from './fetch-user-count/fetch-user-count.js';

export interface ValidateUserCountIntegrityOptions extends Omit<FetchUserCountOptions, 'adminOnly'> {
	flags: UserIntegrityCheckFlag;
	previousSeatCount?: number | undefined;
}

export async function validateUserCountIntegrity(options: ValidateUserCountIntegrityOptions) {
	const validateUserLimits = (options.flags & UserIntegrityCheckFlag.UserLimits) !== 0;
	const validateRemainingAdminUsers = (options.flags & UserIntegrityCheckFlag.RemainingAdmins) !== 0;

	const envLimitCheck = validateUserLimits && shouldCheckUserLimits();

	if (!validateRemainingAdminUsers && !validateUserLimits) {
		return;
	}

	const adminOnly = validateRemainingAdminUsers && !validateUserLimits;
	const userCounts = await fetchUserCount({ ...options, adminOnly });

	if (validateUserLimits) {
		await checkSeatsCount(userCounts, options.previousSeatCount);
	}

	if (envLimitCheck) {
		await checkUserLimits(userCounts);
	}

	if (validateRemainingAdminUsers) {
		validateRemainingAdminCount(userCounts.admin);
	}

	// Invalidate the entitlement cache only on when the count has changed
	if (validateUserLimits && options.previousSeatCount !== userCounts.admin + userCounts.app) {
		const { getEntitlementManager } = await import('../license/entitlements/manager.js');
		await getEntitlementManager().clearCache('seats', 'sso_enabled');
	}
}

async function checkSeatsCount(userCounts: UserCount, previousSeatCount: number | undefined) {
	// Dynamic import to prevent circular imports in services
	const { getEntitlementManager } = await import('../license/entitlements/manager.js');
	const seatLimit = getEntitlementManager().getEntitlementLimit('seats');
	const newCount = userCounts.admin + userCounts.app;

	if (seatLimit === -1 || newCount <= seatLimit) return;

	if (previousSeatCount === undefined || newCount > previousSeatCount) {
		throw new LimitExceededError({ category: 'seats' });
	}
}

/**
 * Must be called at the top of a mutation transaction, before any writes, using
 * the transactional `knex` — that's the only way to read pre-state correctly on
 * every database.
 */
export async function captureSeatCount(
	knex: Knex,
	flags: UserIntegrityCheckFlag = UserIntegrityCheckFlag.None,
): Promise<number | undefined> {
	if ((flags & UserIntegrityCheckFlag.UserLimits) === 0) return undefined;
	// Dynamic import to prevent circular imports in services
	const { countActiveSeats } = await import('../license/entitlements/lib/seats.js');
	return await countActiveSeats({ knex });
}
