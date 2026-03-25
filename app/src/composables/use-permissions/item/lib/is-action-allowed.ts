import { ItemPermissions } from '@directus/types';
import { computed, MaybeRef, Ref, unref } from 'vue';
import { Collection, IsNew } from '../../types';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';

export const isActionAllowed = (
	collection: Collection,
	isNew: IsNew,
	fetchedItemPermissions: Ref<ItemPermissions>,
	action: 'update' | 'delete' | 'share',
	isVersion: MaybeRef<boolean> = false,
) => {
	const userStore = useUserStore();
	const { getPermission } = usePermissionsStore();

	const localPermissions = computed(() => {
		const collectionValue = unref(collection);

		if (!collectionValue) return false;

		if (unref(isNew)) return false;

		// Version editing bypasses underlying collection write permissions.
		// Field-level access is enforced by the backend at promote time.
		if (action === 'update' && unref(isVersion)) return true;

		if (userStore.isAdmin) return true;

		const permission = getPermission(collectionValue, action);

		if (!permission) return false;
		if (permission.access === 'full') return true;
		if (permission.access === 'none') return false;

		return null;
	});

	return computed(() => {
		if (localPermissions.value !== null) return localPermissions.value;

		return fetchedItemPermissions.value[action].access;
	});
};
