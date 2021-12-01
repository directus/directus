import { usePermissionsStore, useUserStore } from '@/stores';
import { computed, ComputedRef } from 'vue';
import { RelationInfo } from '@/composables/use-relation-info';

export default function usePermissions(relationInfo: ComputedRef<RelationInfo>): {
	createAllowed: ComputedRef<boolean>;
	selectAllowed: ComputedRef<boolean>;
} {
	const permissionsStore = usePermissionsStore();
	const userStore = useUserStore();

	const createAllowed = computed(() => {
		const admin = userStore.currentUser?.role.admin_access === true;
		if (admin) return true;

		const hasJunctionPermissions = !!permissionsStore.permissions.find(
			(permission) =>
				permission.action === 'create' && permission.collection === relationInfo.value.junction?.collection
		);

		const hasRelatedPermissions = !!permissionsStore.permissions.find(
			(permission) =>
				permission.action === 'create' && permission.collection === relationInfo.value.relation?.collection
		);

		return hasJunctionPermissions && hasRelatedPermissions;
	});

	const selectAllowed = computed(() => {
		const admin = userStore.currentUser?.role.admin_access === true;
		if (admin) return true;

		const hasJunctionPermissions = !!permissionsStore.permissions.find(
			(permission) =>
				permission.action === 'create' && permission.collection === relationInfo.value.junction?.collection
		);

		return hasJunctionPermissions;
	});

	return { createAllowed, selectAllowed };
}
