import type { PrimaryKey } from '@directus/types';
import type { Knex } from 'knex';

export interface AccessLookup {
	role: string | null;
	user: string | null;
	app_access: boolean | number;
	admin_access: boolean | number;
}

export interface FetchAccessLookupOptions {
	excludeAccessRows?: PrimaryKey[];
	excludePolicies?: PrimaryKey[];
	excludeUsers?: PrimaryKey[];
	excludeRoles?: PrimaryKey[];
	adminOnly?: boolean;
	knex: Knex;
}

export async function fetchAccessLookup(options: FetchAccessLookupOptions): Promise<AccessLookup[]> {
	let query = options.knex
		.select(
			'directus_access.role',
			'directus_access.user',
			'directus_policies.app_access',
			'directus_policies.admin_access',
		)
		.from('directus_access')
		.leftJoin('directus_policies', 'directus_access.policy', 'directus_policies.id');

	if (options.excludeAccessRows && options.excludeAccessRows.length > 0) {
		query = query.whereNotIn('directus_access.id', options.excludeAccessRows);
	}

	if (options.excludePolicies && options.excludePolicies.length > 0) {
		query = query.whereNotIn('directus_access.policy', options.excludePolicies);
	}

	if (options.excludeUsers && options.excludeUsers.length > 0) {
		query = query.where((q) =>
			q.whereNotIn('directus_access.user', options.excludeUsers!).orWhereNull('directus_access.user'),
		);
	}

	if (options.excludeRoles && options.excludeRoles.length > 0) {
		query = query.where((q) =>
			q.whereNotIn('directus_access.role', options.excludeRoles!).orWhereNull('directus_access.role'),
		);
	}

	if (options.adminOnly) {
		query = query.where('directus_policies.admin_access', 1);
	}

	return query;
}
