import { computed } from 'vue';
import { usePermissionsStore } from '@/stores/permissions';

export const isRevisionsAllowed = () => {
	const { hasPermission } = usePermissionsStore();

	return computed(() => hasPermission('directus_revisions', 'read'));
};
