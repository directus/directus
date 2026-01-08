import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { Url } from '../../utils/url.js';

/**
 * Find matching public URL from request origin
 * @param requestOrigin - The origin of the request
 * @param allowedPublicUrls - The allowed public URLs from AUTH_ALLOWED_PUBLIC_URLS
 * @returns The matching public URL
 */
function findMatchingPublicUrl(requestOrigin: string, allowedPublicUrls: string[]): string | null {
	for (const allowedUrl of allowedPublicUrls) {
		if (!URL.canParse(allowedUrl)) continue;

		const { protocol, host } = new URL(allowedUrl);
		const allowedUrlOrigin = `${protocol}//${host}`;

		if (requestOrigin === allowedUrlOrigin) {
			return allowedUrl;
		}
	}

	return null;
}

/**
 * Dynamically generate the callback URL for OAuth2/OpenID SSO providers
 *
 * Uses AUTH_ALLOWED_PUBLIC_URLS to find an alternate PUBLIC_URL based on the origins protocol and host.
 * Defaults to the PUBLIC_URL if no match is found.
 *
 * @param providerName SSO provider name
 * @param requestOrigin Origin of the request (protocol + host)
 * @returns Callback URL
 */
export function generateCallbackUrl(providerName: string, requestOrigin: string): string {
	const env = useEnv();
	const publicUrl = env['PUBLIC_URL'] as string;

	const allowedPublicUrls = env['AUTH_ALLOWED_PUBLIC_URLS'] ? toArray(env['AUTH_ALLOWED_PUBLIC_URLS'] as string) : [];

	const matchedUrl = findMatchingPublicUrl(requestOrigin, allowedPublicUrls);

	// Use matched public URL or fallback to PUBLIC_URL for backward compatibility
	return new Url(matchedUrl || publicUrl).addPath('auth', 'login', providerName, 'callback').toString();
}
