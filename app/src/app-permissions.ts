import { PERMISSION_ACTIONS } from '@directus/constants';
import { HARDCODED_AUTH_REQUIREMENTS } from '@directus/system-data';
import type { PermissionsAction } from '@directus/types';

export { appRecommendedPermissions } from '@directus/system-data';

export const editablePermissionActions = PERMISSION_ACTIONS;
export type EditablePermissionsAction = PermissionsAction;

// Actions the API restricts to admins regardless of RBAC. The grid renders these cells as
// non-editable so a non-admin policy can't be given grants that never take effect.
export const disabledActions: Record<string, EditablePermissionsAction[]> = HARDCODED_AUTH_REQUIREMENTS.filter(
	({ requiredAuth }) => requiredAuth === 'admin',
).reduce<Record<string, EditablePermissionsAction[]>>((byCollection, { collection, action }) => {
	(byCollection[collection] ??= []).push(action);
	return byCollection;
}, {});
