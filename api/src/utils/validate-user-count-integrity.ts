import { useEnv } from '@directus/env';
import { InternalServerError, LimitExceededError } from '@directus/errors';
import { type UserCountBaseline, UserIntegrityCheckFlag } from '@directus/types';
import { validateNumericEntitlementLimit } from '../license/numeric-gate.js';
import { getLicenseEntitlements } from '../license/summary.js';
import { validateRemainingAdminCount } from '../permissions/modules/validate-remaining-admin/validate-remaining-admin-count.js';
import { fetchUserCount, type FetchUserCountOptions, getUserSeatsCount } from './fetch-user-count/fetch-user-count.js';

const env = useEnv();

export interface ValidateUserCountIntegrityOptions extends Omit<FetchUserCountOptions, 'adminOnly'> {
	flags: UserIntegrityCheckFlag;
	userCountBaseline?: UserCountBaseline;
}

export async function ensureUserCountBaseline(
	options: Pick<ValidateUserCountIntegrityOptions, 'flags' | 'knex' | 'userCountBaseline'>,
): Promise<UserCountBaseline | undefined> {
	const validateUserLimits = (options.flags & UserIntegrityCheckFlag.UserLimits) !== 0;

	if (!validateUserLimits || options.userCountBaseline !== undefined) {
		return options.userCountBaseline;
	}

	return await fetchUserCount({ knex: options.knex });
}

function validateIncreaseOnlyUserLimit(
	current: number,
	baseline: number,
	limit: number,
	category: 'Active Admin users' | 'Active App users' | 'Active API users',
) {
	if (limit === Infinity) return;
	if (current <= baseline) return;
	if (current <= limit) return;

	throw new LimitExceededError({ category });
}

function validateConfiguredUserLimits(userCountBaseline: UserCountBaseline, userCountCurrent: UserCountBaseline) {
	validateIncreaseOnlyUserLimit(
		userCountCurrent.admin,
		userCountBaseline.admin,
		Number(env['USERS_ADMIN_ACCESS_LIMIT']),
		'Active Admin users',
	);

	validateIncreaseOnlyUserLimit(
		userCountCurrent.admin + userCountCurrent.app,
		userCountBaseline.admin + userCountBaseline.app,
		Number(env['USERS_APP_ACCESS_LIMIT']),
		'Active App users',
	);

	validateIncreaseOnlyUserLimit(
		userCountCurrent.api,
		userCountBaseline.api,
		Number(env['USERS_API_ACCESS_LIMIT']),
		'Active API users',
	);
}

export async function validateUserCountIntegrity(options: ValidateUserCountIntegrityOptions) {
	const validateUserLimits = (options.flags & UserIntegrityCheckFlag.UserLimits) !== 0;
	const validateRemainingAdminUsers = (options.flags & UserIntegrityCheckFlag.RemainingAdmins) !== 0;

	if (!validateRemainingAdminUsers && !validateUserLimits) {
		return;
	}

	const adminOnly = validateRemainingAdminUsers && !validateUserLimits;
	const userCounts = await fetchUserCount({ ...options, adminOnly });

	if (validateUserLimits) {
		const entitlements = await getLicenseEntitlements(options.knex);
		const userCountBaseline = options.userCountBaseline;

		if (userCountBaseline === undefined) {
			throw new InternalServerError();
		}

		validateConfiguredUserLimits(userCountBaseline, userCounts);

		const userSeatsBaseline = getUserSeatsCount(userCountBaseline);
		const userSeatsCurrent = getUserSeatsCount(userCounts);
		const userSeatsDelta = userSeatsCurrent - userSeatsBaseline;

		if (userSeatsDelta > 0) {
			validateNumericEntitlementLimit({
				entitlement: entitlements.seats,
				current: userSeatsBaseline,
				delta: userSeatsDelta,
				category: 'Users',
				limit_type: 'license',
			});
		}
	}

	if (validateRemainingAdminUsers) {
		validateRemainingAdminCount(userCounts.admin);
	}
}
