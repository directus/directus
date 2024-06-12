import { validateRemainingAdminCount } from '../permissions/modules/validate-remaining-admin/validate-remaining-admin-count.js';
import { checkUserLimits } from '../telemetry/utils/check-user-limits.js';
import { shouldCheckUserLimits } from '../telemetry/utils/should-check-user-limits.js';
import { fetchUserCount, type FetchUserCountOptions } from './fetch-user-count/fetch-user-count.js';

enum UserIntegrityCheckType {
	/** Check if the number of remaining admin users is greater than 0 */
	RemainingAdmins = 0,
	/** Check if the number of users is within the limits */
	UserLimits = 1,
}

export const USER_INTEGRITY_CHECK_REMAINING_ADMINS = 1 << UserIntegrityCheckType.RemainingAdmins;
export const USER_INTEGRITY_CHECK_USER_LIMITS = 1 << UserIntegrityCheckType.UserLimits;
export const USER_INTEGRITY_CHECK_ALL = USER_INTEGRITY_CHECK_REMAINING_ADMINS | USER_INTEGRITY_CHECK_USER_LIMITS;

export interface ValidateUserCountIntegrityOptions extends Omit<FetchUserCountOptions, 'adminOnly'> {
	flags: number;
}

export async function validateUserCountIntegrity(options: ValidateUserCountIntegrityOptions) {
	const validateUserLimits = (options.flags & USER_INTEGRITY_CHECK_USER_LIMITS) !== 0;
	const validateRemainingAdminUsers = (options.flags & USER_INTEGRITY_CHECK_REMAINING_ADMINS) !== 0;

	const limitCheck = validateUserLimits && shouldCheckUserLimits();

	if (!validateRemainingAdminUsers && !limitCheck) {
		return;
	}

	const adminOnly = validateRemainingAdminUsers && !limitCheck;
	const userCounts = await fetchUserCount({ ...options, adminOnly });

	if (limitCheck) {
		await checkUserLimits(userCounts);
	}

	if (validateRemainingAdminUsers) {
		validateRemainingAdminCount(userCounts.admin);
	}
}
