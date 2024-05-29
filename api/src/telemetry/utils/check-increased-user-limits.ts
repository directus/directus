import { useEnv } from '@directus/env';
import { LimitExceededError } from '@directus/errors';
import type { Knex } from 'knex';
import { getUserCount, type UserCount } from './get-user-count.js';

const env = useEnv();

/**
 * Ensure that user limits are not reached
 */
export async function checkIncreasedUserLimits(db: Knex, increasedUserCounts: UserCount): Promise<void> {
	if (!increasedUserCounts.admin && !increasedUserCounts.app && !increasedUserCounts.api) return;

	const userCounts = await getUserCount(db);

	if (
		increasedUserCounts.admin > 0 &&
		increasedUserCounts.admin + userCounts.admin > Number(env['USERS_ACTIVE_LIMIT_ADMIN_ACCESS'])
	) {
		throw new LimitExceededError({ message: 'Active Admin users limit exceeded.' });
	}

	if (
		increasedUserCounts.app > 0 &&
		increasedUserCounts.app + userCounts.app > Number(env['USERS_ACTIVE_LIMIT_APP_ACCESS'])
	) {
		throw new LimitExceededError({ message: 'Active App users limit exceeded.' });
	}

	if (
		increasedUserCounts.api > 0 &&
		increasedUserCounts.api + userCounts.api > Number(env['USERS_ACTIVE_LIMIT_API_ACCESS'])
	) {
		throw new LimitExceededError({ message: 'Active API users limit exceeded.' });
	}
}
