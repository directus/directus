import { type UserCount } from '../../utils/fetch-user-count/fetch-user-count.js';
import { useEnv } from '@directus/env';
import { LimitExceededError } from '@directus/errors';

const env = useEnv();

/**
 * Ensure that user limits are not reached
 */
export async function checkUserLimits(userCounts: UserCount): Promise<void> {
	if (userCounts.admin > Number(env['USERS_ADMIN_ACCESS_LIMIT'])) {
		throw new LimitExceededError({ category: 'Active Admin users' });
	}

	// Both app and admin users count against the app access limit
	if (userCounts.app + userCounts.admin > Number(env['USERS_APP_ACCESS_LIMIT'])) {
		throw new LimitExceededError({ category: 'Active App users' });
	}

	if (userCounts.api > Number(env['USERS_API_ACCESS_LIMIT'])) {
		throw new LimitExceededError({ category: 'Active API users' });
	}
}
