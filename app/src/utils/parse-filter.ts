import { useUserStore } from '@/stores/user';
import { Accountability, Filter } from '@directus/types';
import { parseFilter as parseFilterShared } from '@directus/utils';

export function parseFilter(filter: Filter | null): Filter {
	const { currentUser } = useUserStore();

	if (!currentUser) return filter ?? {};
	if (!('id' in currentUser)) return filter ?? {};

	const accountability: Accountability = {
		role: currentUser.role.id,
		user: currentUser.id,
	};

	return (
		parseFilterShared(filter, accountability, {
			$CURRENT_ROLE: currentUser.role,
			$CURRENT_USER: currentUser,
		}) ?? {}
	);
}
