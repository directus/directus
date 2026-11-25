import { SchemaBuilder } from '@directus/schema-builder';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { describe, expect, test } from 'vitest';
import { VERSION_SYSTEM_FIELDS } from '../services/version-tables/constants.js';
import { extractVersioning, getVersionedRead, getVersionedReadSchema, getVersionTablesSchema } from './schema.js';

// The database helpers derive the dialect from the class name of the client
const db = knex.default({ client: class Client_PG extends MockClient {} });

const schema = extractVersioning(
	db,
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

	test('adds the read collection of every collection', () => {
		const { readCollections, readRelations } = schema.versioning!;

		expect(Object.keys(readCollections)).toEqual([
			'directus_versioned_articles',
			'directus_versioned_authors',
			'directus_versioned_categories',
		]);

		expect(readCollections['directus_versioned_articles']?.primary).toBe('directus_version_key');
		expect(readCollections['directus_versioned_articles']?.fields['version_ref_author']).toBeDefined();

		expect(readRelations).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ collection: 'directus_versioned_articles', field: 'author' }),
				expect.objectContaining({ collection: 'articles', related_collection: 'directus_versioned_authors' }),
				expect.objectContaining({
					collection: 'directus_versioned_articles',
					field: 'version_ref_author',
					related_collection: 'directus_shadow_authors',
				}),
			]),
		);
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
	test('describes the read collection of a versioned collection', () => {
		const read = getVersionedRead(db, schema, 'articles');

		expect(read).toMatchObject({ name: 'directus_versioned_articles', shadow: 'directus_shadow_articles', link: null });
		expect(read.versionFields).toContain('version_ref_author');
	});

	test('reads collections without version tables as live items only', () => {
		const read = getVersionedRead(db, schema, 'categories');

		expect(read).toMatchObject({ shadow: null, link: null });
		expect(read.versionFields).toEqual(Object.values(VERSION_SYSTEM_FIELDS));
	});
});

describe('getVersionedReadSchema', () => {
	test('merges the version tables and read collections once', () => {
		const readSchema = getVersionedReadSchema(schema);

		expect(readSchema.collections['directus_shadow_articles']).toBeDefined();
		expect(readSchema.collections['directus_versioned_articles']).toBeDefined();
		expect(getVersionedReadSchema(schema)).toBe(readSchema);
		expect(getVersionedReadSchema(getVersionTablesSchema(schema))).toBe(readSchema);
		expect(getVersionedReadSchema(readSchema)).toBe(readSchema);
		expect(getVersionTablesSchema(readSchema)).toBe(readSchema);
	});

	test('keeps the relations of the project ahead of the ones of the read collections', () => {
		const readSchema = getVersionedReadSchema(schema);

		const author = readSchema.relations.find(
			(relation) => relation.collection === 'articles' && relation.field === 'author',
		);

		expect(author?.related_collection).toBe('authors');
	});

	test('leaves the read collections out of the version tables schema', () => {
		expect(getVersionTablesSchema(schema).collections['directus_versioned_articles']).toBeUndefined();
	});
});
