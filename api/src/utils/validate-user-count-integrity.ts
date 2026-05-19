import { LimitExceededError } from '@directus/errors';
import { UserIntegrityCheckFlag } from '@directus/types';
import { validateRemainingAdminCount } from '../permissions/modules/validate-remaining-admin/validate-remaining-admin-count.js';
import { checkUserLimits } from '../telemetry/utils/check-user-limits.js';
import { shouldCheckUserLimits } from '../telemetry/utils/should-check-user-limits.js';
import { fetchUserCount, type FetchUserCountOptions, type UserCount } from './fetch-user-count/fetch-user-count.js';

export interface ValidateUserCountIntegrityOptions extends Omit<FetchUserCountOptions, 'adminOnly'> {
	flags: UserIntegrityCheckFlag;
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
		await checkSeatsCount(userCounts);
	}

	if (envLimitCheck) {
		await checkUserLimits(userCounts);
	}

	if (validateRemainingAdminUsers) {
		validateRemainingAdminCount(userCounts.admin);
	}
}

async function checkSeatsCount(userCounts: UserCount) {
	// Dynamic import to prevent circular imports in services
	const { getEntitlementManager } = await import('../license/entitlements/manager.js');
	const entitlementManager = getEntitlementManager();
	const cachedCount = entitlementManager.getCached('seats');
	const seatLimit = entitlementManager.getEntitlementLimit('seats');
	const newCount = userCounts.admin + userCounts.app;

	if (seatLimit === -1 || newCount <= seatLimit) return;
	
	if (typeof cachedCount !== 'number' || newCount > cachedCount) {
		throw new LimitExceededError({ category: 'seats' });
	}
}