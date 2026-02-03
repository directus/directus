import type { Relation } from '@directus/types';
import { describe, expect, it } from 'vitest';
import { getRelationType } from './get-relation-type.js';

describe('getRelationType', () => {
	describe('returns null', () => {
		it('returns null when relation is null', () => {
			const result = getRelationType({
				relation: null,
				collection: 'articles',
				field: 'author',
			});

			expect(result).toBe(null);
		});

		it('returns null when relation does not match collection or field', () => {
			const relation: Relation = {
				collection: 'other_collection',
				field: 'other_field',
				related_collection: 'unrelated',
				meta: null,
				schema: null,
			};

			const result = getRelationType({
				relation,
				collection: 'articles',
				field: 'author',
			});

			expect(result).toBe(null);
		});
	});

	describe('many-to-one (m2o)', () => {
		it('returns m2o when relation.collection and relation.field match', () => {
			const relation: Relation = {
				collection: 'articles',
				field: 'author',
				related_collection: 'users',
				meta: null,
				schema: null,
			};

			const result = getRelationType({
				relation,
				collection: 'articles',
				field: 'author',
			});

			expect(result).toBe('m2o');
		});
	});

	describe('one-to-many (o2m)', () => {
		it('returns o2m when related_collection matches and meta.one_field matches', () => {
			const relation: Relation = {
				collection: 'comments',
				field: 'article_id',
				related_collection: 'articles',
				meta: {
					one_field: 'comments',
				} as Relation['meta'],
				schema: null,
			};

			const result = getRelationType({
				relation,
				collection: 'articles',
				field: 'comments',
			});

			expect(result).toBe('o2m');
		});
	});

	describe('any-to-one (a2o)', () => {
		it('returns a2o when one_collection_field and one_allowed_collections are set', () => {
			const relation: Relation = {
				collection: 'comments',
				field: 'item',
				related_collection: null,
				meta: {
					one_collection_field: 'collection',
					one_allowed_collections: ['articles', 'pages', 'products'],
				} as Relation['meta'],
				schema: null,
			};

			const result = getRelationType({
				relation,
				collection: 'comments',
				field: 'item',
			});

			expect(result).toBe('a2o');
		});

		it('returns a2o even when it would also match m2o conditions', () => {
			const relation: Relation = {
				collection: 'comments',
				field: 'item',
				related_collection: null,
				meta: {
					one_collection_field: 'collection',
					one_allowed_collections: ['articles', 'pages'],
				} as Relation['meta'],
				schema: null,
			};

			const result = getRelationType({
				relation,
				collection: 'comments',
				field: 'item',
			});

			// a2o takes precedence over m2o
			expect(result).toBe('a2o');
		});
	});

	describe('edge cases', () => {
		it('handles null collection parameter', () => {
			const relation: Relation = {
				collection: 'articles',
				field: 'author',
				related_collection: 'users',
				meta: null,
				schema: null,
			};

			const result = getRelationType({
				relation,
				collection: null,
				field: 'author',
			});

			expect(result).toBe(null);
		});

		it('returns m2o when meta is null but collection and field match', () => {
			const relation: Relation = {
				collection: 'articles',
				field: 'author',
				related_collection: 'users',
				meta: null,
				schema: null,
			};

			const result = getRelationType({
				relation,
				collection: 'articles',
				field: 'author',
			});

			expect(result).toBe('m2o');
		});

		it('returns null when meta exists but one_field does not match for o2m', () => {
			const relation: Relation = {
				collection: 'comments',
				field: 'article_id',
				related_collection: 'articles',
				meta: {
					one_field: 'different_field',
				} as Relation['meta'],
				schema: null,
			};

			const result = getRelationType({
				relation,
				collection: 'articles',
				field: 'comments',
			});

			expect(result).toBe(null);
		});
	});
});
