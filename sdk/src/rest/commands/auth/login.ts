import type { AuthenticationData, AuthenticationMode } from '../../../index.js';
import type { RestCommand } from '../../types.js';

export interface loginOptions {
	otp?: string;
	provider?: string;
	mode?: AuthenticationMode;
}

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
		options: loginOptions = {}
	): RestCommand<AuthenticationData, Schema> =>
	() => {
		const path = options.provider ? `/auth/login/${options.provider}` : '/auth/login';
		const data: Record<string, string> = { email, password };
		if ('otp' in options) data['otp'] = options.otp;
		if ('mode' in options) data['mode'] = options.mode;
		return { path, method: 'POST', body: JSON.stringify(data) };
	};
