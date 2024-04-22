import type { AuthenticationMode } from '../../../index.js';
import type { RestCommand } from '../../types.js';

/**
 * Invalidate the refresh token thus destroying the user's session.
 *
 * @param mode Whether the refresh token is submitted in the JSON response, or in a httpOnly cookie.
 * @param refresh_token The refresh token to invalidate. If you have the refresh token in a cookie through /auth/login, you don't have to submit it here.
 *
 * @returns Empty body.
 */
export const logout =
	<Schema>(refresh_token?: string, mode: AuthenticationMode = 'cookie'): RestCommand<void, Schema> =>
	() => ({
		path: '/auth/logout',
		method: 'POST',
		body: JSON.stringify(refresh_token ? { refresh_token, mode } : { mode }),
	});
