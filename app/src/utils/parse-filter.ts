import { useUserStore } from '@/stores';
import { Accountability, Filter, ParseFilterContext } from '@directus/shared/types';
import { parseFilter as parseFilterShared } from '@directus/shared/utils';

export function parseFilter(filter: Record<string, any>, context: ParseFilterContext = {}): Filter {
	const userStore = useUserStore();

	if (!userStore.currentUser) return filter ?? {};

	const accountability: Accountability = {
		role: userStore.currentUser.role.id,
		user: userStore.currentUser.id,
	};

	return parseFilterShared(filter, accountability, context) ?? {};
}
