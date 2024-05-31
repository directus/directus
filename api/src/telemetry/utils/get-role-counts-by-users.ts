import type { PrimaryKey } from '@directus/types';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import type { AccessTypeCount } from './get-user-count.js';

type CountOptions = {
	inactiveUsers?: boolean;
};

/**
 * Get the role type counts by user IDs
 */
export async function getRoleCountsByUsers(
	db: Knex,
	userIds: PrimaryKey[],
	options: CountOptions = {},
): Promise<AccessTypeCount> {
	const counts: AccessTypeCount = {
		admin: 0,
		app: 0,
		api: 0,
	};

	const result = <{ count: number | string; admin_access: number | boolean; app_access: number | boolean }[]>await db
		.count('directus_users.id', { as: 'count' })
		.select('directus_roles.admin_access', 'directus_roles.app_access')
		.from('directus_users')
		.whereIn('directus_users.id', userIds)
		.andWhere('directus_users.status', options.inactiveUsers ? '!=' : '=', 'active')
		.leftJoin('directus_roles', 'directus_users.role', '=', 'directus_roles.id')
		.groupBy('directus_roles.admin_access', 'directus_roles.app_access');

	for (const record of result) {
		const adminAccess = toBoolean(record.admin_access);
		const appAccess = toBoolean(record.app_access);
		const count = Number(record.count);

		if (adminAccess) {
			counts.admin += count;
		} else if (appAccess) {
			counts.app += count;
		} else {
			counts.api += count;
		}
	}

	return counts;
}
