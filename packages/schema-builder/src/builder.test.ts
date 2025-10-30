import { expect, test } from 'vitest';
import { SchemaBuilder } from './builder.js';
import { CollectionBuilder } from './collection.js';
import { FieldBuilder } from './field.js';

test('Create primitive schema', () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('title').string();
			c.field('content').text();
			c.field('published').dateTime();
		})
		.build();

	expect(schema).toMatchInlineSnapshot(`
		{
		  "collections": {
		    "articles": {
		      "accountability": "all",
		      "collection": "articles",
		      "fields": {
		        "content": {
		          "alias": false,
		          "dbType": "text",
		          "defaultValue": null,
		          "field": "content",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "text",
		          "validation": null,
		        },
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		        "published": {
		          "alias": false,
		          "dbType": "timestamp without time zone",
		          "defaultValue": null,
		          "field": "published",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "dateTime",
		          "validation": null,
		        },
		        "title": {
		          "alias": false,
		          "dbType": "character varying",
		          "defaultValue": null,
		          "field": "title",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "string",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		  },
		  "relations": [],
		}
	`);
});

test('Create o2m relation', () => {
	const schema = new SchemaBuilder()
		.collection('countries', (c) => {
			c.field('id').id();
			c.field('cities').o2m('cities', 'country_id');
		})
		.collection('cities', (c) => {
			c.field('id').id();
		})
		.build();

	expect(schema).toMatchInlineSnapshot(`
		{
		  "collections": {
		    "cities": {
		      "accountability": "all",
		      "collection": "cities",
		      "fields": {
		        "country_id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": null,
		          "field": "country_id",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		    "countries": {
		      "accountability": "all",
		      "collection": "countries",
		      "fields": {
		        "cities": {
		          "alias": false,
		          "dbType": null,
		          "defaultValue": null,
		          "field": "cities",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [
		            "o2m",
		          ],
		          "type": "alias",
		          "validation": null,
		        },
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		  },
		  "relations": [
		    {
		      "collection": "cities",
		      "field": "country_id",
		      "meta": {
		        "id": 0,
		        "junction_field": null,
		        "many_collection": "cities",
		        "many_field": "country_id",
		        "one_allowed_collections": null,
		        "one_collection": "countries",
		        "one_collection_field": null,
		        "one_deselect_action": "nullify",
		        "one_field": "cities",
		        "sort_field": null,
		      },
		      "related_collection": "countries",
		      "schema": {
		        "column": "cities",
		        "constraint_name": "countries_cities_foreign",
		        "foreign_key_schema": "public",
		        "foreign_key_table": "cities",
		        "on_delete": "SET NULL",
		        "on_update": "NO ACTION",
		        "table": "countries",
		      },
		    },
		  ],
		}
	`);
});

test('Create m2o relation', () => {
	const schema = new SchemaBuilder()
		.collection('cities', (c) => {
			c.field('id').id();
			c.field('country').m2o('countries');
		})
		.build();

	expect(schema).toMatchInlineSnapshot(`
		{
		  "collections": {
		    "cities": {
		      "accountability": "all",
		      "collection": "cities",
		      "fields": {
		        "country": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": null,
		          "field": "country",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [
		            "m2o",
		          ],
		          "type": "integer",
		          "validation": null,
		        },
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		    "countries": {
		      "accountability": "all",
		      "collection": "countries",
		      "fields": {
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		  },
		  "relations": [
		    {
		      "collection": "cities",
		      "field": "country",
		      "meta": {
		        "id": 0,
		        "junction_field": null,
		        "many_collection": "cities",
		        "many_field": "country",
		        "one_allowed_collections": null,
		        "one_collection": "countries",
		        "one_collection_field": null,
		        "one_deselect_action": "nullify",
		        "one_field": null,
		        "sort_field": null,
		      },
		      "related_collection": "countries",
		      "schema": {
		        "column": "country",
		        "constraint_name": "cities_country_foreign",
		        "foreign_key_schema": "public",
		        "foreign_key_table": "countries",
		        "on_delete": "SET NULL",
		        "on_update": "NO ACTION",
		        "table": "cities",
		      },
		    },
		  ],
		}
	`);
});

test('Create m2m relation', () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('tags').m2m('tags');
		})
		.build();

	expect(schema).toMatchInlineSnapshot(`
		{
		  "collections": {
		    "articles": {
		      "accountability": "all",
		      "collection": "articles",
		      "fields": {
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		        "tags": {
		          "alias": false,
		          "dbType": null,
		          "defaultValue": null,
		          "field": "tags",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [
		            "m2m",
		          ],
		          "type": "alias",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		    "articles_tags_junction": {
		      "accountability": "all",
		      "collection": "articles_tags_junction",
		      "fields": {
		        "articles_id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": null,
		          "field": "articles_id",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		        "tags_id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": null,
		          "field": "tags_id",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		    "tags": {
		      "accountability": "all",
		      "collection": "tags",
		      "fields": {
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		  },
		  "relations": [
		    {
		      "collection": "articles_tags_junction",
		      "field": "articles_id",
		      "meta": {
		        "id": 0,
		        "junction_field": "tags_id",
		        "many_collection": "articles_tags_junction",
		        "many_field": "articles_id",
		        "one_allowed_collections": null,
		        "one_collection": "articles",
		        "one_collection_field": null,
		        "one_deselect_action": "nullify",
		        "one_field": "tags",
		        "sort_field": null,
		      },
		      "related_collection": "articles",
		      "schema": {
		        "column": "tags",
		        "constraint_name": "articles_tags_foreign",
		        "foreign_key_schema": "public",
		        "foreign_key_table": "articles_tags_junction",
		        "on_delete": "SET NULL",
		        "on_update": "NO ACTION",
		        "table": "articles",
		      },
		    },
		    {
		      "collection": "articles_tags_junction",
		      "field": "tags_id",
		      "meta": {
		        "id": 0,
		        "junction_field": "articles_id",
		        "many_collection": "articles_tags_junction",
		        "many_field": "tags_id",
		        "one_allowed_collections": null,
		        "one_collection": "tags",
		        "one_collection_field": null,
		        "one_deselect_action": "nullify",
		        "one_field": null,
		        "sort_field": null,
		      },
		      "related_collection": "tags",
		      "schema": {
		        "column": "tags_id",
		        "constraint_name": "articles_tags_junction_tags_id_foreign",
		        "foreign_key_schema": "public",
		        "foreign_key_table": "tags",
		        "on_delete": "SET NULL",
		        "on_update": "NO ACTION",
		        "table": "articles_tags_junction",
		      },
		    },
		  ],
		}
	`);
});

test('Create m2a relation', () => {
	const schema = new SchemaBuilder()
		.collection('blog', (c) => {
			c.field('id').id();
			c.field('blocks').m2a(['text', 'image']);
		})
		.build();

	expect(schema).toMatchInlineSnapshot(`
		{
		  "collections": {
		    "blog": {
		      "accountability": "all",
		      "collection": "blog",
		      "fields": {
		        "blocks": {
		          "alias": false,
		          "dbType": null,
		          "defaultValue": null,
		          "field": "blocks",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [
		            "m2a",
		          ],
		          "type": "alias",
		          "validation": null,
		        },
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		    "blog_builder": {
		      "accountability": "all",
		      "collection": "blog_builder",
		      "fields": {
		        "blog_id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": null,
		          "field": "blog_id",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		        "collection": {
		          "alias": false,
		          "dbType": "character varying",
		          "defaultValue": null,
		          "field": "collection",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "string",
		          "validation": null,
		        },
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		        "item": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": null,
		          "field": "item",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		    "image": {
		      "accountability": "all",
		      "collection": "image",
		      "fields": {
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		    "text": {
		      "accountability": "all",
		      "collection": "text",
		      "fields": {
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		  },
		  "relations": [
		    {
		      "collection": "blog_builder",
		      "field": "blog_id",
		      "meta": {
		        "id": 0,
		        "junction_field": "item",
		        "many_collection": "blog_builder",
		        "many_field": "blog_id",
		        "one_allowed_collections": null,
		        "one_collection": "blog",
		        "one_collection_field": null,
		        "one_deselect_action": "nullify",
		        "one_field": "blocks",
		        "sort_field": null,
		      },
		      "related_collection": "blog",
		      "schema": {
		        "column": "blocks",
		        "constraint_name": "blog_blocks_foreign",
		        "foreign_key_schema": "public",
		        "foreign_key_table": "blog_builder",
		        "on_delete": "SET NULL",
		        "on_update": "NO ACTION",
		        "table": "blog",
		      },
		    },
		    {
		      "collection": "blog_builder",
		      "field": "item",
		      "meta": {
		        "id": 0,
		        "junction_field": "blog_id",
		        "many_collection": "blog_builder",
		        "many_field": "item",
		        "one_allowed_collections": [
		          "text",
		          "image",
		        ],
		        "one_collection": null,
		        "one_collection_field": "collection",
		        "one_deselect_action": "nullify",
		        "one_field": null,
		        "sort_field": null,
		      },
		      "related_collection": null,
		      "schema": null,
		    },
		  ],
		}
	`);
});

test('Create a2o relation', () => {
	const schema = new SchemaBuilder()
		.collection('blog', (c) => {
			c.field('id').id();
			c.field('blocks').a2o(['text', 'image']);
		})
		.build();

	expect(schema).toMatchInlineSnapshot(`
		{
		  "collections": {
		    "blog": {
		      "accountability": "all",
		      "collection": "blog",
		      "fields": {
		        "blocks": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": null,
		          "field": "blocks",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		        "collection": {
		          "alias": false,
		          "dbType": "character varying",
		          "defaultValue": null,
		          "field": "collection",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "string",
		          "validation": null,
		        },
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		    "image": {
		      "accountability": "all",
		      "collection": "image",
		      "fields": {
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		    "text": {
		      "accountability": "all",
		      "collection": "text",
		      "fields": {
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		  },
		  "relations": [
		    {
		      "collection": "blog",
		      "field": "blocks",
		      "meta": {
		        "id": 0,
		        "junction_field": null,
		        "many_collection": "blog",
		        "many_field": "blocks",
		        "one_allowed_collections": [
		          "text",
		          "image",
		        ],
		        "one_collection": null,
		        "one_collection_field": "collection",
		        "one_deselect_action": "nullify",
		        "one_field": null,
		        "sort_field": null,
		      },
		      "related_collection": null,
		      "schema": null,
		    },
		  ],
		}
	`);
});

test('Create translations relation', () => {
	const schema = new SchemaBuilder()
		.collection('blog', (c) => {
			c.field('id').id();
			c.field('translations').translations();
		})
		.build();

	expect(schema).toMatchInlineSnapshot(`
		{
		  "collections": {
		    "blog": {
		      "accountability": "all",
		      "collection": "blog",
		      "fields": {
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		        "translations": {
		          "alias": false,
		          "dbType": null,
		          "defaultValue": null,
		          "field": "translations",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [
		            "translations",
		          ],
		          "type": "alias",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		    "blog_translations": {
		      "accountability": "all",
		      "collection": "blog_translations",
		      "fields": {
		        "blog_id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": null,
		          "field": "blog_id",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		        "languages_code": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": null,
		          "field": "languages_code",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		    "languages": {
		      "accountability": "all",
		      "collection": "languages",
		      "fields": {
		        "code": {
		          "alias": false,
		          "dbType": "character varying",
		          "defaultValue": null,
		          "field": "code",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "string",
		          "validation": null,
		        },
		        "direction": {
		          "alias": false,
		          "dbType": "character varying",
		          "defaultValue": "ltr",
		          "field": "direction",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "string",
		          "validation": null,
		        },
		        "name": {
		          "alias": false,
		          "dbType": "character varying",
		          "defaultValue": null,
		          "field": "name",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "string",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "code",
		      "singleton": false,
		      "sortField": null,
		    },
		  },
		  "relations": [
		    {
		      "collection": "blog_translations",
		      "field": "blog_id",
		      "meta": {
		        "id": 0,
		        "junction_field": "languages_code",
		        "many_collection": "blog_translations",
		        "many_field": "blog_id",
		        "one_allowed_collections": null,
		        "one_collection": "blog",
		        "one_collection_field": null,
		        "one_deselect_action": "nullify",
		        "one_field": "translations",
		        "sort_field": null,
		      },
		      "related_collection": "blog",
		      "schema": {
		        "column": "translations",
		        "constraint_name": "blog_translations_foreign",
		        "foreign_key_schema": "public",
		        "foreign_key_table": "blog_translations",
		        "on_delete": "SET NULL",
		        "on_update": "NO ACTION",
		        "table": "blog",
		      },
		    },
		    {
		      "collection": "blog_translations",
		      "field": "languages_code",
		      "meta": {
		        "id": 0,
		        "junction_field": "blog_id",
		        "many_collection": "blog_translations",
		        "many_field": "languages_code",
		        "one_allowed_collections": null,
		        "one_collection": "languages",
		        "one_collection_field": null,
		        "one_deselect_action": "nullify",
		        "one_field": null,
		        "sort_field": null,
		      },
		      "related_collection": "languages",
		      "schema": {
		        "column": "languages_code",
		        "constraint_name": "blog_translations_languages_code_foreign",
		        "foreign_key_schema": "public",
		        "foreign_key_table": "languages",
		        "on_delete": "SET NULL",
		        "on_update": "NO ACTION",
		        "table": "blog_translations",
		      },
		    },
		  ],
		}
	`);
});

test('overwrite field', () => {
	const schema = new SchemaBuilder()
		.collection('blog', (c) => {
			c.field('id').id();
			c.field('name').string();
			c.field('name').overwrite().integer();
		})
		.build();

	expect(schema).toMatchInlineSnapshot(`
		{
		  "collections": {
		    "blog": {
		      "accountability": "all",
		      "collection": "blog",
		      "fields": {
		        "id": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": "AUTO_INCREMENT",
		          "field": "id",
		          "generated": false,
		          "note": null,
		          "nullable": false,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		        "name": {
		          "alias": false,
		          "dbType": "integer",
		          "defaultValue": null,
		          "field": "name",
		          "generated": false,
		          "note": null,
		          "nullable": true,
		          "precision": null,
		          "scale": null,
		          "searchable": true,
		          "special": [],
		          "type": "integer",
		          "validation": null,
		        },
		      },
		      "note": null,
		      "primary": "id",
		      "singleton": false,
		      "sortField": null,
		    },
		  },
		  "relations": [],
		}
	`);
});

test('create empty collection', () => {
	const schema = new SchemaBuilder().collection('blog', (_) => {});

	expect(() => {
		schema.build();
	}).toThrowError('The collection blog needs a primary key');
});

test('create duplicate collection', () => {
	const schema = new SchemaBuilder().collection('blog', (c) => {
		c.field('id').id();
	});

	const dup_coll = new CollectionBuilder('blog');
	dup_coll.field('id').id();
	schema._collections.push(dup_coll);

	expect(() => {
		schema.build();
	}).toThrowError('Collection blog already exists');
});

test('create duplicate id', () => {
	expect(() => {
		new SchemaBuilder().collection('blog', (c) => {
			c.field('id').id();
			c.field('id').id();
		});
	}).toThrowError('The primary key is already set on the collection blog');
});

test('create duplicate field', () => {
	expect(() => {
		new SchemaBuilder().collection('blog', (c) => {
			c.field('id').id();
			c.field('name').string();
			c.field('name').string();
		});
	}).toThrowError('Field type was already set');
});

test('create duplicate field with collision', () => {
	const schema = new SchemaBuilder().collection('blog', (c) => {
		c.field('id').id();
		c.field('name').string();

		c._fields.push(new FieldBuilder('name').string());
	});

	expect(() => {
		schema.build();
	}).toThrowError('Field name already exists');
});

test('define type twice', () => {
	expect(() => {
		new SchemaBuilder().collection('blog', (c) => {
			c.field('id').id().string();
		});
	}).toThrowError('Field type was already set');
});
