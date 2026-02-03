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
		// Reject protocol-relative URLs (current behavior)
		if (redirect.startsWith('//')) {
			return false;
		}

		try {
			const parsedUrl = new URL(redirect, 'http://dummy.local');

			// If the redirect and parsed pathname match then it is a safe relative path
			return parsedUrl.pathname === redirect;
		} catch {
			// Unparsable URL
			return false;
		}
	}

	const envKey = `AUTH_${provider.toUpperCase()}_REDIRECT_ALLOW_LIST`;

	if (envKey in env) {
		const allowedList = toArray(String(env[envKey]));
		allowedList.push(publicUrl);

		if (isUrlAllowed(redirect, allowedList)) {
			return true;
		}
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
