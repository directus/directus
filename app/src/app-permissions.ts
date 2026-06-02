export { appRecommendedPermissions } from '@directus/system-data';

export const editablePermissionActions = ['create', 'read', 'update', 'delete', 'share'] as const;
export type EditablePermissionsAction = (typeof editablePermissionActions)[number];

export const disabledActions: Record<string, EditablePermissionsAction[]> = {
	directus_extensions: ['create', 'delete'],
};
