import type { Accountability } from '@directus/types';
import { getCache } from '../cache.js';
import getDatabase from '../database/index.js';
import env from '../env.js';
import { InvalidCredentialsError } from '../errors/index.js';
import isDirectusJWT from './is-directus-jwt.js';
import { verifyAccessJWT } from './jwt.js';
import { getMilliseconds } from './get-milliseconds.js';

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
			const { cache } = getCache();
			let user = cache ? await cache.get(`token_access:${token}`) : null;

			if (!user) {
				// Try finding the user with the provided token
				const database = getDatabase();

				user = await database
					.select(
						'directus_users.id',
						'directus_users.role',
						'directus_roles.admin_access',
						'directus_roles.app_access',
						'directus_roles.ip_access',
					)
					.from('directus_users')
					.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
					.where({
						'directus_users.token': token,
						status: 'active',
					})
					.first();

				if (cache) {
					cache.set(`token_access:${token}`, user, getMilliseconds(env['CACHE_ACCESS_TTL']));
				}
			}

			if (!user) {
				throw new InvalidCredentialsError();
			}

			accountability.user = user.id;
			accountability.role = user.role;
			accountability.admin = user.admin_access === true || user.admin_access == 1;
			accountability.app = user.app_access === true || user.app_access == 1;
			accountability.ip_access = user.ip_access || '';
		}
	}

	return accountability;
}
