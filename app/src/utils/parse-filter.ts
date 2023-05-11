import { useUserStore } from '@/stores/user';
import { Accountability, Filter } from '@directus/types';
import { parseFilter as parseFilterShared } from '@directus/utils';

export function parseFilter(filter: Filter | null): Filter {
	const userStore = useUserStore();

	if (!userStore.currentUser) return filter ?? {};
	if (!('id' in userStore.currentUser)) return filter ?? {};

	const accountability: Accountability = {
		role: userStore.currentUser.role.id,
		user: userStore.currentUser.id,
	};

	return parseFilterShared(filter, accountability) ?? {};
}
