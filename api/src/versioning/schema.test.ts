import { SchemaBuilder } from '@directus/schema-builder';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { describe, expect, test } from 'vitest';
import { getHelpers } from '../database/helpers/index.js';
import { VERSION_SYSTEM_FIELDS } from '../services/version-tables/constants.js';
import { deriveVersionTables, extractVersioning, getVersionedRead, getVersionTablesSchema } from './schema.js';

// The database helpers derive the dialect from the class name of the client
const db = knex.default({ client: class Client_PG extends MockClient {} });

const schema = extractVersioning(
	new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('author').m2o('authors');
		})
		.options({ versioning: true })
		.collection('authors', (c) => {
			c.field('id').id();
		})
		.collection('categories', (c) => {
			c.field('id').id();
		})
		.collection('directus_shadow_articles', (c) => {
			c.field('version_id').id();
			c.field('id').integer();
			c.field('version_ref_author').m2o('directus_shadow_authors');
		})
		.collection('directus_shadow_authors', (c) => {
			c.field('version_id').id();
		})
		.build(),
);

describe('extractVersioning', () => {
	test('moves version tables and their relations out of the collections', () => {
		expect(Object.keys(schema.collections)).toEqual(['articles', 'authors', 'categories']);

		expect(Object.keys(schema.versioning!.collections)).toEqual([
			'directus_shadow_articles',
			'directus_shadow_authors',
		]);

		expect(schema.relations.map((relation) => relation.collection)).toEqual(['articles']);
		expect(schema.versioning!.relations.map((relation) => relation.field)).toEqual(['version_ref_author']);
	});
});

describe('deriveVersionTables', () => {
	const live = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();

			c.field('title')
				.string()
				.options({ special: ['cast-json'], defaultValue: 'Untitled' });

			c.field('author').m2o('authors');
			c.field('tags').o2m('tags', 'article');
		})
		.options({ versioning: true })
		.collection('authors', (c) => {
			c.field('id').id();
		})
		.collection('tags', (c) => {
			c.field('id').id();
		})
		.build();

	const helper = getHelpers(db).versioning;

	test('derives the shadow table of versioned collections', () => {
		const { collections } = deriveVersionTables(live, helper);
		const shadow = collections['directus_shadow_articles']!;

		expect(shadow.primary).toBe(VERSION_SYSTEM_FIELDS.id);

		expect(Object.keys(shadow.fields)).toEqual([...Object.values(VERSION_SYSTEM_FIELDS), 'id', 'title', 'author']);

		expect(shadow.fields['id']).toMatchObject({ type: 'integer', nullable: true, defaultValue: null });
		expect(shadow.fields['title']).toMatchObject({ type: 'string', special: [], defaultValue: null });
	});

	test('adds references and link tables only for versioned related collections', () => {
		const schema = new SchemaBuilder()
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('author').m2o('authors');
				c.field('tags').o2m('tags', 'article');
			})
			.options({ versioning: true })
			.collection('authors', (c) => {
				c.field('id').id();
			})
			.options({ versioning: true })
			.collection('tags', (c) => {
				c.field('id').id();
			})
			.build();

		const { collections, relations } = deriveVersionTables(schema, helper);

		expect(Object.keys(collections).sort()).toEqual([
			'directus_link_tags',
			'directus_shadow_articles',
			'directus_shadow_authors',
		]);

		expect(collections['directus_shadow_articles']!.fields['version_ref_author']).toMatchObject({ type: 'integer' });
		expect(collections['directus_link_tags']).toMatchObject({ primary: 'id' });
		expect(Object.keys(collections['directus_link_tags']!.fields)).toEqual(['id', 'version_ref_article']);

		expect(relations).toContainEqual(
			expect.objectContaining({
				collection: 'directus_link_tags',
				field: 'version_ref_article',
				related_collection: 'directus_shadow_articles',
			}),
		);
	});

	test('leaves out tables that do not exist', () => {
		const { collections } = deriveVersionTables(live, helper, () => false);

		expect(collections).toEqual({});
	});
});

describe('getVersionTablesSchema', () => {
	test('merges the version tables once', () => {
		const tables = getVersionTablesSchema(schema);

		expect(tables.collections['directus_shadow_articles']).toBeDefined();
		expect(getVersionTablesSchema(schema)).toBe(tables);
		expect(getVersionTablesSchema(tables)).toBe(tables);
	});
});

describe('getVersionedRead', () => {
	test('derives the read collection on first use and reuses it', () => {
		const read = getVersionedRead(db, schema, 'articles');

		expect(read).toMatchObject({ name: 'directus_versioned_articles', shadow: 'directus_shadow_articles', link: null });
		expect(read.schema.collections[read.name]?.primary).toBe('directus_version_key');
		expect(read.versionFields).toContain('version_ref_author');
		expect(getVersionedRead(db, schema, 'articles')).toBe(read);
		expect(getVersionedRead(db, getVersionTablesSchema(schema), 'articles')).toBe(read);
	});

	test('reads collections without version tables as live items only', () => {
		const read = getVersionedRead(db, schema, 'categories');

		expect(read).toMatchObject({ shadow: null, link: null });
		expect(read.versionFields).toEqual(Object.values(VERSION_SYSTEM_FIELDS));
	});
});
