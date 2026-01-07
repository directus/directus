import { describe, expect, it } from 'vitest';
import { Collection } from '@/types/collections';
import { flattenGroupedCollections } from '@/utils/flatten-grouped-collections';

describe('flattenGroupedCollection', () => {
	it('should return a list by meta.sort and collection name if no groups are present', () => {
		const collections = [
			{ collection: 'collection_a', meta: { sort: 2, group: null } },
			{ collection: 'collection_z', meta: { sort: 1 } },
			{ collection: 'collection_b', meta: { sort: 1 } },
		] as Collection[];

		const result = flattenGroupedCollections(collections);

		expect(result).toEqual([
			{ collection: 'collection_b', meta: { sort: 1 } },
			{ collection: 'collection_z', meta: { sort: 1 } },
			{ collection: 'collection_a', meta: { sort: 2, group: null } },
		]);
	});

	it('should return a sorted, flattened list with groups present', () => {
		const collections = [
			{ collection: 'collection_b', meta: { sort: 2, group: null } },
			{ collection: 'collection_a', meta: { sort: 1 } },
			{ collection: 'collection_b_1', meta: { group: 'collection_b', sort: 1 } },
			{ collection: 'collection_a_2_1', meta: { group: 'collection_a_2', sort: 1 } },
			{ collection: 'collection_a_2', meta: { group: 'collection_a', sort: 2 } },
			{ collection: 'collection_a_1', meta: { group: 'collection_a', sort: 1 } },
		] as Collection[];

		const result = flattenGroupedCollections(collections);

		expect(result).toEqual([
			{ collection: 'collection_a', meta: { sort: 1 } },
			{ collection: 'collection_a_1', meta: { group: 'collection_a', sort: 1 } },
			{ collection: 'collection_a_2', meta: { group: 'collection_a', sort: 2 } },
			{ collection: 'collection_a_2_1', meta: { group: 'collection_a_2', sort: 1 } },
			{ collection: 'collection_b', meta: { sort: 2, group: null } },
			{ collection: 'collection_b_1', meta: { group: 'collection_b', sort: 1 } },
		]);
	});
});
