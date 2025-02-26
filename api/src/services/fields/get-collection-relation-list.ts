import { isSystemCollection } from '@directus/system-data';

/**
 * Returns a list of all related collections for a given collection.
 * Or in math terms, returns the [strongly connected component](https://en.wikipedia.org/wiki/Strongly_connected_component) that a given node belongs to.
 */
export function getCollectionRelationList(collection: string, collectionRelationTree: Map<string, Set<string>>) {
	const collectionRelationList = new Set<string>();

	traverseCollectionRelationTree(collection);

	return collectionRelationList;

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
		if (node === collection || collectionRelationList.has(node)) return;

		collectionRelationList.add(node);

		traverseCollectionRelationTree(node);
	}
}
