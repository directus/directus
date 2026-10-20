import type { CollectionOverview } from '@directus/types';
import { expect, test } from 'vitest';
import { isCollectionActive } from './is-collection-active.js';

function collection(status?: string): CollectionOverview {
	return {
		collection: 'articles',
		primary: 'id',
		singleton: false,
		sortField: null,
		note: null,
		accountability: 'all',
		fields: {},
		...(status === undefined ? {} : { status }),
	};
}

test('returns false when the collection is missing from the schema', () => {
	expect(isCollectionActive(undefined)).toBe(false);
});

test('treats an absent status as active', () => {
	expect(isCollectionActive(collection())).toBe(true);
});

test('returns true for an active collection', () => {
	expect(isCollectionActive(collection('active'))).toBe(true);
});

test('returns false for an inactive collection', () => {
	expect(isCollectionActive(collection('inactive'))).toBe(false);
});

test('treats any unknown status as inactive', () => {
	expect(isCollectionActive(collection('archived'))).toBe(false);
	expect(isCollectionActive(collection(''))).toBe(false);
});
