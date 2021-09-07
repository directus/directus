import { useUserStore } from '@/stores';
import { Accountability } from '@directus/shared/types';
import { parseFilter as parseFilterShared } from '@directus/shared/utils';

export function parseFilter(filter: Record<string, any>): Record<string, any> {
	const userStore = useUserStore();

	if (!userStore.currentUser) return filter;

	const accountability: Accountability = {
		role: userStore.currentUser.role.id,
		user: userStore.currentUser.id,
	};

	accountability.userDynamicVars = {};
	for (const column of userStore.currentUser.dynamic_vars) {
		accountability.userDynamicVars[column] = userStore.currentUser[column];
	}

	return parseFilterShared(filter, accountability);
}
