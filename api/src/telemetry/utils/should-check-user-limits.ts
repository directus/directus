import { useEnv } from '@directus/env';

/**
 * Confirm whether user limits needs to be checked
 */
export function shouldCheckUserLimits(): boolean {
	const env = useEnv();

	if (
		Number(env['USERS_ADMIN_ACCESS_LIMIT']) !== Infinity ||
		Number(env['USERS_APP_ACCESS_LIMIT']) !== Infinity ||
		Number(env['USERS_API_ACCESS_LIMIT']) !== Infinity
	) {
		return true;
	}

	return false;
}
