import { filterItems } from '../../utils/filter-items.js';
import { appAccessMinimalPermissions } from '@directus/system-data';
import type { Accountability, Permission, Query } from '@directus/types';
import { cloneDeep } from 'lodash-es';

export function withAppMinimalPermissions(
	accountability: Pick<Accountability, 'app'> | null,
	permissions: Permission[],
	filter: Query['filter'],
): Permission[] {
	if (accountability?.app === true) {
		const filteredAppMinimalPermissions = cloneDeep(filterItems(appAccessMinimalPermissions, filter));
		return [...permissions, ...filteredAppMinimalPermissions];
	}

	return permissions;
}
