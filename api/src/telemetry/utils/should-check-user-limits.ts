import { useEnv } from '@directus/env';

/**
 * Confirm whether user limits needs to be checked
 */
export function shouldCheckUserLimits(): boolean {
	const env = useEnv();

	if (
		env.USERS_ADMIN_ACCESS_LIMIT !== Infinity ||
		env.USERS_APP_ACCESS_LIMIT !== Infinity ||
		env.USERS_API_ACCESS_LIMIT !== Infinity
	) {
		return true;
	}

	return false;
}
