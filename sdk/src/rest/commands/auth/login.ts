import type {
	AuthenticationData,
	LDAPLoginPayload,
	LocalLoginPayload,
	LoginOptions,
	LoginPayload,
} from '../../../index.js';
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
export function login<Schema>(
	payload: LocalLoginPayload,
	options?: LoginOptions,
): RestCommand<AuthenticationData, Schema>;
export function login<Schema>(
	payload: LDAPLoginPayload,
	options?: LoginOptions,
): RestCommand<AuthenticationData, Schema>;
export function login<Schema>(
	payload: LoginPayload,
	options: LoginOptions = {},
): RestCommand<AuthenticationData, Schema> {
	return () => {
		const path = getAuthEndpoint(options.provider);
		const authData: Record<string, string> = payload;
		if ('otp' in options) authData['otp'] = options.otp;
		authData['mode'] = options.mode ?? 'cookie';
		return { path, method: 'POST', body: JSON.stringify(authData) };
	};
}
