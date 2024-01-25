import { systemCollectionRows } from '../database/system-data/collections/index.js';

/**
 * Checks if provided collection is a system collection
 * @param collection
 * @returns
 */
export function isSystemCollection(collection: string): boolean {
	for (const collectionRow of systemCollectionRows) {
		if (collectionRow.collection === collection) {
			return true;
		}
	}

	return false;
}
