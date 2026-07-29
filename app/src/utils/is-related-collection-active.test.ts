import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { cryptoStub } from '@/__utils__/crypto';
import { useCollectionsStore } from '@/stores/collections';
import { useRelationsStore } from '@/stores/relations';
import { getLocalTypeForField } from '@/utils/get-local-type';
import { hasActiveRelatedCollection, isRelatedCollectionActive } from '@/utils/is-related-collection-active';

vi.stubGlobal('crypto', cryptoStub);

vi.mock('@/utils/get-local-type');

const INACTIVE_COLLECTIONS = ['comments', 'authors'];

beforeEach(() => {
	setActivePinia(createTestingPinia({ createSpy: vi.fn }));

	const collectionsStore = useCollectionsStore();

	(collectionsStore.getCollection as Mock).mockImplementation((key: string) => ({
		collection: key,
		meta: { status: INACTIVE_COLLECTIONS.includes(key) ? 'inactive' : 'active' },
	}));
});

/** Mock the relations store so `field` on `collection` resolves to `relatedCollection` */
function mockRelation(relations: Record<string, { collection: string; relatedCollection: string }>) {
	const relationsStore = useRelationsStore();

	(relationsStore.getRelationsForField as Mock).mockImplementation((collection: string, field: string) => {
		const relation = relations[`${collection}.${field}`];
		if (!relation) return [];
		return [{ collection: relation.collection, field, related_collection: relation.relatedCollection }];
	});
}

describe('isRelatedCollectionActive', () => {
	it('returns true for a non-relational field', () => {
		mockRelation({});

		expect(isRelatedCollectionActive('articles', 'title')).toBe(true);
	});

	it('returns false for an m2o pointing at an inactive collection', () => {
		mockRelation({ 'articles.author': { collection: 'articles', relatedCollection: 'authors' } });
		(getLocalTypeForField as Mock).mockReturnValue('m2o');

		expect(isRelatedCollectionActive('articles', 'author')).toBe(false);
	});

	it('returns true for an m2o pointing at an active collection', () => {
		mockRelation({ 'articles.category': { collection: 'articles', relatedCollection: 'categories' } });
		(getLocalTypeForField as Mock).mockReturnValue('m2o');

		expect(isRelatedCollectionActive('articles', 'category')).toBe(true);
	});

	it('returns false for an o2m pointing at an inactive collection', () => {
		mockRelation({ 'articles.comments': { collection: 'comments', relatedCollection: 'articles' } });
		(getLocalTypeForField as Mock).mockReturnValue('o2m');

		expect(isRelatedCollectionActive('articles', 'comments')).toBe(false);
	});

	it('returns true for a file field, since system collections cannot be deactivated', () => {
		mockRelation({ 'articles.image': { collection: 'articles', relatedCollection: 'directus_files' } });
		(getLocalTypeForField as Mock).mockReturnValue('m2o');

		expect(isRelatedCollectionActive('articles', 'image')).toBe(true);
	});

	it('returns false for a nested path traversing an inactive collection', () => {
		mockRelation({ 'articles.author': { collection: 'articles', relatedCollection: 'authors' } });
		(getLocalTypeForField as Mock).mockReturnValue('m2o');

		expect(isRelatedCollectionActive('articles', 'author.name')).toBe(false);
	});

	it('returns true for a nested path whose collections are all active', () => {
		mockRelation({
			'articles.category': { collection: 'articles', relatedCollection: 'categories' },
			'categories.owner': { collection: 'categories', relatedCollection: 'users' },
		});

		(getLocalTypeForField as Mock).mockReturnValue('m2o');

		expect(isRelatedCollectionActive('articles', 'category.owner.name')).toBe(true);
	});

	it('returns false for an m2a scoped key pointing at an inactive collection', () => {
		mockRelation({});

		expect(isRelatedCollectionActive('articles', 'sections:comments.body')).toBe(false);
	});

	it('returns true when no collection is given', () => {
		expect(isRelatedCollectionActive(null, 'author')).toBe(true);
		expect(isRelatedCollectionActive(undefined, 'author')).toBe(true);
	});
});

describe('hasActiveRelatedCollection', () => {
	it("resolves the collection from the field's own collection", () => {
		mockRelation({ 'articles.author': { collection: 'articles', relatedCollection: 'authors' } });
		(getLocalTypeForField as Mock).mockReturnValue('m2o');

		expect(hasActiveRelatedCollection({ collection: 'articles', field: 'author' } as any)).toBe(false);
		expect(hasActiveRelatedCollection({ collection: 'articles', field: 'title' } as any)).toBe(true);
	});
});
