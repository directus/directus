import type { AuthenticationData, AuthenticationMode } from '../../../index.js';
import type { RestCommand } from '../../types.js';

/**
 * Retrieve a new access token using a refresh token.
 *
 * @param refresh_token The refresh token to use. If you have the refresh token in a cookie through /auth/login, you don't have to submit it here.
 * @param mode Whether to retrieve the refresh token in the JSON response, or in a httpOnly secure cookie. One of json, cookie.
 *
 * @returns The new access and refresh tokens for the session.
 */
export const refresh =
	<Schema extends object>(
		refresh_token: string,
		mode: AuthenticationMode = 'json'
	): RestCommand<AuthenticationData, Schema> =>
	() => ({
		path: '/auth/refresh',
		method: 'POST',
		body: JSON.stringify({ refresh_token, ...(mode ? { mode } : {}) }),
	});
