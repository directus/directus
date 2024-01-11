import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import isUrlAllowed from './is-url-allowed.js';

/**
 * Checks if the defined redirect after successful SSO login is in the allow list
 */
export function isLoginRedirectAllowed(redirect: unknown, provider: string): boolean {
	if (!redirect) return true; // empty redirect
	if (typeof redirect !== 'string') return false; // invalid type

	const env = useEnv();

	try {
		const { hostname: redirectDomain } = new URL(redirect);

		const envKey = `AUTH_${provider.toUpperCase()}_REDIRECT_ALLOW_LIST`;

		if (envKey in env) {
			return isUrlAllowed(redirect, [...toArray(env[envKey] as string), env['PUBLIC_URL'] as string]);
		}

		// allow redirects to the defined PUBLIC_URL
		const { hostname: publicDomain } = new URL(env['PUBLIC_URL'] as string);

		return redirectDomain === publicDomain;
	} catch {
		// must be a relative path
		return true;
	}
}
