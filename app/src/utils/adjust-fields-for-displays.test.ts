import type { Collection, Field, Relation } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, test, vi } from 'vitest';
import { adjustFieldsForDisplays } from './adjust-fields-for-displays';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';

vi.mock('@/composables/use-extension', () => ({
	useExtension: () => ({ value: null }),
}));

function makeCollection(collection: string, status: string): Collection {
	return { collection, meta: { status }, schema: {} } as Collection;
}

function makeField(collection: string, field: string): Field {
	return {
		collection,
		field,
		name: field,
		type: 'integer',
		schema: {},
		meta: { collection, field, special: null, group: null, display: null },
	} as unknown as Field;
}

function makeRelation(
	collection: string,
	field: string,
	relatedCollection: string,
	oneField: string | null = null,
): Relation {
	return {
		collection,
		field,
		related_collection: relatedCollection,
		schema: null,
		meta: { many_collection: collection, many_field: field, one_collection: relatedCollection, one_field: oneField },
	} as unknown as Relation;
}

beforeEach(() => {
	setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));

	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	collectionsStore.collections = [
		makeCollection('articles', 'active'),
		makeCollection('authors', 'active'),
		makeCollection('comments', 'inactive'),
	].map(collectionsStore.prepareCollectionForApp);

	fieldsStore.fields = [
		makeField('articles', 'title'),
		makeField('articles', 'author'),
		makeField('articles', 'comments'),
		makeField('comments', 'body'),
	];

	relationsStore.relations = [
		makeRelation('articles', 'author', 'authors'),
		makeRelation('comments', 'article', 'articles', 'comments'),
	];
});

test('leaves fields of active collections alone', () => {
	expect(adjustFieldsForDisplays(['title', 'author', 'author.name'], 'articles')).toEqual([
		'title',
		'author',
		'author.name',
	]);
});

test('drops fields relating to an inactive collection', () => {
	expect(adjustFieldsForDisplays(['title', 'comments', 'comments.body'], 'articles')).toEqual(['title']);
});

test('drops every field when the parent collection is inactive', () => {
	expect(adjustFieldsForDisplays(['body'], 'comments')).toEqual([]);
});
