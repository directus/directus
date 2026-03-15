import { useCollection } from '@directus/composables';
import { ItemPermissions } from '@directus/types';
import { computed, ref, Ref, unref } from 'vue';
import { Collection, IsNew } from '../../types';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';

export const isActionAllowed = (
	collection: Collection,
	isNew: IsNew,
	fetchedItemPermissions: Ref<ItemPermissions>,
	action: 'update' | 'delete' | 'share',
) => {
	const { info: collectionInfo } = useCollection(ref(collection));
	const userStore = useUserStore();
	const { getPermission } = usePermissionsStore();

	const localPermissions = computed(() => {
		const collectionValue = unref(collection);

		if (!collectionValue) return false;
		if (collectionInfo.value?.type === 'view' && ['update', 'delete'].includes(action)) return false;

		if (unref(isNew)) return false;

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
