import type { CollectionKey, FieldMap } from '../types.js';

export function collectionsInFieldMap(fieldMap: FieldMap): Set<CollectionKey> {
	const collections: Set<CollectionKey> = new Set();

	for (const { collection } of fieldMap.values()) {
		collections.add(collection);
	}

	return collections;
}
