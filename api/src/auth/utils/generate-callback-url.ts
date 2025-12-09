import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { Url } from '../../utils/url.js';

/**
 * Find matching origin from request
 * @param requestOrigin - The origin of the request
 * @param allowedOrigins - The allowed origins from AUTH_ALLOWED_ORIGINS
 * @returns The matching origin or null
 */
function findMatchingOrigin(requestOrigin: string, allowedOrigins: string[]): string | null {
	for (const allowedOrigin of allowedOrigins) {
		if (!URL.canParse(allowedOrigin)) continue;

		const { protocol, host } = new URL(allowedOrigin);
		const allowedOriginBase = `${protocol}//${host}`;

		if (requestOrigin === allowedOriginBase) {
			return allowedOrigin;
		}
	}

	return null;
}

/**
 * Generate callback URL for SSO providers (OAuth2/OpenID/SAML)
 *
 * Uses AUTH_ALLOWED_ORIGINS to find matching origin with subpath support.
 * Falls back to PUBLIC_URL for backward compatibility.
 *
 * @param providerName SSO provider name
 * @param requestOrigin Origin of the request (protocol + host)
 * @returns Callback URL
 */
export function generateCallbackUrl(providerName: string, requestOrigin: string): string {
	const env = useEnv();
	const publicUrl = env['PUBLIC_URL'] as string;

	const allowedOrigins = env['AUTH_ALLOWED_ORIGINS'] ? toArray(env['AUTH_ALLOWED_ORIGINS'] as string) : [];

	const matchedOrigin = findMatchingOrigin(requestOrigin, allowedOrigins);

	// Use matched origin or fallback to PUBLIC_URL for backward compatibility
	return new Url(matchedOrigin || publicUrl).addPath('auth', 'login', providerName, 'callback').toString();
}
