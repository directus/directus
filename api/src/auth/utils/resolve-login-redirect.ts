import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import isUrlAllowed from '../../utils/is-url-allowed.js';

/**
 * Resolves and validates the redirect URL after a successful SSO login.
 * Returns a safe redirect path or URL, or throws if the redirect is invalid or not allowed.
 * @param redirect URL or relative path to redirect to after login
 * @param opts.provider SSO provider name, used to check provider-specific allow lists
 * @returns Resolved redirect path or URL string
 * @throws If the redirect is not a string, PUBLIC_URL is not defined, or the redirect is not allowed
 */
export function resolveLoginRedirect(redirect: unknown, opts: { provider?: string } = {}) {
	const env = useEnv();
	const publicURL = env['PUBLIC_URL'] as string;

	// Default empty redirect to root
	if (!redirect) return '/';

	if (typeof redirect !== 'string') throw new Error('"redirect" must be a string');

	if (!publicURL) throw new Error('"PUBLIC_URL" must be defined');

	// Relative URL
	if (URL.canParse(redirect) === false) {
		try {
			const { protocol: dummyProtocol, host: dummyHost } = new URL('http://dummy.local');
			const parsedRelativeURL = new URL(redirect, publicURL);

			if (dummyProtocol !== parsedRelativeURL.protocol || dummyHost !== parsedRelativeURL.host) {
				throw new Error('Relative URL mismatch');
			}

			// If the protocol & host match then it is a safe relative path
			return parsedRelativeURL.toString().replace(publicURL, '');
		} catch {
			// Unparsable URL
			throw new Error('Invalid relative URL');
		}
	}

	if (opts.provider) {
		const envKey = `AUTH_${opts.provider.toUpperCase()}_REDIRECT_ALLOW_LIST`;

		if (envKey in env) {
			const allowedList = toArray(String(env[envKey]));
			allowedList.push(publicURL);

			if (isUrlAllowed(redirect, allowedList)) {
				return new URL(redirect).toString();
			}
		}
	}

	if (URL.canParse(publicURL) === false) throw new Error('PUBLIC_URL must be a valid URL');

	const { protocol: publicProtocol, host: publicHost } = new URL(publicURL);
	const parsedAbsoluteURL = new URL(redirect);

	// Reject "app" redirects not matching PUBLIC_URL
	if (publicProtocol !== parsedAbsoluteURL.protocol || publicHost !== parsedAbsoluteURL.host) {
		throw new Error('App "redirect" must match PUBLIC_URL');
	}

	return parsedAbsoluteURL.toString();
}
