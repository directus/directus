import type { Request } from 'express';
import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { useLogger } from '../logger/index.js';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';

/**
 * Validate if an origin is allowed for dynamic Auth redirect URIs
 * @param req Express request object
 * @param context Context for logging (e.g. 'OAuth2', 'OpenID')
 * @returns The validated origin URL if allowed, undefined if AUTH_ALLOWED_DOMAINS is not set
 * @throws {InvalidPayloadError} If the origin URL is malformed
 * @throws {ForbiddenError} If the origin is not in AUTH_ALLOWED_DOMAINS
 */
export function validateAuthOrigin(req: Request, context: string): string | undefined {
	const originUrl = `${req.protocol}://${req.get('host')}`;
	const env = useEnv();
	const logger = useLogger();
	const allowedDomains = env['AUTH_ALLOWED_DOMAINS'];

	// Legacy mode use PUBLIC_URL
	if (!allowedDomains) return;

	let origin: URL;

	try {
		origin = new URL(originUrl);
	} catch {
		throw new InvalidPayloadError({ reason: `Invalid origin URL: ${originUrl}` });
	}

	const allowedOrigins = toArray(allowedDomains as string)
		.map((domain) => {
			try {
				return new URL(domain).origin;
			} catch {
				logger.warn(`[${context}] Invalid domain in AUTH_ALLOWED_DOMAINS: ${domain}`);
				return;
			}
		})
		.filter((o): o is string => o !== undefined);

	if (allowedOrigins.includes(origin.origin)) return originUrl;
	throw new ForbiddenError({ reason: `Domain ${originUrl} is not allowed` });
}
