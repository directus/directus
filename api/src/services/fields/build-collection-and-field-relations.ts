import type { Relation } from '@directus/types';

/**
 * Builds two maps where collectionRelationTree is a map of collection to related collections
 * and fieldToCollectionList is a map of field:collection to related collection.
 *
 * @example
 * returns {
 * 		collectionRelationTree: new Map([
 * 			['B', new Set(['A'])],
 * 			['A', new Set(['B'])],
 * 		]),
 * 		fieldToCollectionList: new Map([
 * 			['B:b', 'A'],
 * 			['A:a', 'B'],
 * 		]),
 * }
 */
export function buildCollectionAndFieldRelations(relations: Relation[]) {
	// Map<Collection, Set<RelatedCollection>>
	const collectionRelationTree = new Map<string, Set<string>>();
	// Map<Field:Collection, RelatedCollection>
	const fieldToCollectionList = new Map<string, string>();

	for (const relation of relations) {
		let relatedCollections = [];

		if (relation.related_collection) {
			relatedCollections.push(relation.related_collection);
		} else if (relation.meta?.one_collection_field && relation.meta?.one_allowed_collections) {
			relatedCollections = relation.meta?.one_allowed_collections;
		} else {
			// safe guard
			continue;
		}

		for (const relatedCollection of relatedCollections) {
			let fieldToCollectionListKey = relation.collection + ':' + relation.field;
			const collectionList = collectionRelationTree.get(relatedCollection) ?? new Set<string>();

			collectionList.add(relation.collection);

			// O2M can have outward duplication path
			if (relation.meta?.one_field) {
				const relatedfieldToCollectionListKey = relatedCollection + ':' + relation.meta.one_field;
				const realatedCollectionList = collectionRelationTree.get(relation.collection) ?? new Set<string>();

				realatedCollectionList.add(relatedCollection);

				fieldToCollectionList.set(relatedfieldToCollectionListKey, relation.collection);
				collectionRelationTree.set(relation.collection, realatedCollectionList);
			}

			// m2a fields show as field:collection in duplication path
			if (relation.meta?.one_allowed_collections) {
				fieldToCollectionListKey += ':' + relatedCollection;
			}

			fieldToCollectionList.set(fieldToCollectionListKey, relatedCollection);
			collectionRelationTree.set(relatedCollection, collectionList);
		}
	}

	return { collectionRelationTree, fieldToCollectionList };
}
