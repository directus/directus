import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { useLogger } from '../../logger/index.js';
import isUrlAllowed from '../../utils/is-url-allowed.js';

/**
 * Checks if the defined redirect after successful SSO login is in the allow list
 * @param provider SSO provider name
 * @param redirect URL to redirect to after login
 * @returns True if the redirect is allowed, false otherwise
 */
export function isLoginRedirectAllowed(provider: string, redirect: unknown): boolean {
	if (!redirect) return true; // empty redirect
	if (typeof redirect !== 'string') return false; // invalid type

	const env = useEnv();
	const publicUrl = env['PUBLIC_URL'] as string;

	if (!URL.canParse(redirect)) {
		if (!redirect.startsWith('//')) {
			// should be a relative path like `/admin/test`
			return true;
		}

		// domain without protocol `//example.com/test`
		return false;
	}

	const envKey = `AUTH_${provider.toUpperCase()}_REDIRECT_ALLOW_LIST`;

	if (envKey in env) {
		if (isUrlAllowed(redirect, [...toArray(env[envKey] as string), publicUrl])) return true;
	}

	if (URL.canParse(publicUrl) === false) {
		useLogger().error('Invalid PUBLIC_URL for login redirect');
		return false;
	}

	const { protocol: redirectProtocol, host: redirectHost } = new URL(redirect);
	const { protocol: publicProtocol, host: publicHost } = new URL(publicUrl);

	// allow redirects to the defined PUBLIC_URL (protocol + host including port)
	return `${redirectProtocol}//${redirectHost}` === `${publicProtocol}//${publicHost}`;
}
