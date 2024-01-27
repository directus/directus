import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { computed, unref } from 'vue';
import { Collection } from '../types';

export const isCreateAllowed = (collection: Collection) => {
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();

	return computed(() => {
		if (userStore.isAdmin) return true;

		return permissionsStore.permissions.some(
			(permission) => permission.collection === unref(collection) && permission.action === 'create',
		);
	});
};
