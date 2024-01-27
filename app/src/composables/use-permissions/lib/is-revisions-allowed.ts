import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { computed } from 'vue';

export const isRevisionsAllowed = () => {
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();

	return computed(() => {
		if (userStore.isAdmin) return true;

		return permissionsStore.permissions.some(
			(permission) => permission.collection === 'directus_revisions' && permission.action === 'read',
		);
	});
};
