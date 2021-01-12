import { RequestHandler } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import isJWT from '../utils/is-jwt';
import database from '../database';
import asyncHandler from '../utils/async-handler';
import { InvalidCredentialsException } from '../exceptions';
import env from '../env';

/**
 * Verify the passed JWT and assign the user ID and role to `req`
 */
const authenticate: RequestHandler = asyncHandler(async (req, res, next) => {
	req.accountability = {
		user: null,
		role: null,
		admin: false,
		ip: req.ip.startsWith('::ffff:') ? req.ip.substring(7) : req.ip,
		userAgent: req.get('user-agent'),
	};

	if (!req.token) return next();

	if (isJWT(req.token)) {
		let payload: { id: string };

		try {
			payload = jwt.verify(req.token, env.SECRET as string) as { id: string };
		} catch (err) {
			if (err instanceof TokenExpiredError) {
				throw new InvalidCredentialsException('Token expired.');
			} else if (err instanceof JsonWebTokenError) {
				throw new InvalidCredentialsException('Token invalid.');
			} else {
				throw err;
			}
		}

		const user = await database
			.select('role', 'directus_roles.admin_access')
			.from('directus_users')
			.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
			.where({
				'directus_users.id': payload.id,
				status: 'active',
			})
			.first();

		if (!user) {
			throw new InvalidCredentialsException();
		}

		req.accountability.user = payload.id;
		req.accountability.role = user.role;
		req.accountability.admin = user.admin_access === true || user.admin_access == 1;
	} else {
		// Try finding the user with the provided token
		const user = await database
			.select('directus_users.id', 'directus_users.role', 'directus_roles.admin_access')
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
	}

	if (req.accountability?.user) {
		await database('directus_users').update({ last_access: new Date() }).where({ id: req.accountability.user });
	}

	return next();
});

export default authenticate;
