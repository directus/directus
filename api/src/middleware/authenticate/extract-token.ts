import { useEnv } from '@directus/env';
import { InvalidPayloadError } from '@directus/errors';
import type { Request } from 'express';

/**
 * Try to extract access token from request via
 *
 * - 'access_token' query parameter
 * - 'Authorization' header
 * - Session cookie
 */
export function extractToken(req: Request) {
	const env = useEnv();

	let token: string | null = null;
	let source: 'query' | 'header' | 'cookie' | null = null;

	if (req.query['access_token'] && typeof req.query['access_token'] === 'string') {
		token = req.query['access_token'];
		source = 'query';
	}

	if (req.headers.authorization) {
		const parts = req.headers.authorization.split(' ');
		const [scheme, param] = parts;

		if (parts.length === 2 && scheme?.toLowerCase() === 'bearer' && param) {
			if (token) {
				/*
				 * RFC6750 compliance (https://datatracker.ietf.org/doc/html/rfc6750#section-2)
				 * > Clients MUST NOT use more than one method to transmit the token in each request.
				 */
				throw new InvalidPayloadError({
					reason: 'The request uses more than one method for including an access token',
				});
			}

			token = param;
			source = 'header';
		}
	}

	if (req.cookies[env['SESSION_COOKIE_NAME'] as string]) {
		/*
		 * Exclude session cookie from "RFC6750 multi auth method" rule
		 * - to allow using a different token to perform requests from within the Data Studio
		 *   (static token in WYSIWYG interface / Extensions)
		 * - to not break external apps running under the same domain as the Data Studio
		 *   while using a different method
		 */
		if (!token) {
			token = req.cookies[env['SESSION_COOKIE_NAME'] as string];
			source = 'cookie';
		}
	}

	return { token, source };
}
