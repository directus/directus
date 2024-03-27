import { useUserStore } from '@/stores/user';
import { Accountability, Role, User } from '@directus/types';
import { parsePreset as parsePresetShared } from '@directus/utils';

export function parsePreset(preset: Record<string, any> | null): Record<string, any> {
	const { currentUser } = useUserStore();

	if (!currentUser) return preset ?? {};
	if (!('id' in currentUser)) return preset ?? {};

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
