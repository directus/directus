import { groupBy, isNil, orderBy } from 'lodash';
import { Collection } from '@/types/collections';

/**
 * Create a flat list of collections, in which grouped collections are sorted under their parent collection.
 * Sorted by `meta.sort` and `collection`.
 *
 * collection_a                collection_a
 *   collection_a_1            collection_a_1
 *   collection_a_2            collection_a_2
 *     collection_a_2_1   ->   collection_a_2_1
 * collection_b                collection_b
 *   collection_b_1            collection_b_1
 */
export function flattenGroupedCollections(collections: Collection[]): Collection[] {
	const topLevelCollections = collections.filter((collection) => isNil(collection.meta?.group));

	const groupedCollections = groupBy(
		collections.filter((collection) => !isNil(collection.meta?.group)),
		'meta.group',
	);

	const flatten = (collections: Collection[]): Collection[] => {
		const result = [];

		for (const collection of orderBy(collections, ['meta.sort', 'collection'])) {
			result.push(collection);

			if (groupedCollections[collection.collection]) {
				result.push(...flatten(groupedCollections[collection.collection]!));
			}
		}

		return result;
	};

	return flatten(topLevelCollections);
}
