import { Permission } from '@directus/types';

export const isFieldAllowed = (permission: Permission, field: string) => {
	if (!permission.fields) return false;

	return permission.fields.includes('*') || permission.fields.includes(field);
};
