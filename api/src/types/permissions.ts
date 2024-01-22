import type { PermissionsAction } from '@directus/types';

export type ItemPermissionsAccess = Record<Extract<PermissionsAction, 'update' | 'delete' | 'share'>, boolean>;

export type ItemPermissions = {
	access: ItemPermissionsAccess;
};
