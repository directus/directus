import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { useCollection } from '@directus/composables';
import { computed, unref } from 'vue';
import { Collection } from '../../types';
import { isFieldAllowed } from '../../utils/is-field-allowed';

export const isSortAllowed = (collection: Collection) => {
	const { info: collectionInfo } = useCollection(collection);
	const userStore = useUserStore();
	const { getPermission } = usePermissionsStore();

	return computed(() => {
		const sortField = collectionInfo.value?.meta?.sort_field;
		if (!sortField) return false;

		if (userStore.isAdmin) return true;

		const permission = getPermission(unref(collection), 'update');
		if (!permission) return false;

		return isFieldAllowed(permission, sortField);
	});
};
