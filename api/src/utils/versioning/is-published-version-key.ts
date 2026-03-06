import { VERSION_KEY_PUBLISHED, VERSION_KEY_PUBLISHED_LEGACY } from '@directus/constants';

/**
 * Returns true if the given version key represents the published item.
 * Accepts both the current key ('published') and the legacy key ('main').
 */
export function isPublishedVersionKey(key: string | undefined | null): boolean {
	return key === VERSION_KEY_PUBLISHED || key === VERSION_KEY_PUBLISHED_LEGACY;
}
