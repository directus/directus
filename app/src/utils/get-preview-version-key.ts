import { VERSION_KEY_PUBLISHED } from '@directus/constants';
import type { ContentVersionMaybeNew } from '@/types/versions';

export function getPreviewVersionKey(version: ContentVersionMaybeNew | null): string {
	if (!version || version.id === '+') return VERSION_KEY_PUBLISHED;
	return version.key;
}
