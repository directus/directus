import { describe, expect, it } from 'vitest';
import { isCollectionActive } from './is-collection-active';
import { Collection } from '@/types/collections';

function makeCollection(collection: string, meta: Partial<NonNullable<Collection['meta']>> | null): Collection {
	return { collection, meta } as Collection;
}

describe('isCollectionActive', () => {
	it("returns true when the status is 'active'", () => {
		expect(isCollectionActive(makeCollection('articles', { status: 'active' }))).toBe(true);
	});

	it("returns false when the status is 'inactive'", () => {
		expect(isCollectionActive(makeCollection('articles', { status: 'inactive' }))).toBe(false);
	});

	it('returns false for a folder/unconfigured collection without meta', () => {
		expect(isCollectionActive(makeCollection('articles', null))).toBe(false);
	});

	it('returns false when no collection is given', () => {
		expect(isCollectionActive(null)).toBe(false);
		expect(isCollectionActive(undefined)).toBe(false);
	});

	it('returns true for system collections, which have no status in their meta', () => {
		expect(isCollectionActive(makeCollection('directus_files', {}))).toBe(true);
		expect(isCollectionActive(makeCollection('directus_users', null))).toBe(true);
	});

	it('returns false for a non-system collection that merely starts with directus_', () => {
		expect(isCollectionActive(makeCollection('directus_not_real', null))).toBe(false);
	});
});
