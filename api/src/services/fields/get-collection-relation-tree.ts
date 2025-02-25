import type { Relation } from '@directus/types';

export function getCollectionReferenceTree(relations: Relation[]) {
	const outwardLinkedCollections = new Map<string, string[]>();
	const inwardLinkedCollections = new Map<string, string[]>();
	const relationalFieldToCollection = new Map<string, string>();

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

		const outward = outwardLinkedCollections.get(relation.collection) ?? [];

		for (const relatedCollection of relatedCollections) {
			const inward = inwardLinkedCollections.get(relatedCollection) ?? [];

			// a -> b
			inward.push(relation.collection);
			inwardLinkedCollections.set(relatedCollection, inward);
			// track collection links on a per collection + field basis
			relationalFieldToCollection.set(`${relation.collection}::${relation.field}`, relatedCollection);

			// b <- a
			outward.push(relatedCollection);
			outwardLinkedCollections.set(relation.collection, outward);

			// O2M can have outward duplication path
			if (relation.meta?.one_field) {
				relationalFieldToCollection.set(`${relatedCollection}::${relation.meta.one_field}`, relation.collection);
			}
		}
	}

	return {
		outwardLinkedCollections,
		inwardLinkedCollections,
		relationalFieldToCollection,
	};
}
