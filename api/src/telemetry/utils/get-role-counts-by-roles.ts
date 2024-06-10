import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import type { UserCount } from '../../utils/fetch-user-count/fetch-user-count.js';

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

	for (const role of result) {
		const adminAccess = toBoolean(role.admin_access);
		const appAccess = toBoolean(role.app_access);

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
