import { usePermissionsStore, useUserStore } from '@/stores';
import { Permission } from '@/types';
import generateJoi from '@/utils/generate-joi';

export function isAllowed(collection: string, action: Permission['action'], value: Record<string, any>) {
	const permissionsStore = usePermissionsStore();
	const userStore = useUserStore();

	if (userStore.isAdmin.value === true) return true;

	const permissions = permissionsStore.state.permissions;

	const permissionInfo = permissions.find(
		(permission) => permission.action === action && permission.collection === collection
	);

	if (!permissionInfo) return false;

	const schema = generateJoi(permissionInfo.permissions, { allowUnknown: permissionInfo.fields === '*' });
	const { error } = schema.validate(value);

	if (!error) {
		return true;
	}

	return false;
}
