import { expect, test } from "vitest";
import { getCollectionReferenceTree } from "./get-collection-relation-tree.js";

test('get references for no relations', () => {
	const references = getCollectionReferenceTree([]);

	expect(references).toEqual({
		inwardLinkedCollections: new Map(),
		outwardLinkedCollections: new Map(),
		relationalFieldToCollection: new Map(),
	});
})

test('get references for no m2o relation', () => {
	const references = getCollectionReferenceTree([{
		collection: 'A',
		field: 'a',
		related_collection: 'B',
		meta: {} as any,
		schema: {} as any
	}]);

	expect(references).toEqual({
		inwardLinkedCollections: new Map([["B", ["A"]]]),
		outwardLinkedCollections: new Map([["A", ["B"]]]),
		relationalFieldToCollection: new Map([["A::a", "B"]]),
	});
})

test('get references for no o2m relation', () => {
	const references = getCollectionReferenceTree([{
		collection: 'A',
		field: 'a',
		related_collection: 'B',
		meta: {
			one_field: 'b',
		} as any,
		schema: {} as any
	}]);

	expect(references).toEqual({
		inwardLinkedCollections: new Map([["B", ["A"]]]),
		outwardLinkedCollections: new Map([["A", ["B"]]]),
		relationalFieldToCollection: new Map([["A::a", "B"], ["B::b", "A"]]),
	});
})

test('get references for no m2a relation', () => {
	const references = getCollectionReferenceTree([{
		collection: 'A',
		field: 'a',
		related_collection: null,
		meta: {
			one_allowed_collections: ['B', 'C'],
			one_collection_field: 'b',
		} as any,
		schema: {} as any
	}]);

	expect(references).toEqual({
		inwardLinkedCollections: new Map([["B", ["A"]], ["C", ["A"]]]),
		outwardLinkedCollections: new Map([["A", ["B", "C"]]]),
		relationalFieldToCollection: new Map([["A::a", "C"]]),
	});
})
