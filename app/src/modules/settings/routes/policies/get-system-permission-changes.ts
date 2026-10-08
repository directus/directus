import { isSystemCollection } from '@directus/system-data';
import type { Alterations, Permission, PermissionsAction, PrimaryKey } from '@directus/types';
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

	return toSystemPermissionChanges([...permissions.create, ...permissions.update]);
}

/**
 * Returns the given permissions that target a system collection.
 */
export function toSystemPermissionChanges(permissions: Partial<Permission>[]): SystemPermissionChange[] {
	return permissions
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

/**
 * Returns the existing policies newly attached through `directus_access` rows, along with the IDs of their permissions
 * staged for update or deletion, whose saved state is superseded by the edits.
 */
export function getAttachedExistingPolicies(access: Alterations<{ policy: unknown }> | unknown[] | null | undefined): {
	policyIds: string[];
	editedPermissionIds: PrimaryKey[];
} {
	if (!access || Array.isArray(access)) {
		return { policyIds: [], editedPermissionIds: [] };
	}

	const policyIds: string[] = [];
	const editedPermissionIds: PrimaryKey[] = [];

	for (const { policy } of access.create) {
		if (typeof policy === 'string') {
			policyIds.push(policy);
			continue;
		}

		if (!isPlainObject(policy)) {
			continue;
		}

		const { id, permissions } = policy as { id?: string; permissions?: Alterations<Permission> | unknown[] };

		if (!id) {
			continue;
		}

		policyIds.push(id);

		if (permissions && !Array.isArray(permissions)) {
			editedPermissionIds.push(
				...permissions.update.flatMap(({ id }) => (id === undefined ? [] : [id])),
				...permissions.delete,
			);
		}
	}

	return { policyIds, editedPermissionIds };
}
