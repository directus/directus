import { appAccessMinimalPermissions } from '@directus/system-data';
import type { Accountability, Permission, Query } from '@directus/types';
import { filterItems } from '../../../utils/filter-items.js';

export function withAppMinimalPermissions(
	accountability: Accountability | null,
	permissions: Permission[],
	filter: Query['filter'],
): Permission[] {
	if (accountability?.app === true) {
		const filteredAppMinimalPermissions = filterItems(appAccessMinimalPermissions, filter);

		// TODO typescript shenanigans
		return [...permissions, ...filteredAppMinimalPermissions];
	}

	return permissions;
}
