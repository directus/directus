import { RequestHandler } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import getDatabase from '../database';
import env from '../env';
import { InvalidCredentialsException } from '../exceptions';
import { DirectusTokenPayload } from '../types';
import asyncHandler from '../utils/async-handler';
import { getIPFromReq } from '../utils/get-ip-from-req';
import isDirectusJWT from '../utils/is-directus-jwt';

/**
 * Verify the passed JWT and assign the user ID and role to `req`
 */
const authenticate: RequestHandler = asyncHandler(async (req, res, next) => {
	req.accountability = {
		user: null,
		role: null,
		admin: false,
		app: false,
		ip: getIPFromReq(req),
		userAgent: req.get('user-agent'),
	};

	const database = getDatabase();

	if (req.token) {
		if (isDirectusJWT(req.token)) {
			let payload: DirectusTokenPayload;

			try {
				payload = jwt.verify(req.token, env.SECRET as string, { issuer: 'directus' }) as DirectusTokenPayload;
			} catch (err: any) {
				if (err instanceof TokenExpiredError) {
					throw new InvalidCredentialsException('Token expired.');
				} else if (err instanceof JsonWebTokenError) {
					throw new InvalidCredentialsException('Token invalid.');
				} else {
					throw err;
				}
			}

			req.accountability.share = payload.share;
			req.accountability.share_scope = payload.share_scope;
			req.accountability.user = payload.id;
			req.accountability.role = payload.role;
			req.accountability.admin = payload.admin_access === true || payload.admin_access == 1;
			req.accountability.app = payload.app_access === true || payload.app_access == 1;
		} else {
			// Try finding the user with the provided token
			const user = await database
				.select('directus_users.id', 'directus_users.role', 'directus_roles.admin_access', 'directus_roles.app_access')
				.from('directus_users')
				.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
				.where({
					'directus_users.token': req.token,
					status: 'active',
				})
				.first();

			if (!user) {
				throw new InvalidCredentialsException();
			}

			req.accountability.user = user.id;
			req.accountability.role = user.role;
			req.accountability.admin = user.admin_access === true || user.admin_access == 1;
			req.accountability.app = user.app_access === true || user.app_access == 1;
		}
	}

	return next();
});

export default authenticate;
