import { useEnv } from '@directus/env';
import { LimitExceededError } from '@directus/errors';
import type { Knex } from 'knex';
import { getUserCount, type AccessTypeCount } from './get-user-count.js';

const env = useEnv();

/**
 * Ensure that user limits are not reached
 */
export async function checkIncreasedUserLimits(db: Knex, increasedUserCounts: AccessTypeCount): Promise<void> {
	if (!increasedUserCounts.admin && !increasedUserCounts.app && !increasedUserCounts.api) return;

	const userCounts = await getUserCount(db);

	if (
		increasedUserCounts.admin > 0 &&
		increasedUserCounts.admin + userCounts.admin > Number(env['USERS_ADMIN_ACCESS_LIMIT'])
	) {
		throw new LimitExceededError({ message: 'Active Admin users limit exceeded.' });
	}

	if (increasedUserCounts.app > 0 && increasedUserCounts.app + userCounts.app > Number(env['USERS_APP_ACCESS_LIMIT'])) {
		throw new LimitExceededError({ message: 'Active App users limit exceeded.' });
	}

	if (increasedUserCounts.api > 0 && increasedUserCounts.api + userCounts.api > Number(env['USERS_API_ACCESS_LIMIT'])) {
		throw new LimitExceededError({ message: 'Active API users limit exceeded.' });
	}
}
