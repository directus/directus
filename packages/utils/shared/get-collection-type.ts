import type { Collection, CollectionType } from '@directus/types';

/**
 * Get the type of collection. One of alias | table. (And later: view)
 *
 * @param collection Collection object to get the type of
 * @returns collection type
 */
export function getCollectionType(collection: Collection): CollectionType {
	if (collection.schema) return 'table';
	if (collection.meta) return 'alias';
	return 'unknown';
}
