import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { useLogger } from '../logger/index.js';
import { Url } from './url.js';
import type { Request } from 'express';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';

/**
 * Find matching callback URL from origin URLœ
 *
 * @param redirectUris Pre-validated array of redirect URIs
 * @param originUrl Origin URL
 * @returns Matching callback URL string
 */
export function getCallbackFromOriginUrl(redirectUris: URL[], originUrl?: string): URL | undefined {
	if (!originUrl) return redirectUris[0];

	const callback = redirectUris.find((uri) => uri.origin === originUrl);

	if (!callback) {
		throw new ForbiddenError({ reason: `No matching callback URL found for ${originUrl}` });
	}

	return callback;
}

/**
 * Find matching callback URL from request
 *
 * @param req Express request object
 * @param redirectUris Pre-validated array of redirect URIs
 * @param context Logging context (e.g. 'OAuth2', 'OpenID')
 * @returns Matching callback URL string
 */
export function getCallbackFromRequest(req: Request, redirectUris: URL[], context: string): URL | undefined {
	const logger = useLogger();

	const originUrl = `${req.protocol}://${req.hostname}`;

	let origin: URL;

	try {
		origin = new URL(originUrl);
	} catch {
		logger.warn(`[${context}] Invalid origin from request: ${originUrl}`);
		throw new InvalidPayloadError({ reason: 'Invalid origin URL' });
	}

	logger.debug(`[${context}] Request origin: ${origin.origin}`);
	return getCallbackFromOriginUrl(redirectUris, origin.origin);
}

/**
 * Get callback URL from origin URL
 *
 * @param originUrl Origin URL
 * @param providerName OAuth provider name
 * @returns Url
 */
export function getCallbackUrlFromOriginUrl(originUrl: string, providerName: string): Url {
	return new Url(originUrl).addPath('auth', 'login', providerName, 'callback');
}

/**
 * Generate all possible redirect URIs for OAuth client registration
 *
 * @param providerName OAuth provider name
 * @param context Logging context (e.g. 'OAuth2', 'OpenID')
 * @returns Array of redirect URLs
 */
export function generateRedirectUrls(providerName: string, context: string): URL[] {
	const env = useEnv();
	const logger = useLogger();
	const callbacksSet = new Set<string>();
	const envKey = `AUTH_${providerName.toUpperCase()}_REDIRECT_ALLOW_LIST`;

	if (envKey in env) {
		toArray(env[envKey] as string).forEach((domain) => {
			try {
				const url = new URL(domain);
				const domainCallback = getCallbackUrlFromOriginUrl(url.origin, providerName).toString();
				callbacksSet.add(domainCallback);
			} catch {
				logger.warn(`[${context}] Invalid domain in ${envKey}: ${domain}`);
			}
		});
	}

	return Array.from(callbacksSet).map((uri) => new URL(uri));
}
