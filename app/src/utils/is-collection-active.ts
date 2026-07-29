import { isSystemCollection } from '@directus/system-data';
import { Collection } from '@/types/collections';

/**
 * Whether a collection is active (i.e. not deactivated).
 *
 * Collections without an explicit `active` status are treated as inactive, so content surfaces
 * (navigation, relational fields, etc.) hide them by default. Use this instead of checking
 * `meta.status` inline to keep the definition of "active" in one place.
 */
export function isCollectionActive(collection: Collection | null | undefined): boolean {
	if (!collection) return false;

	// System collections have no `status` in their meta (see `systemCollectionRows`) and cannot be
	// deactivated, so they are always active.
	if (isSystemCollection(collection.collection)) return true;

	return collection.meta?.status === 'active';
}
