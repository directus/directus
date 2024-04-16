import type { AuthenticationData, LoginOptions } from '../../../index.js';
import type { RestCommand } from '../../types.js';
import { getAuthEndpoint } from '../../utils/get-auth-endpoint.js';

/**
 * Authenticate as a user.
 *
 * @param email Email address of the user.
 * @param password Password of the user.
 * @param options Optional login settings.
 *
 * @returns Authentication data.
 */
export const login =
	<Schema>(email: string, password: string, options: LoginOptions = {}): RestCommand<AuthenticationData, Schema> =>
	() => {
		const path = getAuthEndpoint(options.provider);
		const data: Record<string, string> = { email, password };
		if ('otp' in options) data['otp'] = options.otp;
		data['mode'] = options.mode ?? 'cookie';
		return { path, method: 'POST', body: JSON.stringify(data) };
	};
