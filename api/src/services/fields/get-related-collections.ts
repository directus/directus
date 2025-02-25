import { isSystemCollection } from '@directus/system-data';

export function getRelatedCollections(collection: string, collectionRelationTree: Map<string, Set<string>>) {
	const relatedCollectionList = new Set<string>();

	traverseCollectionRelationTree(collection);

	function traverseCollectionRelationTree(root: string) {
		const relationTree = collectionRelationTree.get(root);

		if (!relationTree) return;

		for (const relationNode of relationTree) {
			addRelationNode(relationNode);
		}
	}

	function addRelationNode(node: string) {
		// system collections cannot have duplication fields and therfore can be skipped
		if (isSystemCollection(node)) return;

		// skip circular reference and existing linked nodes
		if (node === collection || relatedCollectionList.has(node)) return;

		relatedCollectionList.add(node);

		traverseCollectionRelationTree(node);
	}

	return relatedCollectionList;
}
