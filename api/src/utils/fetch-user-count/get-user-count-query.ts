import type { PrimaryKey } from '@directus/types';
import type { Knex } from 'knex';

export interface GetUserCountOptions {
	excludeIds?: PrimaryKey[];
	excludeRoles?: PrimaryKey[];
	includeRoles?: PrimaryKey[];
}

export function getUserCountQuery(knex: Knex, options: GetUserCountOptions) {
	// Safety check for an empty list of includeRoles, which would otherwise return all users
	if (options.includeRoles && options.includeRoles.length === 0) {
		return Promise.resolve({ count: 0 });
	}

	let query = knex('directus_users').count({ count: '*' }).as('count').where('status', 'active');

	if (options.excludeIds && options.excludeIds.length > 0) {
		query = query.whereNotIn('id', options.excludeIds);
	}

	if (options.excludeRoles && options.excludeRoles.length > 0) {
		query = query.whereNotIn('role', options.excludeRoles);
	}

	if (options.includeRoles && options.includeRoles.length > 0) {
		query = query.whereIn('role', options.includeRoles);
	}

	return query.first();
}
