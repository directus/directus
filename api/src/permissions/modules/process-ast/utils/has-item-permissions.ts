import type { Permission } from '@directus/types';

export function hasItemPermissions(permission: Permission) {
	return permission.permissions !== null && Object.keys(permission.permissions).length > 0;
}
