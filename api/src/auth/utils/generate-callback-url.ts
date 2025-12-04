import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { Url } from '../../utils/url.js';

/**
 * Find matching origin from AUTH_ALLOWED_ORIGINS
 * Matches on protocol + hostname, returns full URL with subpath if found
 */
function findMatchingOrigin(requestOrigin: string, allowedOrigins: string[]): string | null {
	for (const allowedOrigin of allowedOrigins) {
		if (!URL.canParse(allowedOrigin)) continue;

		const { protocol, hostname } = new URL(allowedOrigin);
		const allowedOriginBase = `${protocol}//${hostname}`;

		// Match on protocol + hostname
		if (requestOrigin === allowedOriginBase) {
			return allowedOrigin; // Return full URL with subpath
		}
	}

	return null;
}

/**
 * Generate callback URL for OAuth provider
 *
 * Uses AUTH_ALLOWED_ORIGINS to find matching origin with subpath support.
 * Falls back to PUBLIC_URL for backward compatibility.
 *
 * @param providerName OAuth provider name
 * @param requestOrigin Origin of the request (protocol + host)
 * @returns Callback URL
 */
export function generateCallbackUrl(providerName: string, requestOrigin: string): string {
	const env = useEnv();
	const publicUrl = env['PUBLIC_URL'] as string;

	const allowedOrigins = env['AUTH_ALLOWED_ORIGINS']
		? toArray(env['AUTH_ALLOWED_ORIGINS'] as string)
		: [];

	const matchedOrigin = findMatchingOrigin(requestOrigin, allowedOrigins);

	// Use matched origin or fallback to PUBLIC_URL for backward compatibility
	return new Url(matchedOrigin || publicUrl).addPath('auth', 'login', providerName, 'callback').toString();
}
