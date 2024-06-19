import type { PrimaryKey } from '@directus/types';
import type { Knex } from 'knex';

export interface FetchAccessRolesOptions {
	adminRoles: Set<string>;
	appRoles: Set<string>;
	excludeRoles?: PrimaryKey[];
}

/**
 * Return a set of roles that allow app or admin access, if itself or any of its parents do
 */
export async function fetchAccessRoles(options: FetchAccessRolesOptions, context: { knex: Knex }) {
	// Only fetch the roles that have a parent, as otherwise those roles should already be included in at least one of the input set
	const allChildRoles = await context.knex
		.select<{ id: string; parent: string }[]>('id', 'parent')
		.from('directus_roles')
		.whereNotNull('parent')
		.whereNotIn('id', options.excludeRoles ?? []);

	const adminRoles = new Set<string>(options.adminRoles);
	const appRoles = new Set<string>(options.appRoles);
	const remainingRoles = new Set(allChildRoles);
	let hasChanged = remainingRoles.size > 0;

	// This loop accounts for the undefined order in which the roles are returned, as there is the possibility
	// of a role parent not being in the set of roles yet, so we need to iterate over the roles multiple times
	// until no further roles are added to the sets
	while (hasChanged) {
		hasChanged = false;

		for (const role of remainingRoles) {
			if (adminRoles.has(role.parent)) {
				adminRoles.add(role.id);
				remainingRoles.delete(role);
				hasChanged = true;
			}

			if (appRoles.has(role.parent)) {
				appRoles.add(role.id);
				remainingRoles.delete(role);
				hasChanged = true;
			}
		}
	}

	return {
		adminRoles,
		appRoles,
	};
}
