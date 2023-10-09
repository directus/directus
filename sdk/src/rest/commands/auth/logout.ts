import type { RestCommand } from '../../types.js';

/**
 * Invalidate the refresh token thus destroying the user's session.
 *
 * @param refresh_token The refresh token to invalidate. If you have the refresh token in a cookie through /auth/login, you don't have to submit it here.
 *
 * @returns Empty body.
 */
export const logout =
	<Schema extends object>(refresh_token?: string): RestCommand<void, Schema> =>
	() => ({
		path: '/auth/logout',
		method: 'POST',
		body: JSON.stringify(refresh_token ? { refresh_token } : {}),
	});
