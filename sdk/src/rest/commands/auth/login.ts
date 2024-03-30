import type { AuthenticationData, AuthenticationMode } from '../../../index.js';
import type { RestCommand } from '../../types.js';
import { getAuthEndpoint } from '../../utils/get-auth-endpoint.js';

export type LoginOptions = {
	/** The user's one-time-password (if MFA is enabled). */
	otp?: string;
	/** Whether to retrieve the refresh token in the JSON response, or in a httpOnly cookie. One of `json`, `cookie` or `session`. Defaults to `cookie`. */
	mode?: AuthenticationMode;
	/** Whether to authenticate as a share. */
	share?: boolean;
	/** Use a specific authentication provider (does not work for SSO that relies on browser redirects). */
	provider?: string;
};

/**
 * Retrieve a temporary access token and refresh token.
 *
 * @param email Email address of the user you're retrieving the access token for.
 * @param password Password of the user.
 * @param options Optional login settings
 *
 * @returns The access and refresh tokens for the session
 */
export const login =
	<Schema extends object>(
		email: string,
		password: string,
		options: LoginOptions = {},
	): RestCommand<AuthenticationData, Schema> =>
	() => {
		const path = getAuthEndpoint(options.provider, options.share);
		const data: Record<string, string> = { email, password };
		if ('otp' in options) data['otp'] = options.otp;
		data['mode'] = options.mode ?? 'cookie';
		return { path, method: 'POST', body: JSON.stringify(data) };
	};
