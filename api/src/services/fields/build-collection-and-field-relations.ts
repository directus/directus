import type { Relation } from '@directus/types';

export function buildCollectionAndFieldRelations(relations: Relation[]) {
	const collectionRelationTree = new Map<string, Set<string>>();
	const fieldToCollectionList = new Map<string, string>();

	// build collection relation tree
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
			const collectionList = collectionRelationTree.get(relation.collection) ?? new Set<string>();

			collectionList.add(relatedCollection);

			// O2M can have outward duplication path
			if (relation.meta?.one_field) {
				const relatedfieldToCollectionListKey = relatedCollection + ':' + relation.meta.one_field;
				const realatedCollectionList = collectionRelationTree.get(relatedCollection) ?? new Set<string>();

				realatedCollectionList.add(relation.collection);

				fieldToCollectionList.set(relatedfieldToCollectionListKey, relation.collection);
				collectionRelationTree.set(relatedCollection, realatedCollectionList);
			}

			// m2a fields show as field:collection in duplication path
			if (relation.meta?.one_allowed_collections) {
				fieldToCollectionListKey += ':' + relatedCollection;
			}

			fieldToCollectionList.set(fieldToCollectionListKey, relatedCollection);
			collectionRelationTree.set(relation.collection, collectionList);
		}
	}

	return { collectionRelationTree, fieldToCollectionList };
}
