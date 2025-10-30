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
	const env = useEnv();
	const logger = useLogger();

	// Read host: use X-Forwarded-Host only if behind trusted proxy
	const host = env['IP_TRUST_PROXY'] ? req.get('x-forwarded-host') || req.get('host') : req.get('host');
	const protocol = env['IP_TRUST_PROXY'] ? req.get('x-forwarded-proto') || req.protocol : req.protocol;

	const originUrl = `${protocol}://${host}`;

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
				const domainCallback = new Url(url.origin).addPath('auth', 'login', providerName, 'callback').toString();
				callbacksSet.add(domainCallback);
			} catch {
				logger.warn(`[${context}] Invalid domain in ${envKey}: ${domain}`);
			}
		});
	}

	return Array.from(callbacksSet).map((uri) => new URL(uri));
}
