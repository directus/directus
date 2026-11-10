import type { CollectionOverview } from '@directus/types';

/**
 * Whether a collection accepts CRUD.
 *
 * @param collection Collection overview to check, or undefined when it isn't in the schema
 * @returns whether the collection is present and active
 */
export function isCollectionActive(collection: CollectionOverview | undefined): boolean {
	if (!collection) return false;

	return collection.status === undefined || collection.status === 'active';
}
