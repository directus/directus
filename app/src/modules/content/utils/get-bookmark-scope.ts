import type { Preset } from '@directus/types';

export type BookmarkScope = 'personal' | 'role' | 'global';

export function getBookmarkScope(preset: Partial<Preset>): BookmarkScope {
	if (preset.user && !preset.role) return 'personal';
	if (!preset.user && preset.role) return 'role';
	return 'global';
}
