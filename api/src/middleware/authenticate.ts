import { RequestHandler } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import isJWT from '../utils/is-jwt';
import database from '../database';
import asyncHandler from 'express-async-handler';
import { InvalidCredentialsException } from '../exceptions';

/**
 * Verify the passed JWT and assign the user ID and role to `req`
 */
const authenticate: RequestHandler = asyncHandler(async (req, res, next) => {
	req.accountability = {
		user: null,
		role: null,
		admin: false,
		ip: req.ip,
		userAgent: req.get('user-agent'),
	};

	if (!req.token) return next();

	if (isJWT(req.token)) {
		let payload: { id: string };

		try {
			payload = jwt.verify(req.token, process.env.SECRET as string) as { id: string };
		} catch (err) {
			if (err instanceof TokenExpiredError) {
				throw new InvalidCredentialsException('Token expired.');
			} else {
				throw err;
			}
		}

		const user = await database
			.select('role', 'directus_roles.admin')
			.from('directus_users')
			.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
			.where({ 'directus_users.id': payload.id })
			.first();

		/** @TODO verify user status */

		req.accountability.user = payload.id;
		req.accountability.role = user.role;
		req.accountability.admin = user.admin === true || user.admin == 1;

		return next();
	}

	/**
	 * @TODO
	 * Implement static tokens
	 *
	 * @NOTE
	 * We'll silently ignore wrong tokens. This makes sure we prevent brute-forcing static tokens
	 */
	return next();
});

export default authenticate;
