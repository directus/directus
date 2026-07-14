import { ErrorCode, isDirectusError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import type { ImportCollectionData } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { buildImportPlan } from './build-import-plan.js';

const asInput = (...collections: string[]): ImportCollectionData[] =>
	collections.map((collection) => ({ collection, items: [] }));

describe('buildImportPlan', () => {
	test('orders dependencies before dependents (linear)', () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
			})
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('author').m2o('authors');
			})
			.build();

		const plan = buildImportPlan(asInput('articles', 'authors'), schema);

		expect(plan.order).toEqual(['authors', 'articles']);
		expect(plan.deferred).toEqual([]);
	});

	test('resolves a diamond dependency', () => {
		const schema = new SchemaBuilder()
			.collection('category', (c) => {
				c.field('id').id();
			})
			.collection('author', (c) => {
				c.field('id').id();
				c.field('category').m2o('category');
			})
			.collection('editor', (c) => {
				c.field('id').id();
				c.field('category').m2o('category');
			})
			.collection('article', (c) => {
				c.field('id').id();
				c.field('author').m2o('author');
				c.field('editor').m2o('editor');
			})
			.build();

		const plan = buildImportPlan(asInput('article', 'author', 'editor', 'category'), schema);

		expect(plan.order).toEqual(['category', 'author', 'editor', 'article']);
		expect(plan.deferred).toEqual([]);
	});

	test('ignores dependencies on collections not in the import', () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
			})
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('author').m2o('authors');
			})
			.build();

		// Only importing articles; authors is pre-existing
		const plan = buildImportPlan(asInput('articles'), schema);

		expect(plan.order).toEqual(['articles']);

		expect(plan.fkFields.get('articles')).toEqual([
			expect.objectContaining({ field: 'author', target: 'authors', nullable: true }),
		]);
	});

	test('throws on an unresolvable non-nullable cycle', () => {
		const schema = new SchemaBuilder()
			.collection('a', (c) => {
				c.field('id').id();
				c.field('b_link').m2o('b').options({ nullable: false });
			})
			.collection('b', (c) => {
				c.field('id').id();
				c.field('a_link').m2o('a').options({ nullable: false });
			})
			.build();

		try {
			buildImportPlan(asInput('a', 'b'), schema);
			expect.fail('should have thrown');
		} catch (error) {
			expect(isDirectusError(error, ErrorCode.UnprocessableContent)).toBe(true);
		}
	});

	test('defers a nullable self-reference', () => {
		const schema = new SchemaBuilder()
			.collection('categories', (c) => {
				c.field('id').id();
				c.field('parent').m2o('categories');
			})
			.build();

		const plan = buildImportPlan(asInput('categories'), schema);

		expect(plan.order).toEqual(['categories']);
		expect(plan.deferred).toEqual([{ collection: 'categories', field: 'parent' }]);
	});

	test('breaks a cross-collection cycle by deferring the nullable edge', () => {
		const schema = new SchemaBuilder()
			.collection('a', (c) => {
				c.field('id').id();
				c.field('b_link').m2o('b'); // nullable
			})
			.collection('b', (c) => {
				c.field('id').id();
				c.field('a_link').m2o('a').options({ nullable: false });
			})
			.build();

		const plan = buildImportPlan(asInput('a', 'b'), schema);

		expect(plan.deferred).toEqual([{ collection: 'a', field: 'b_link' }]);
		// With a.b_link deferred, b depends on a, so a is imported first
		expect(plan.order).toEqual(['a', 'b']);
	});

	test('exposes o2m alias fields as relational fields', () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
				c.field('articles').o2m('articles', 'author');
			})
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('author').m2o('authors');
			})
			.build();

		const plan = buildImportPlan(asInput('authors', 'articles'), schema);

		expect(plan.relationalFields.get('authors')).toEqual(new Set(['articles']));
		expect(plan.relationalFields.get('articles')).toEqual(new Set(['author']));
	});

	test('orders a2o allowed collections before the owning collection', () => {
		const schema = new SchemaBuilder()
			.collection('blog', (c) => {
				c.field('id').id();
				c.field('blocks').a2o(['paragraph', 'image']);
			})
			.build();

		const plan = buildImportPlan(asInput('blog', 'paragraph', 'image'), schema);

		expect(plan.fkFields.get('blog')).toEqual([
			expect.objectContaining({
				field: 'blocks',
				target: null,
				collectionField: 'collection',
				allowedCollections: ['paragraph', 'image'],
				nullable: true,
			}),
		]);

		// blog depends on every allowed target that is part of the import
		expect(plan.order.indexOf('paragraph')).toBeLessThan(plan.order.indexOf('blog'));
		expect(plan.order.indexOf('image')).toBeLessThan(plan.order.indexOf('blog'));
	});

	test('ignores a2o allowed collections that are not part of the import', () => {
		const schema = new SchemaBuilder()
			.collection('blog', (c) => {
				c.field('id').id();
				c.field('blocks').a2o(['paragraph', 'image']);
			})
			.build();

		// Only blog + paragraph are imported; image is pre-existing
		const plan = buildImportPlan(asInput('blog', 'paragraph'), schema);

		expect(plan.order).toEqual(['paragraph', 'blog']);
	});

	test('throws on an unknown collection', () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
			})
			.build();

		try {
			buildImportPlan(asInput('unknown'), schema);
			expect.fail('should have thrown');
		} catch (error) {
			expect(isDirectusError(error, ErrorCode.Forbidden)).toBe(true);
		}
	});

	test('throws on a duplicate collection', () => {
		const schema = new SchemaBuilder()
			.collection('authors', (c) => {
				c.field('id').id();
			})
			.build();

		try {
			buildImportPlan(asInput('authors', 'authors'), schema);
			expect.fail('should have thrown');
		} catch (error) {
			expect(isDirectusError(error, ErrorCode.InvalidPayload)).toBe(true);
		}
	});
});
