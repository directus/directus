import type { Knex } from 'knex';
import { useCache } from '../cache.js';

export async function fetchRolesTree(knex: Knex, start: string | null): Promise<string[]> {
	if (!start) return [];

	const cacheKey = getRolesCacheKey(start);

	const cache = useCache();
	const cachedRoles = await cache.get<string[]>(cacheKey);

	if (cachedRoles) {
		return cachedRoles;
	}

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

	cache.set(cacheKey, roles);

	return roles;
}

export function getRolesCacheKey(role: string) {
	return `roles-tree-${role}`;
}
