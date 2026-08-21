import type { Relation, SchemaOverview } from '@directus/types';
import { expect, test } from 'vitest';
import { isRelationTraversable } from './is-relation-traversable.js';

/** `child` and `pages` are inactive, so they are absent from `collections` but still relate */
function createSchema(relations: Relation[]): SchemaOverview {
	return {
		collections: { parent: {}, articles: {} },
		relations,
	} as unknown as SchemaOverview;
}

const m2o = (relatedCollection: string | null) =>
	({
		collection: 'parent',
		field: 'child_id',
		related_collection: relatedCollection,
		meta: { one_field: 'parents' },
	}) as Relation;

const a2o = (allowed: string[]) =>
	({
		collection: 'parent',
		field: 'item',
		related_collection: null,
		meta: { one_allowed_collections: allowed, one_collection_field: 'collection' },
	}) as unknown as Relation;

test('Returns false for a field without a relation', () => {
	expect(isRelationTraversable(createSchema([]), 'parent', 'child_id')).toBe(false);
});

test('Returns true when the related collection is in the schema', () => {
	expect(isRelationTraversable(createSchema([m2o('articles')]), 'parent', 'child_id')).toBe(true);
});

test('Returns false when the related collection is missing from the schema', () => {
	expect(isRelationTraversable(createSchema([m2o('child')]), 'parent', 'child_id')).toBe(false);
});

test('Returns true for the o2m side when the collection holding the relation is in the schema', () => {
	const schema = createSchema([{ ...m2o('parent'), collection: 'articles' } as Relation]);

	expect(isRelationTraversable(schema, 'parent', 'parents')).toBe(true);
});

test('Returns false for the o2m side when the collection holding the relation is missing', () => {
	const schema = createSchema([{ ...m2o('parent'), collection: 'child' } as Relation]);

	expect(isRelationTraversable(schema, 'parent', 'parents')).toBe(false);
});

test('Returns true for an a2o while any allowed collection remains', () => {
	expect(isRelationTraversable(createSchema([a2o(['articles', 'pages'])]), 'parent', 'item')).toBe(true);
});

test('Returns false for an a2o once every allowed collection is gone', () => {
	expect(isRelationTraversable(createSchema([a2o(['child', 'pages'])]), 'parent', 'item')).toBe(false);
});
