import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCollections } from './use-collections';
import { useCollectionsStore } from '@/stores/collections';
import { Collection } from '@/types/collections';

function makeCollection(collection: string, hasSchema = true): Collection {
	return {
		collection,
		name: collection,
		meta: hasSchema ? {} : null,
		schema: hasSchema ? {} : null,
	} as unknown as Collection;
}

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

describe('useCollections', () => {
	describe('availableCollections', () => {
		it('returns only collections with meta', () => {
			const collectionsStore = useCollectionsStore();

			collectionsStore.collections = [
				makeCollection('articles'),
				makeCollection('products'),
				makeCollection('no_meta', false),
			];

			const { availableCollections } = useCollections({ excludeCollections: [] });

			expect(availableCollections.value).toHaveLength(2);
			expect(availableCollections.value.map((c) => c.collection)).toEqual(['articles', 'products']);
		});

		it('orders collections alphabetically by collection name', () => {
			const collectionsStore = useCollectionsStore();

			collectionsStore.collections = [makeCollection('zebra'), makeCollection('apple'), makeCollection('mango')];

			const { availableCollections } = useCollections({ excludeCollections: [] });

			expect(availableCollections.value.map((c) => c.collection)).toEqual(['apple', 'mango', 'zebra']);
		});

		it('marks excluded collections as disabled', () => {
			const collectionsStore = useCollectionsStore();

			collectionsStore.collections = [
				makeCollection('articles'),
				makeCollection('products'),
				makeCollection('categories'),
			];

			const { availableCollections } = useCollections({ excludeCollections: ['products'] });

			const articles = availableCollections.value.find((c) => c.collection === 'articles');
			const products = availableCollections.value.find((c) => c.collection === 'products');
			const categories = availableCollections.value.find((c) => c.collection === 'categories');

			expect(articles?.disabled).toBe(false);
			expect(products?.disabled).toBe(true);
			expect(categories?.disabled).toBe(false);
		});
	});

	describe('systemCollections', () => {
		it('returns only system collections', () => {
			const collectionsStore = useCollectionsStore();

			collectionsStore.collections = [
				makeCollection('articles'),
				makeCollection('directus_users'),
				makeCollection('directus_files'),
			];

			const { systemCollections } = useCollections({ excludeCollections: [] });

			expect(systemCollections.value).toHaveLength(2);
			expect(systemCollections.value.map((c) => c.collection).sort()).toEqual(['directus_files', 'directus_users']);
		});

		it('orders system collections alphabetically', () => {
			const collectionsStore = useCollectionsStore();

			collectionsStore.collections = [
				makeCollection('directus_users'),
				makeCollection('directus_activity'),
				makeCollection('directus_files'),
			];

			const { systemCollections } = useCollections({ excludeCollections: [] });

			expect(systemCollections.value.map((c) => c.collection)).toEqual([
				'directus_activity',
				'directus_files',
				'directus_users',
			]);
		});

		it('marks excluded system collections as disabled', () => {
			const collectionsStore = useCollectionsStore();

			collectionsStore.collections = [makeCollection('directus_users'), makeCollection('directus_files')];

			const { systemCollections } = useCollections({ excludeCollections: ['directus_users'] });

			const users = systemCollections.value.find((c) => c.collection === 'directus_users');
			const files = systemCollections.value.find((c) => c.collection === 'directus_files');

			expect(users?.disabled).toBe(true);
			expect(files?.disabled).toBe(false);
		});
	});

	describe('displayItems', () => {
		it('includes both user and system collections', () => {
			const collectionsStore = useCollectionsStore();

			collectionsStore.collections = [makeCollection('articles'), makeCollection('directus_users')];

			const { displayItems } = useCollections({ excludeCollections: [] });

			const collectionNames = displayItems.value.filter((item) => !item.divider).map((c) => c.collection);

			expect(collectionNames).toContain('articles');
			expect(collectionNames).toContain('directus_users');
		});

		it('adds a divider between user and system collections', () => {
			const collectionsStore = useCollectionsStore();

			collectionsStore.collections = [makeCollection('articles'), makeCollection('directus_users')];

			const { displayItems } = useCollections({ excludeCollections: [] });

			const dividers = displayItems.value.filter((item) => item.divider);

			expect(dividers).toHaveLength(1);
		});

		it('does not add divider when only user collections exist', () => {
			const collectionsStore = useCollectionsStore();

			collectionsStore.collections = [makeCollection('articles'), makeCollection('products')];

			const { displayItems } = useCollections({ excludeCollections: [] });

			const dividers = displayItems.value.filter((item) => item.divider);

			expect(dividers).toHaveLength(0);
		});

		it('does not add divider when only system collections exist', () => {
			const collectionsStore = useCollectionsStore();

			collectionsStore.collections = [makeCollection('directus_users'), makeCollection('directus_files')];

			const { displayItems } = useCollections({ excludeCollections: [] });

			const dividers = displayItems.value.filter((item) => item.divider);

			expect(dividers).toHaveLength(0);
		});

		it('returns empty array when no collections exist', () => {
			const collectionsStore = useCollectionsStore();

			collectionsStore.collections = [];

			const { displayItems } = useCollections({ excludeCollections: [] });

			expect(displayItems.value).toHaveLength(0);
		});
	});

	describe('disableSelectedCollection', () => {
		it('adds disabled property based on excludeCollections', () => {
			const collectionsStore = useCollectionsStore();

			collectionsStore.collections = [];

			const { disableSelectedCollection } = useCollections({
				excludeCollections: ['excluded_collection'],
			});

			const includedCollection = makeCollection('included_collection');
			const excludedCollection = makeCollection('excluded_collection');

			const resultIncluded = disableSelectedCollection(includedCollection);
			const resultExcluded = disableSelectedCollection(excludedCollection);

			expect(resultIncluded.disabled).toBe(false);
			expect(resultExcluded.disabled).toBe(true);
		});

		it('preserves all other collection properties', () => {
			const collectionsStore = useCollectionsStore();

			collectionsStore.collections = [];

			const { disableSelectedCollection } = useCollections({ excludeCollections: [] });

			const collection = makeCollection('test_collection');

			const result = disableSelectedCollection(collection);

			expect(result.collection).toBe('test_collection');
			expect(result.name).toBe('test_collection');
			expect(result.meta).toEqual({});
			expect(result.schema).toEqual({});
		});
	});
});
