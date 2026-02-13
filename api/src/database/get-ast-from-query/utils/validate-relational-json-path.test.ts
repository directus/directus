import { SchemaBuilder } from '@directus/schema-builder';
import { describe, expect, test } from 'vitest';
import { validateRelationalJsonPath } from './validate-relational-json-path.js';

describe('validateRelationalJsonPath', () => {
	describe('M2O relations', () => {
		test('validates simple M2O path to JSON field', () => {
			const schema = new SchemaBuilder()
				.collection('products', (c) => {
					c.field('id').id();
					c.field('category').m2o('categories');
				})
				.collection('categories', (c) => {
					c.field('id').id();
					c.field('metadata').json();
				})
				.build();

			const result = validateRelationalJsonPath(schema, 'products', 'category.metadata');

			expect(result.targetCollection).toBe('categories');
			expect(result.jsonField).toBe('metadata');
			expect(result.relationType).toBe('m2o');
			expect(result.relationalPath).toEqual(['category']);
			expect(result.relation.field).toBe('category');
		});
	});

	describe('O2M relations', () => {
		test('validates O2M path to JSON field', () => {
			const schema = new SchemaBuilder()
				.collection('articles', (c) => {
					c.field('id').id();
					c.field('comments').o2m('comments', 'article_id');
				})
				.collection('comments', (c) => {
					c.field('id').id();
					c.field('article_id').integer();
					c.field('data').json();
				})
				.build();

			const result = validateRelationalJsonPath(schema, 'articles', 'comments.data');

			expect(result.targetCollection).toBe('comments');
			expect(result.jsonField).toBe('data');
			expect(result.relationType).toBe('o2m');
			expect(result.relationalPath).toEqual(['comments']);
			expect(result.relation.field).toBe('article_id');
		});
	});

	describe('error cases', () => {
		test('throws for non-existent relation', () => {
			const schema = new SchemaBuilder()
				.collection('products', (c) => {
					c.field('id').id();
					c.field('metadata').json();
				})
				.build();

			expect(() => {
				validateRelationalJsonPath(schema, 'products', 'nonexistent.metadata');
			}).toThrow('is not a relation');
		});

		test('throws for non-JSON field at end of path', () => {
			const schema = new SchemaBuilder()
				.collection('products', (c) => {
					c.field('id').id();
					c.field('category').m2o('categories');
				})
				.collection('categories', (c) => {
					c.field('id').id();
					c.field('name').string();
				})
				.build();

			expect(() => {
				validateRelationalJsonPath(schema, 'products', 'category.name');
			}).toThrow('is not a JSON field');
		});

		test('throws for non-existent field on target collection', () => {
			const schema = new SchemaBuilder()
				.collection('products', (c) => {
					c.field('id').id();
					c.field('category').m2o('categories');
				})
				.collection('categories', (c) => {
					c.field('id').id();
				})
				.build();

			expect(() => {
				validateRelationalJsonPath(schema, 'products', 'category.nonexistent');
			}).toThrow('does not exist');
		});

		test('throws for path without dots (no relation)', () => {
			const schema = new SchemaBuilder()
				.collection('products', (c) => {
					c.field('id').id();
					c.field('metadata').json();
				})
				.build();

			expect(() => {
				validateRelationalJsonPath(schema, 'products', 'metadata');
			}).toThrow('must contain at least one relation');
		});
	});
});
