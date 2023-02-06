import type { Accountability } from '@directus/shared/types';
import jwt from 'jsonwebtoken';
import getDatabase from '../database';
import env from '../env';
import { InvalidCredentialsException } from '../exceptions';
import type { DirectusTokenPayload } from '../types';
import isDirectusJWT from '../utils/is-directus-jwt';

const { JsonWebTokenError, TokenExpiredError } = jwt;

export async function getAccountabilityForToken(token?: string | null): Promise<Accountability> {
	const database = getDatabase();

	const accountability: Accountability = {
		user: null,
		role: null,
		admin: false,
		app: false,
	};

	if (token) {
		if (isDirectusJWT(token)) {
			let payload: DirectusTokenPayload;

			try {
				payload = jwt.verify(token, env['SECRET'] as string, { issuer: 'directus' }) as DirectusTokenPayload;
			} catch (err: any) {
				if (err instanceof TokenExpiredError) {
					throw new InvalidCredentialsException('Token expired.');
				} else if (err instanceof JsonWebTokenError) {
					throw new InvalidCredentialsException('Token invalid.');
				} else {
					throw err;
				}
			}

			if (payload.share) accountability.share = payload.share;
			if (payload.share_scope) accountability.share_scope = payload.share_scope;
			if (payload.id) accountability.user = payload.id;
			accountability.role = payload.role;
			accountability.admin = payload.admin_access === true || payload.admin_access == 1;
			accountability.app = payload.app_access === true || payload.app_access == 1;
		} else {
			// Try finding the user with the provided token
			const user = await database
				.select('directus_users.id', 'directus_users.role', 'directus_roles.admin_access', 'directus_roles.app_access')
				.from('directus_users')
				.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
				.where({
					'directus_users.token': token,
					status: 'active',
				})
				.first();

			if (!user) {
				throw new InvalidCredentialsException();
			}

			accountability.user = user.id;
			accountability.role = user.role;
			accountability.admin = user.admin_access === true || user.admin_access == 1;
			accountability.app = user.app_access === true || user.app_access == 1;
		}
	}

	return accountability;
}
