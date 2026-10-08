import { isSystemCollection } from '@directus/system-data';
import type { Alterations, Permission, PermissionsAction } from '@directus/types';
import { isEmpty, isPlainObject } from 'lodash-es';

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

/**
 * Returns the system collection permission changes made to policies through edits of their `directus_access` rows,
 * as staged by the policies field of a role.
 */
export function getAccessSystemPermissionChanges(
	access: Alterations<{ policy: unknown }> | unknown[] | null | undefined,
): SystemPermissionChange[] {
	if (!access || Array.isArray(access)) {
		return [];
	}

	return [...access.create, ...access.update].flatMap(({ policy }) =>
		isPlainObject(policy)
			? getSystemPermissionChanges((policy as { permissions?: Alterations<Permission> }).permissions)
			: [],
	);
}
