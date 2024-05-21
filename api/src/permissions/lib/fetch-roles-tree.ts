import type { Knex } from 'knex';
import { withCache } from '../utils/with-cache.js';

export const fetchRolesTree = withCache('roles-tree', _fetchRolesTree);

export async function _fetchRolesTree(start: string | null, knex: Knex): Promise<string[]> {
	if (!start) return [];

	let parent: string | null = start;
	const roles: string[] = [];

	while (parent) {
		const role: { id: string; parent: string | null } | undefined = await knex
			.select('id', 'parent')
			.from('directus_roles')
			.where({ id: parent })
			.first();

		if (!role) {
			break;
		}

		roles.push(role.id);

		// Prevent infinite recursion loops
		if (role.parent && roles.includes(role.parent) === true) {
			roles.reverse();
			const rolesStr = roles.map((role) => `"${role}"`).join('->');
			throw new Error(`Recursion encountered: role "${role.id}" already exists in tree path ${rolesStr}`);
		}

		parent = role.parent;
	}

	roles.reverse();

	return roles;
}
