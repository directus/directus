import { systemCollectionRows } from '../database/system-data/collections/index.js';

/**
 * Returns a list of system collection names
 * @returns collection names
 */
export function getSystemCollections() {
	return systemCollectionRows.map(({ collection }) => collection);
}
