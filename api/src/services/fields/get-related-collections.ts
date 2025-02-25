import { isSystemCollection } from '@directus/system-data';

export function getRelatedCollections(
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
