import { RequestHandler } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import getDatabase from '../database';
import env from '../env';
import { InvalidCredentialsException } from '../exceptions';
import asyncHandler from '../utils/async-handler';
import isJWT from '../utils/is-jwt';

/**
 * Verify the passed JWT and assign the user ID and role to `req`
 */
const authenticate: RequestHandler = asyncHandler(async (req, res, next) => {
	const allowedHeaders = ((env.HEADERS_DYNAMIC_VARIABLES as string) ?? '').toLowerCase().split(',');

	const headers: Record<string, unknown> = {};

	for (const header of allowedHeaders) {
		const value = req.get('x-directus-' + header);
		if (value) {
			const normalizedHeaderName = header.toUpperCase().replace(/-/gm, '_');
			headers[normalizedHeaderName] = value;
		}
	}

	req.accountability = {
		user: null,
		role: null,
		admin: false,
		app: false,
		ip: req.ip.startsWith('::ffff:') ? req.ip.substring(7) : req.ip,
		userAgent: req.get('user-agent'),
		headers,
	};

	if (!req.token) return next();

	const database = getDatabase();

	if (isJWT(req.token)) {
		let payload: { id: string; organism?: string | null };

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
			.select('role', 'directus_roles.admin_access', 'directus_roles.app_access')
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

		if (env.SAAS_MODE) {
			req.accountability.organism = payload.organism;

			if (payload.organism) {
				const userOrganism = await database
					.select('role')
					.from('directus_organisms_users')
					.leftJoin('directus_roles', 'directus_organisms_users.role', 'directus_roles.id')
					.where({
						'directus_organisms_users.user': payload.id,
						'directus_organisms_users.organism': payload.organism,
						status: 'active',
					})
					.first();

				if (!userOrganism) {
					throw new InvalidCredentialsException();
				}

				req.accountability.role = userOrganism.role;
			}
		} else {
			req.accountability.role = user.role;
		}

		req.accountability.user = payload.id;
		req.accountability.admin = user.admin_access === true || user.admin_access == 1;
		req.accountability.app = user.app_access === true || user.app_access == 1;
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

	return next();
});

export default authenticate;
