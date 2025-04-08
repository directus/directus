import { expect, test } from 'vitest';
import { getRelation } from './get-relation.js';
import { SchemaBuilder } from '@directus/schema-builder';

test('relation on m2o field', () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('author').m2o('users', 'articles');
		})
		.build();

	const result = getRelation(schema, 'article', 'author');

	expect(result).toMatchInlineSnapshot(`
		{
		  "collection": "article",
		  "field": "author",
		  "meta": {
		    "id": 0,
		    "junction_field": null,
		    "many_collection": "article",
		    "many_field": "author",
		    "one_allowed_collections": null,
		    "one_collection": "users",
		    "one_collection_field": null,
		    "one_deselect_action": "nullify",
		    "one_field": "articles",
		    "sort_field": null,
		  },
		  "related_collection": "users",
		  "schema": {
		    "column": "author",
		    "constraint_name": "article_author_foreign",
		    "foreign_key_schema": "public",
		    "foreign_key_table": "users",
		    "on_delete": "SET NULL",
		    "on_update": "NO ACTION",
		    "table": "article",
		  },
		}
	`);

	expect(result).toEqual(getRelation(schema, 'users', 'articles'));
});

test('relation on o2m field', () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('tags').o2m('tags', 'article_id');
		})
		.build();

	const result = getRelation(schema, 'article', 'tags');

	expect(result).toMatchInlineSnapshot(`
		{
		  "collection": "tags",
		  "field": "article_id",
		  "meta": {
		    "id": 0,
		    "junction_field": null,
		    "many_collection": "tags",
		    "many_field": "article_id",
		    "one_allowed_collections": null,
		    "one_collection": "article",
		    "one_collection_field": null,
		    "one_deselect_action": "nullify",
		    "one_field": "tags",
		    "sort_field": null,
		  },
		  "related_collection": "article",
		  "schema": {
		    "column": "tags",
		    "constraint_name": "article_tags_foreign",
		    "foreign_key_schema": "public",
		    "foreign_key_table": "tags",
		    "on_delete": "SET NULL",
		    "on_update": "NO ACTION",
		    "table": "article",
		  },
		}
	`);

	expect(result).toEqual(getRelation(schema, 'tags', 'article_id'));
});

test('relation on wrong collection', () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('tags').o2m('tags', 'article_id');
		})
		.build();

	const result = getRelation(schema, 'wrong', 'tags');

	expect(result).toBeUndefined();
});

test('relation on wrong field', () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('tags').o2m('tags', 'article_id');
		})
		.build();

	const result = getRelation(schema, 'article', 'wrong');

	expect(result).toBeUndefined();
});
