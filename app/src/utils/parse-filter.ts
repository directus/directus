import { useUserStore } from '@/stores/user';
import { Accountability } from '@directus/types';
import { parseFilter as parseFilterShared } from '@directus/utils';
import { Filter } from '@directus/types';

export function parseFilter(filter: Filter | null): Filter {
	const userStore = useUserStore();

	if (!userStore.currentUser) return filter ?? {};

	const accountability: Accountability = {
		role: userStore.currentUser.role.id,
		user: userStore.currentUser.id,
	};

	return parseFilterShared(filter, accountability) ?? {};
}
