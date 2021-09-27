import { usePermissionsStore, useUserStore } from '@/stores';
import { Collection } from '@directus/shared/types';
import { computed, Ref, ComputedRef } from 'vue';

export default function usePermissions(
	junctionCollection: Ref<Collection>,
	relationCollection: Ref<Collection>
): { createAllowed: ComputedRef<boolean>; selectAllowed: ComputedRef<boolean> } {
	const permissionsStore = usePermissionsStore();
	const userStore = useUserStore();

	const createAllowed = computed(() => {
		const admin = userStore.currentUser?.role.admin_access === true;
		if (admin) return true;

		const hasJunctionPermissions = !!permissionsStore.permissions.find(
			(permission) => permission.action === 'create' && permission.collection === junctionCollection.value.collection
		);

		const hasRelatedPermissions = !!permissionsStore.permissions.find(
			(permission) => permission.action === 'create' && permission.collection === relationCollection.value.collection
		);

		return hasJunctionPermissions && hasRelatedPermissions;
	});

	const selectAllowed = computed(() => {
		const admin = userStore.currentUser?.role.admin_access === true;
		if (admin) return true;

		const hasJunctionPermissions = !!permissionsStore.permissions.find(
			(permission) => permission.action === 'create' && permission.collection === junctionCollection.value.collection
		);

		return hasJunctionPermissions;
	});

	return { createAllowed, selectAllowed };
}
