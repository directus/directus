import { useEnv } from '@directus/env';
import { InvalidPayloadError } from '@directus/errors';
import type { RequestHandler } from 'express';

/**
 * Extract access token from
 *
 * - 'access_token' query parameter
 * - 'Authorization' header
 * - Session cookie
 *
 * and store it under req.token
 */
const extractToken: RequestHandler = (req, _res, next) => {
	const env = useEnv();

	let token: string | null = null;

	if (req.query && req.query['access_token']) {
		token = req.query['access_token'] as string;
	}

	if (req.headers && req.headers.authorization) {
		const parts = req.headers.authorization.split(' ');

		if (parts.length === 2 && parts[0]!.toLowerCase() === 'bearer') {
			if (token !== null) {
				/*
				 * RFC6750 compliance (https://datatracker.ietf.org/doc/html/rfc6750#section-2)
				 * > Clients MUST NOT use more than one method to transmit the token in each request.
				 */
				throw new InvalidPayloadError({
					reason: 'The request uses more than one method for including an access token',
				});
			}

			token = parts[1]!;
		}
	}

	if (req.cookies && req.cookies[env['SESSION_COOKIE_NAME'] as string]) {
		/*
		 * Exclude session cookie from "RFC6750 multi auth method" rule, e.g.
		 * - allow using a different token to perform requests from within the Data Studio (static token in WYSIWYG interface / Extensions)
		 * - to not break external apps running under the same domain as the Data Studio while using a different method
		 */
		if (token === null) {
			token = req.cookies[env['SESSION_COOKIE_NAME'] as string];
		}
	}

	req.token = token;
	next();
};

export default extractToken;
