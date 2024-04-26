import { useEnv } from '@directus/env';
import { InvalidPayloadError } from '@directus/errors';
import type { RequestHandler } from 'express';

/**
 * Try to extract access token from
 *
 * - 'access_token' query parameter
 * - 'Authorization' header
 * - Session cookie
 *
 * and store it under req.token
 */
const extractToken: RequestHandler = (req, _res, next) => {
	const env = useEnv();

	req.token = null;

	if (req.query['access_token'] && typeof req.query['access_token'] === 'string') {
		req.token = req.query['access_token'];
		req.tokenSource = 'query';
	}

	if (req.headers.authorization) {
		const parts = req.headers.authorization.split(' ');
		const [scheme, token] = parts;

		if (parts.length === 2 && scheme?.toLowerCase() === 'bearer' && token) {
			if (req.token !== null) {
				/*
				 * RFC6750 compliance (https://datatracker.ietf.org/doc/html/rfc6750#section-2)
				 * > Clients MUST NOT use more than one method to transmit the token in each request.
				 */
				throw new InvalidPayloadError({
					reason: 'The request uses more than one method for including an access token',
				});
			}

			req.token = token;
			req.tokenSource = 'header';
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
		if (req.token === null) {
			req.token = req.cookies[env['SESSION_COOKIE_NAME'] as string];
			req.tokenSource = 'cookie';
		}
	}

	next();
};

export default extractToken;
