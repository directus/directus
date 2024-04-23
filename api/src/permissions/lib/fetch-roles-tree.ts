import type { RolesService } from '../../services/roles.js';
import { useCache } from '../cache.js';
import { getRolesCacheKey } from '../utils/get-roles-cache-key.js';

export async function fetchRolesTree(service: RolesService, start: string | null): Promise<string[]> {
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
		const role = (await service.readOne(start, {
			fields: ['id', 'parent'],
		})) as { id: string; parent: string | null };

		roles.push(role.id);
		parent = role.parent;
	}

	roles.reverse();

	cache.set(cacheKey, roles);

	return roles;
}
