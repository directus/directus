import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { FieldFilter, Permission } from '@directus/shared/types';
import { generateJoi } from '@directus/shared/utils';

export function isAllowed(
	collection: string,
	action: Permission['action'],
	value: Record<string, any> | null,
	strict = false
): boolean {
	const permissionsStore = usePermissionsStore();
	const userStore = useUserStore();

	if (userStore.isAdmin === true) return true;

	const permissions = permissionsStore.permissions;

	const permissionInfo = permissions.find(
		(permission) => permission.action === action && permission.collection === collection
	);

	if (!permissionInfo) return false;
	if (!permissionInfo.fields && action !== 'share') return false;

	if (strict && action !== 'share' && permissionInfo.fields!.includes('*') === false && value) {
		const allowedFields = permissionInfo.fields;
		const attemptedFields = Object.keys(value);

		if (attemptedFields.every((field) => allowedFields!.includes(field)) === false) return false;
	}

	if (!permissionInfo.permissions || Object.keys(permissionInfo.permissions).length === 0) return true;

	const schema = generateJoi(permissionInfo.permissions as FieldFilter);

	const { error } = schema.validate(value);

	if (!error) {
		return true;
	}

	return false;
}
