import { useCollection } from '@directus/composables';
import { computed, ref, unref } from 'vue';
import { Collection } from '../../types';
import { isFieldAllowed } from '../../utils/is-field-allowed';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';

export const isSortAllowed = (collection: Collection) => {
	const { info: collectionInfo } = useCollection(ref(collection));
	const userStore = useUserStore();
	const { getPermission } = usePermissionsStore();

	return computed(() => {
		const collectionValue = unref(collection);

		if (!collectionValue) return false;

		const sortField = collectionInfo.value?.meta?.sort_field;
		if (!sortField) return false;

		if (userStore.isAdmin) return true;

		const permission = getPermission(collectionValue, 'update');
		if (!permission) return false;

		return isFieldAllowed(permission, sortField);
	});
};
