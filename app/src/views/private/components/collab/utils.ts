import { ClientID } from '@directus/types';
import type { CollabUser, CollabUserFormatted } from './types';
import { getAssetUrl } from '@/utils/get-asset-url';

export const formatUserAvatar = (user: CollabUser): CollabUserFormatted => ({
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

export function getFocusId(connection: ClientID) {
	return `collab-focus-${connection}`;
}
