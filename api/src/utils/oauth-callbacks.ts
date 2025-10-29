import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { useLogger } from '../logger/index.js';
import { Url } from './url.js';
import type { Request } from 'express';
import { InvalidPayloadError } from '@directus/errors';

/**
 * Find matching callback URL from origin URL
 *
 * @param redirectUris Pre-validated array of redirect URIs
 * @param originUrl Origin URL
 * @returns Matching callback URL string
 */
export function getCallbackFromOriginUrl(redirectUris: URL[], originUrl?: string): URL {
	// If originUrl is not provided, it's legacy mode (no AUTH_ALLOWED_DOMAINS) -> use PUBLIC_URL
	if (!originUrl) return redirectUris[0]!;

	return redirectUris.find((uri) => uri.origin === originUrl) ?? redirectUris[0]!;
}

/**
 * Find matching callback URL from request
 *
 * @param req Express request object
 * @param redirectUris Pre-validated array of redirect URIs
 * @param context Logging context (e.g. 'OAuth2', 'OpenID')
 * @returns Matching callback URL string
 */
export function getCallbackFromRequest(req: Request, redirectUris: URL[], context: string): URL {
	const logger = useLogger();

	const originUrl = `${req.protocol}://${req.get('host')}`;
	let origin: URL;

	try {
		origin = new URL(originUrl);
	} catch {
		logger.warn(`[${context}] Invalid origin from request: ${originUrl}`);
		throw new InvalidPayloadError({ reason: 'Invalid origin URL' });
	}

	return getCallbackFromOriginUrl(redirectUris, origin.origin);
}

/**
 * Generate all possible redirect URIs for OAuth client registration
 * Includes PUBLIC_URL + all domains from AUTH_ALLOWED_DOMAINS
 *
 * @param providerName OAuth provider name
 * @param context Logging context (e.g. 'OAuth2', 'OpenID')
 * @returns Array of redirect URLs
 */
export function generateRedirectUrls(providerName: string, context: string): URL[] {
	const env = useEnv();
	const logger = useLogger();
	const redirectUris: URL[] = [];

	// Always include PUBLIC_URL
	const publicUrlCallback = new Url(env['PUBLIC_URL'] as string)
		.addPath('auth', 'login', providerName, 'callback')
		.toString();

	redirectUris.push(new URL(publicUrlCallback));

	toArray(env['AUTH_ALLOWED_DOMAINS'] as string).forEach((domain) => {
		try {
			const domainCallback = new Url(domain).addPath('auth', 'login', providerName, 'callback').toString();
			redirectUris.push(new URL(domainCallback));
		} catch {
			logger.warn(`[${context}] Invalid domain in AUTH_ALLOWED_DOMAINS: ${domain}`);
		}
	});

	return redirectUris;
}
