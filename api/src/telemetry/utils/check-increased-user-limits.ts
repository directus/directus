import { useEnv } from '@directus/env';
import { LimitExceededError } from '@directus/errors';
import type { PrimaryKey } from '@directus/types';
import type { Knex } from 'knex';
import { getUserCount, type AccessTypeCount } from './get-user-count.js';

const env = useEnv();

/**
 * Ensure that user limits are not reached
 */
export async function checkIncreasedUserLimits(
	db: Knex,
	increasedUserCounts: AccessTypeCount,
	ignoreIds: PrimaryKey[] = [],
): Promise<void> {
	if (!increasedUserCounts.admin && !increasedUserCounts.app && !increasedUserCounts.api) return;

	const userCounts = await getUserCount(db, ignoreIds);

	// Admins have full permissions, therefore should count under app access limit
	const existingAppUsersCount = userCounts.admin + userCounts.app;
	const newAppUsersCount = increasedUserCounts.admin + increasedUserCounts.app;

	if (
		increasedUserCounts.admin > 0 &&
		increasedUserCounts.admin + userCounts.admin > Number(env['USERS_ADMIN_ACCESS_LIMIT'])
	) {
		throw new LimitExceededError({ category: 'Active Admin users' });
	}

	if (newAppUsersCount > 0 && newAppUsersCount + existingAppUsersCount > Number(env['USERS_APP_ACCESS_LIMIT'])) {
		throw new LimitExceededError({ category: 'Active App users' });
	}

	if (increasedUserCounts.api > 0 && increasedUserCounts.api + userCounts.api > Number(env['USERS_API_ACCESS_LIMIT'])) {
		throw new LimitExceededError({ category: 'Active API users' });
	}
}
