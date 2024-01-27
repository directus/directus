import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { useCollection } from '@directus/composables';
import { Ref, computed, unref } from 'vue';
import { Collection } from '../types';

export const isArchiveAllowed = (collection: Collection, updateAllowed: Ref<boolean>) => {
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();
	const { info: collectionInfo } = useCollection(collection);

	return computed(() => {
		const archiveField = collectionInfo.value?.meta?.archive_field;
		if (!archiveField) return false;

		if (userStore.isAdmin) return true;

		const permission = permissionsStore.permissions.find(
			(permission) => permission.collection === unref(collection) && permission.action === 'update',
		);

		if (!permission) return false;

		if (!permission.fields || (!permission.fields.includes('*') && !permission.fields.includes(archiveField)))
			return false;

		return updateAllowed.value;
	});
};
