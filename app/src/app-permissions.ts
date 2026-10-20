import { PERMISSION_ACTIONS } from '@directus/constants';
import { HARDCODED_AUTH_REQUIREMENTS } from '@directus/system-data';
import type { PermissionsAction } from '@directus/types';

export { appRecommendedPermissions } from '@directus/system-data';

export const editablePermissionActions = PERMISSION_ACTIONS;
export type EditablePermissionsAction = PermissionsAction;

function groupActionsByCollection(requiredAuth: 'admin' | 'user') {
	return HARDCODED_AUTH_REQUIREMENTS.filter((requirement) => requirement.requiredAuth === requiredAuth).reduce<
		Record<string, EditablePermissionsAction[]>
	>((byCollection, { collection, action }) => {
		(byCollection[collection] ??= []).push(action);
		return byCollection;
	}, {});
}

// Actions the API restricts to admins regardless of RBAC. The grid renders these cells as
// non-editable so a non-admin policy can't be given grants that never take effect.
export const disabledActions: Record<string, EditablePermissionsAction[]> = groupActionsByCollection('admin');

// Actions the API restricts to authenticated users. They stay editable, since the policy may also apply to
// authenticated users, but the grid warns about them on policies attached to the public role.
export const userOnlyActions: Record<string, EditablePermissionsAction[]> = groupActionsByCollection('user');

// The actions of a collection that have a stored permission and that the API restricts to authenticated users.
export function getStoredUserOnlyActions(
	collection: string,
	permissions: { action: string }[],
): EditablePermissionsAction[] {
	return (userOnlyActions[collection] ?? []).filter((action) =>
		permissions.some((permission) => permission.action === action),
	);
}
