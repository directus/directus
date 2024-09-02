import { usePermissionsStore } from '@/stores/permissions';
import { computed } from 'vue';

export const isRevisionsAllowed = () => {
	const { hasPermission } = usePermissionsStore();

	return computed(() => hasPermission('directus_revisions', 'read'));
};
