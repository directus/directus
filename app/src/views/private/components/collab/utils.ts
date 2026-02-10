import { CollabUser } from '@/composables/use-collab';
import { getAssetUrl } from '@/utils/get-asset-url';

export const COLLAB_USERS_DISPLAY_LIMIT = 3;

export const formatUserAvatar = (user: CollabUser) => ({
	name: [user.first_name, user.last_name].filter(Boolean).join(' ') || undefined,
	avatar_url: user.avatar?.id
		? getAssetUrl(user.avatar.id, {
				imageKey: 'system-medium-cover',
				cacheBuster: user.avatar.modified_on,
			})
		: undefined,
	color: user.color,
	id: user.id,
	connection: user.connection,
});
