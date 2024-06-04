import { useUserStore } from '@/stores/user';
import { Accountability, Filter } from '@directus/types';
import { parseFilter as parseFilterShared } from '@directus/utils';

export function parseFilter(filter: Filter | null): Filter {
	const { currentUser } = useUserStore();

	if (!currentUser) return filter ?? {};
	if (!('id' in currentUser)) return filter ?? {};

	// TODO make this respect new user setup
	const accountability: Accountability = {
		role: currentUser.role?.id ?? null,
		roles: currentUser.roles.map((role) => role.id),
		user: currentUser.id,
	} as Accountability;

	return (
		parseFilterShared(filter, accountability, {
			$CURRENT_ROLE: currentUser.role ?? undefined,
			$CURRENT_ROLES: currentUser.roles,
			$CURRENT_USER: currentUser,
		}) ?? {}
	);
}
