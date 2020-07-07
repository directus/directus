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
	/** @todo base this on a validation middleware on permissions */
	if (!req.token) return next();

	if (isJWT(req.token)) {
		let payload: { id: string };

		try {
			payload = jwt.verify(req.token, process.env.SECRET) as { id: string };
		} catch (err) {
			if (err instanceof TokenExpiredError) {
				throw new InvalidCredentialsException('Token expired.');
			} else {
				throw err;
			}
		}

		const user = await database
			.select('role')
			.from('directus_users')
			.where({ id: payload.id })
			.first();

		/** @TODO verify user status */
		req.user = payload.id;
		req.role = user.role;
		return next();
	}

	/**
	 * @TODO
	 * Implement static tokens
	 *
	 * We'll silently ignore wrong tokens. This makes sure we prevent brute-forcing static tokens
	 */
	return next();
});

export default authenticate;
