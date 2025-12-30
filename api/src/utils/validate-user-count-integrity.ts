import { fetchUserCount, type FetchUserCountOptions } from './fetch-user-count/fetch-user-count.js';
import { validateRemainingAdminCount } from '../permissions/modules/validate-remaining-admin/validate-remaining-admin-count.js';
import { checkUserLimits } from '../telemetry/utils/check-user-limits.js';
import { shouldCheckUserLimits } from '../telemetry/utils/should-check-user-limits.js';
import { UserIntegrityCheckFlag } from '@directus/types';

export interface ValidateUserCountIntegrityOptions extends Omit<FetchUserCountOptions, 'adminOnly'> {
	flags: UserIntegrityCheckFlag;
}

export async function validateUserCountIntegrity(options: ValidateUserCountIntegrityOptions) {
	const validateUserLimits = (options.flags & UserIntegrityCheckFlag.UserLimits) !== 0;
	const validateRemainingAdminUsers = (options.flags & UserIntegrityCheckFlag.RemainingAdmins) !== 0;

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
