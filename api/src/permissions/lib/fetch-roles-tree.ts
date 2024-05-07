import type { Knex } from 'knex';
import { withCache } from '../utils/with-cache.js';

export const fetchRolesTree = withCache('roles-tree', _fetchRolesTree);

export async function _fetchRolesTree(start: string | null, knex: Knex): Promise<string[]> {
	if (!start) return [];

	let parent: string | null = start;
	const roles: string[] = [];

	while (parent) {
		const role: { id: string; parent: string | null } = await knex
			.select('id', 'parent')
			.from('directus_roles')
			.where({ id: start })
			.first();

		// TODO infinite loop through recursive parent prevention
		// might be as easy as checking here if roles already contains role we're about to add

		roles.push(role.id);
		parent = role.parent;
	}

	roles.reverse();

	return roles;
}
