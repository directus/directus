import { isSystemCollection } from '@directus/system-data';
import type { Relation } from '@directus/types';

export function getCollectionReferences(collection: string, relations: Relation[]) {
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

	const collectionLinks = getRelatedCollections(collection, outwardLinkedCollections, inwardLinkedCollections);

	return {
		collectionLinks,
		relationalFieldToCollection,
	};
}

function getRelatedCollections(
	collection: string,
	outwardLinkedCollections: Map<string, string[]>,
	inwardLinkedCollections: Map<string, string[]>,
) {
	const relatedCollections = new Set<string>();

	traverseRelatedCollections(collection);

	function traverseRelatedCollections(root: string) {
		const inward = inwardLinkedCollections.get(root) ?? [];
		const outward = outwardLinkedCollections.get(root) ?? [];

		if (inward.length === 0 && outward.length === 0) return;

		for (const node of inward) {
			addNode(node);
		}

		for (const node of outward) {
			addNode(node);
		}
	}

	function addNode(node: string) {
		// system collections cannot have duplication fields and therfore can be skipped
		if (isSystemCollection(node)) return;

		// skip circular reference and existing linked nodes
		if (node === collection || relatedCollections.has(node)) return;

		relatedCollections.add(node);

		traverseRelatedCollections(node);
	}

	return relatedCollections;
}
