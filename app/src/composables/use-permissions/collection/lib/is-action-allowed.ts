import { useCollection } from '@directus/composables';
import { PermissionsAction } from '@directus/types';
import { computed, ref, unref } from 'vue';
import { Collection } from '../../types';
import { usePermissionsStore } from '@/stores/permissions';

export const isActionAllowed = (collection: Collection, action: PermissionsAction) => {
	const { info: collectionInfo } = useCollection(ref(collection));
	const { hasPermission } = usePermissionsStore();

	return computed(() => {
		const collectionValue = unref(collection);

		if (!collectionValue) return false;
		if (collectionInfo.value?.type === 'view' && ['create', 'update', 'delete'].includes(action)) return false;

		return hasPermission(collectionValue, action);
	});
};
