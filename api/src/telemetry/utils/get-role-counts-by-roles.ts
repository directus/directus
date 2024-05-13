import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import { find } from 'lodash-es';
import { type UserCount } from './get-user-count.js';

/**
 * Get the role type counts by role IDs
 */
export async function getRoleCountsByRoles(db: Knex, roles: string[]): Promise<UserCount> {
	const counts: UserCount = {
		admin: 0,
		app: 0,
		api: 0,
	};

	const result = <{ id: string; admin_access: number | boolean | null; app_access: number | boolean | null }[]>(
		await db.select('id', 'admin_access', 'app_access').from('directus_roles').whereIn('id', roles)
	);

	for (const role of roles) {
		const foundRole = find(result, { id: role });

		if (!foundRole) continue;

		const adminAccess = toBoolean(foundRole.admin_access);
		const appAccess = toBoolean(foundRole.app_access);

		if (adminAccess) {
			counts.admin++;
		} else if (appAccess) {
			counts.app++;
		} else {
			counts.api++;
		}
	}

	return counts;
}
