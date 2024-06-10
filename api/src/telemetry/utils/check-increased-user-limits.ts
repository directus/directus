import { useEnv } from '@directus/env';
import { LimitExceededError } from '@directus/errors';
import type { Knex } from 'knex';
import { fetchUserCount, type UserCount } from '../../utils/fetch-user-count/fetch-user-count.js';
import type { PrimaryKey } from '@directus/types';

const env = useEnv();

/**
 * Ensure that user limits are not reached
 */
export async function checkIncreasedUserLimits(
	db: Knex,
	increasedUserCounts: UserCount,
	// TODO
	// @ts-ignore
	ignoreIds: PrimaryKey[] = [],
): Promise<void> {
	if (!increasedUserCounts.admin && !increasedUserCounts.app && !increasedUserCounts.api) return;

	const userCounts = await fetchUserCount(db); // TODO , ignoreIds);

	if (
		increasedUserCounts.admin > 0 &&
		increasedUserCounts.admin + userCounts.admin > Number(env['USERS_ADMIN_ACCESS_LIMIT'])
	) {
		throw new LimitExceededError({ category: 'Active Admin users' });
	}

	if (increasedUserCounts.app > 0 && increasedUserCounts.app + userCounts.app > Number(env['USERS_APP_ACCESS_LIMIT'])) {
		throw new LimitExceededError({ category: 'Active App users' });
	}

	if (increasedUserCounts.api > 0 && increasedUserCounts.api + userCounts.api > Number(env['USERS_API_ACCESS_LIMIT'])) {
		throw new LimitExceededError({ category: 'Active API users' });
	}
}
