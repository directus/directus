import { appAccessMinimalPermissions } from '@directus/system-data';
import type { Accountability, Permission, Query } from '@directus/types';
import { filterItems } from '../../../utils/filter-items.js';
import { mergePermissions } from '../../../utils/merge-permissions.js';

export function withAppMinimalPermissions(
	accountability: Accountability | null,
	permissions: Permission[],
	filter: Query['filter'],
): Permission[] {
	if (accountability?.app === true) {
		const filteredAppMinimalPermissions = filterItems(
			appAccessMinimalPermissions.map((permission) => ({
				...permission,
				role: accountability.role,
			})),
			filter,
		);

		return mergePermissions('or', permissions, filteredAppMinimalPermissions);
	}

	return permissions;
}
