/**
 * Extract access token from:
 *
 * Authorization: Bearer
 * access_token query parameter
 *
 * and store in req.token
 */

import type { RequestHandler } from 'express';
import { InvalidPayloadError } from '@directus/errors';
import { useEnv } from '@directus/env';

const extractToken: RequestHandler = (req, _res, next) => {
	const env = useEnv();

	let token: string | null = null;

	if (req.query && req.query['access_token']) {
		token = req.query['access_token'] as string;
	}

	if (req.cookies && req.cookies[env['SESSION_COOKIE_NAME'] as string]) {
		if (token !== null) {
			// RFC6750 compliance:
			throw new InvalidPayloadError({ reason: 'The request uses more than one method for including an access token' });
		}

		token = req.cookies[env['SESSION_COOKIE_NAME'] as string];
	}

	if (req.headers && req.headers.authorization) {
		const parts = req.headers.authorization.split(' ');

		if (parts.length === 2 && parts[0]!.toLowerCase() === 'bearer') {
			if (token !== null) {
				// RFC6750 compliance:
				throw new InvalidPayloadError({ reason: 'The request uses more than one method for including an access token' });
			}

			token = parts[1]!;
		}
	}

	/**
	 * Look into RFC6750 compliance:
	 * In order to be fully compliant with RFC6750, we have to throw a 400 error when you have the
	 * token in more than 1 place afaik. We also might have to support "access_token" as a post body
	 * key
	 */

	req.token = token;
	next();
};

export default extractToken;
