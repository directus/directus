import { PermissionsAction } from '@directus/types';
import { computed, unref } from 'vue';
import { Collection } from '../../types';
import { usePermissionsStore } from '@/stores/permissions';

export const isActionAllowed = (collection: Collection, action: PermissionsAction) => {
	const { hasPermission } = usePermissionsStore();

	return computed(() => {
		const collectionValue = unref(collection);

		if (!collectionValue) return false;

		return hasPermission(collectionValue, action);
	});
};
