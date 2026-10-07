import { isSystemCollection } from '@directus/system-data';
import type { Alterations, Permission, PermissionsAction } from '@directus/types';
import { isEmpty } from 'lodash-es';

export interface SystemPermissionChange {
	collection: string;
	action: PermissionsAction;
	unfilteredRead: boolean;
}

/**
 * Returns the created or updated permissions that target a system collection.
 * Deletions are ignored, as they can only reduce access.
 */
export function getSystemPermissionChanges(
	permissions: Alterations<Permission> | unknown[] | null | undefined,
): SystemPermissionChange[] {
	if (!permissions || Array.isArray(permissions)) {
		return [];
	}

	return [...permissions.create, ...permissions.update]
		.filter(
			(permission): permission is Partial<Permission> & Pick<Permission, 'collection' | 'action'> =>
				!!permission.collection && !!permission.action && isSystemCollection(permission.collection),
		)
		.map(({ collection, action, permissions: filter }) => ({
			collection,
			action,
			unfilteredRead: action === 'read' && isEmpty(filter),
		}));
}
