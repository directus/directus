import type { Relation, SchemaOverview } from '@directus/types';
import { expect, test } from 'vitest';
import { isRelationTraversable } from './is-relation-traversable.js';

/**
 * `child` and `pages` are inactive, so they stay in `collections` but cannot be traversed into.
 * `ghost` is referenced by relations without being on the schema at all.
 */
function createSchema(relations: Relation[], inactiveCollections: string[] = ['child', 'pages']): SchemaOverview {
	return {
		collections: { parent: {}, articles: {}, child: {}, pages: {} },
		relations,
		inactiveCollections,
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

test('Returns true when the related collection is active', () => {
	expect(isRelationTraversable(createSchema([m2o('articles')]), 'parent', 'child_id')).toBe(true);
});

test('Returns false when the related collection is inactive', () => {
	expect(isRelationTraversable(createSchema([m2o('child')]), 'parent', 'child_id')).toBe(false);
});

test('Returns false when the related collection is not on the schema at all', () => {
	expect(isRelationTraversable(createSchema([m2o('ghost')]), 'parent', 'child_id')).toBe(false);
});

test('Returns true when no collections are inactive', () => {
	expect(isRelationTraversable(createSchema([m2o('child')], []), 'parent', 'child_id')).toBe(true);
});

test('Returns true when the schema does not track inactive collections at all', () => {
	const { inactiveCollections: _, ...schema } = createSchema([m2o('child')]);

	expect(isRelationTraversable(schema as SchemaOverview, 'parent', 'child_id')).toBe(true);
});

test('Returns true for the o2m side when the collection holding the relation is active', () => {
	const schema = createSchema([{ ...m2o('parent'), collection: 'articles' } as Relation]);

	expect(isRelationTraversable(schema, 'parent', 'parents')).toBe(true);
});

test('Returns false for the o2m side when the collection holding the relation is inactive', () => {
	const schema = createSchema([{ ...m2o('parent'), collection: 'child' } as Relation]);

	expect(isRelationTraversable(schema, 'parent', 'parents')).toBe(false);
});

test('Returns false for the o2m side when the collection holding the relation is not on the schema at all', () => {
	const schema = createSchema([{ ...m2o('parent'), collection: 'ghost' } as Relation]);

	expect(isRelationTraversable(schema, 'parent', 'parents')).toBe(false);
});

test('Returns true for an a2o while any allowed collection is still active', () => {
	expect(isRelationTraversable(createSchema([a2o(['articles', 'pages'])]), 'parent', 'item')).toBe(true);
});

test('Returns false for an a2o once every allowed collection is inactive', () => {
	expect(isRelationTraversable(createSchema([a2o(['child', 'pages'])]), 'parent', 'item')).toBe(false);
});

test('Returns false for an a2o whose remaining allowed collections are not on the schema', () => {
	expect(isRelationTraversable(createSchema([a2o(['child', 'ghost'])]), 'parent', 'item')).toBe(false);
});
