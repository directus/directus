import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import isJWT from '../utils/is-jwt';
import database from '../database';

const authenticate: RequestHandler = async (req, res, next) => {
	if (!req.token) return next();

	if (isJWT(req.token)) {
		const payload = jwt.verify(req.token, process.env.SECRET) as { id: string };
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
};

export default authenticate;
