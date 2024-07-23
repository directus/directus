import { Permission } from '@directus/types';

export const isFullPermission = (permission: Permission) =>
	permission.permissions === null || Object.keys(permission.permissions).length === 0;
