import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { ItemPermissions } from '@directus/types';
import { Ref, computed, unref } from 'vue';
import { Collection } from '../types';

export const isItemActionAllowed = (
	collection: Collection,
	action: 'update' | 'delete' | 'share',
	fetchedItemPermissions: Ref<ItemPermissions>,
) => {
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();

	return computed(() => {
		if (userStore.isAdmin) return true;

		const permission = permissionsStore.permissions.find(
			(permission) => permission.collection === unref(collection) && permission.action === action,
		);

		if (!permission) return false;

		if (permission.permissions === null || Object.keys(permission.permissions).length === 0) return true;

		return fetchedItemPermissions.value[action].access;
	});
};
