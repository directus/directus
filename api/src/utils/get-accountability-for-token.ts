import { useEnv } from '@directus/env';
import { InvalidCredentialsError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import getDatabase from '../database/index.js';
import isDirectusJWT from './is-directus-jwt.js';
import { verifySessionJWT } from './verify-session-jwt.js';
import { verifyAccessJWT } from './jwt.js';

/**
 * Get accountability for JWT or static token.
 */
export async function getAccountabilityForToken(
	token?: string | null,
	accountability?: Accountability,
): Promise<Accountability> {
	const env = useEnv();

	accountability ??= {
		user: null,
		role: null,
		admin: false,
		app: false,
	};

	if (token) {
		if (isDirectusJWT(token)) {
			const payload = verifyAccessJWT(token, env['SECRET'] as string);

			if ('session' in payload) {
				await verifySessionJWT(payload);
			}

			const { role, admin_access, app_access, id, share, share_scope } = payload;

			Object.assign(accountability, {
				role,
				admin: admin_access === true || admin_access == 1,
				app: app_access === true || app_access == 1,
				...(id && { user: id }),
				...(share && { share }),
				...(share_scope && { share_scope }),
			});
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
				throw new InvalidCredentialsError();
			}

			const { id, role, admin_access, app_access } = user;

			Object.assign(accountability, {
				user: id,
				role,
				admin: admin_access === true || admin_access == 1,
				app: app_access === true || app_access == 1,
			});
		}
	}

	return accountability;
}
