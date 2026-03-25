import { Accountability, Role, User } from '@directus/types';
import { parsePreset as parsePresetShared } from '@directus/utils';
import { useUserStore } from '@/stores/user';

export function parsePreset(preset: Record<string, any> | null): Record<string, any> {
	const { currentUser } = useUserStore();

	if (!currentUser) return preset ?? {};
	if (!('id' in currentUser)) return preset ?? {};

	// TODO make this work with new user
	const accountability: Accountability = {
		role: currentUser.role?.id ?? null,
		user: currentUser.id,
	};

	return (
		parsePresetShared(preset, accountability, {
			$CURRENT_ROLE: currentUser.role as Role,
			$CURRENT_USER: currentUser as User,
		}) ?? {}
	);
}
