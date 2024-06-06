import { ActionPermission } from '@/types/permissions';

export const isFieldAllowed = (permission: ActionPermission, field: string) => {
	if (!permission.fields) return false;

	return permission.fields.includes('*') || permission.fields.includes(field);
};
