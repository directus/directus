import getDatabase from '../database/index.js';
import type { Accountability } from '@directus/types';
import isDirectusJWT from './is-directus-jwt.js';
import { InvalidCredentialsException } from '../index.js';
import env from '../env.js';
import { verifyAccessJWT } from './jwt.js';

export async function getAccountabilityForToken(
	token?: string | null,
	accountability?: Accountability
): Promise<Accountability> {
	if (!accountability) {
		accountability = {
			user: null,
			role: null,
			admin: false,
			app: false,
		};
	}

	if (token) {
		if (isDirectusJWT(token)) {
			const payload = verifyAccessJWT(token, env['SECRET'] as string);

			accountability.role = payload.role;
			accountability.admin = payload.admin_access === true || payload.admin_access == 1;
			accountability.app = payload.app_access === true || payload.app_access == 1;

			if (payload.share) accountability.share = payload.share;
			if (payload.share_scope) accountability.share_scope = payload.share_scope;
			if (payload.id) accountability.user = payload.id;
		} else {
			// Try finding the user with the provided token
			const database = getDatabase();

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
