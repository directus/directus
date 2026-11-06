import { Field, Relation } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { computed } from 'vue';
import { useFieldsStore } from './fields';
import { useRelationsStore } from './relations';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

function makeField(collection: string, field: string): Field {
	return { collection, field, name: field, type: 'string', schema: null, meta: null };
}

function makeRelation(
	collection: string,
	field: string,
	related_collection: string | null,
	meta: Partial<NonNullable<Relation['meta']>> = {},
): Relation {
	return {
		collection,
		field,
		related_collection,
		schema: null,
		meta: { one_field: null, junction_field: null, ...meta } as Relation['meta'],
	};
}

// articles.tags is a m2m through articles_tags, articles.author is a m2o to authors
const author = makeRelation('articles', 'author', 'authors', { one_field: 'articles' });

const tagsToArticles = makeRelation('articles_tags', 'articles_id', 'articles', {
	one_field: 'tags',
	junction_field: 'tags_id',
});

const tagsToTags = makeRelation('articles_tags', 'tags_id', 'tags', { junction_field: 'articles_id' });
const selfParent = makeRelation('articles', 'parent', 'articles');

function setup() {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	fieldsStore.fields = [
		makeField('articles', 'author'),
		makeField('articles', 'tags'),
		makeField('articles', 'parent'),
		makeField('authors', 'articles'),
		makeField('articles_tags', 'articles_id'),
		makeField('articles_tags', 'tags_id'),
	];

	relationsStore.relations = [author, tagsToArticles, tagsToTags, selfParent];

	return relationsStore;
}

describe('getRelationsForCollection', () => {
	test('returns relations on either side, in store order, once each', () => {
		const relationsStore = setup();

		expect(relationsStore.getRelationsForCollection('articles')).toEqual([author, tagsToArticles, selfParent]);
		expect(relationsStore.getRelationsForCollection('authors')).toEqual([author]);
		expect(relationsStore.getRelationsForCollection('articles_tags')).toEqual([tagsToArticles, tagsToTags]);
		expect(relationsStore.getRelationsForCollection('missing')).toEqual([]);
	});

	test('returns a copy that callers can mutate', () => {
		const relationsStore = setup();

		relationsStore.getRelationsForCollection('articles').pop();

		expect(relationsStore.getRelationsForCollection('articles')).toHaveLength(3);
	});
});

describe('getRelationsForField', () => {
	test('returns the m2o relation', () => {
		const relationsStore = setup();

		expect(relationsStore.getRelationsForField('articles', 'author')).toEqual([author]);
		expect(relationsStore.getRelationsForField('authors', 'articles')).toEqual([author]);
	});

	test('includes the junction side for m2m fields', () => {
		const relationsStore = setup();

		expect(relationsStore.getRelationsForField('articles', 'tags')).toEqual([tagsToArticles, tagsToTags]);
	});

	test('returns nothing for unknown fields', () => {
		const relationsStore = setup();

		expect(relationsStore.getRelationsForField('articles', 'missing')).toEqual([]);
	});
});

describe('getRelationForField', () => {
	test('returns only the many side relation', () => {
		const relationsStore = setup();

		expect(relationsStore.getRelationForField('articles', 'author')).toBe(author);
		expect(relationsStore.getRelationForField('articles', 'parent')).toBe(selfParent);
		expect(relationsStore.getRelationForField('authors', 'articles')).toBeNull();
	});
});

test('lookups update when relations are replaced', () => {
	const relationsStore = setup();
	const authorRelation = computed(() => relationsStore.getRelationForField('articles', 'author'));

	expect(authorRelation.value).toBe(author);

	relationsStore.relations = relationsStore.relations.filter((relation) => relation !== author);
	expect(authorRelation.value).toBeNull();

	relationsStore.dehydrate();
	expect(relationsStore.getRelationsForCollection('articles')).toEqual([]);
});
