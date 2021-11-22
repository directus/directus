import { usePermissionsStore, useUserStore } from '@/stores';
import { computed, ComputedRef } from 'vue';

export default function usePermissions(
	junctionCollection: string,
	relationCollection: string
): { createAllowed: ComputedRef<boolean>; selectAllowed: ComputedRef<boolean> } {
	const permissionsStore = usePermissionsStore();
	const userStore = useUserStore();

	const createAllowed = computed(() => {
		const admin = userStore.currentUser?.role.admin_access === true;
		if (admin) return true;

		const hasJunctionPermissions = !!permissionsStore.permissions.find(
			(permission) => permission.action === 'create' && permission.collection === junctionCollection
		);

		const hasRelatedPermissions = !!permissionsStore.permissions.find(
			(permission) => permission.action === 'create' && permission.collection === relationCollection
		);

		return hasJunctionPermissions && hasRelatedPermissions;
	});

	const selectAllowed = computed(() => {
		const admin = userStore.currentUser?.role.admin_access === true;
		if (admin) return true;

		const hasJunctionPermissions = !!permissionsStore.permissions.find(
			(permission) => permission.action === 'create' && permission.collection === junctionCollection
		);

		return hasJunctionPermissions;
	});

	return { createAllowed, selectAllowed };
}
