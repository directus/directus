import type { Column } from '@directus/schema';
import type { Relation } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { type LiveCollection, planVersionTables } from './plan-version-tables.js';

function column(table: string, name: string, data_type = 'integer'): Column {
	return {
		table,
		name,
		data_type,
		max_length: null,
		numeric_precision: null,
		numeric_scale: null,
		is_primary_key: name === 'id',
	} as Column;
}

function m2o(collection: string, field: string, related: string | null, allowed?: string[]): Relation {
	return {
		collection,
		field,
		related_collection: related,
		schema: related ? ({ on_delete: 'SET NULL', foreign_key_column: 'id' } as Relation['schema']) : null,
		meta: allowed ? ({ one_allowed_collections: allowed } as Relation['meta']) : null,
	};
}

const columns = {
	articles: [column('articles', 'id'), column('articles', 'title', 'varchar'), column('articles', 'author')],
	authors: [column('authors', 'id'), column('authors', 'name', 'varchar')],
	tags: [column('tags', 'id'), column('tags', 'article')],
	comments: [
		column('comments', 'id'),
		column('comments', 'item', 'varchar'),
		column('comments', 'collection', 'varchar'),
	],
};

const collections: LiveCollection[] = [
	{ collection: 'articles', columns: columns.articles, relations: [m2o('articles', 'author', 'authors')] },
	{ collection: 'authors', columns: columns.authors, relations: [] },
	{ collection: 'tags', columns: columns.tags, relations: [m2o('tags', 'article', 'articles')] },
	{
		collection: 'comments',
		columns: columns.comments,
		relations: [m2o('comments', 'item', null, ['articles', 'authors'])],
	},
	// Version tables are ignored
	{
		collection: 'directus_shadow_articles',
		columns: [column('directus_shadow_articles', 'version_id')],
		relations: [m2o('directus_shadow_articles', 'id', 'articles')],
	},
];

describe('planVersionTables', () => {
	test('creates nothing when no collection is versioned', () => {
		expect(planVersionTables(collections, new Set())).toEqual([]);
	});

	test('creates a shadow table mirroring the live fields', () => {
		const [shadow] = planVersionTables(collections, new Set(['authors']));

		expect(shadow!.table).toBe('directus_shadow_authors');

		expect(shadow!.columns.map((column) => [column.kind, column.name])).toEqual([
			['meta', 'version_id'],
			['meta', 'version_name'],
			['meta', 'version_type'],
			['meta', 'version_date_created'],
			['meta', 'version_date_updated'],
			['meta', 'version_user_created'],
			['meta', 'version_user_updated'],
			['mirror', 'id'],
			['mirror', 'name'],
		]);

		// Archived versions keep the id of their removed live item, so the primary key isn't constrained
		expect(shadow!.foreignKeys.map((foreignKey) => foreignKey.column)).not.toContain('id');
	});

	test('keeps relational constraints and references versions of versioned related collections', () => {
		const tables = planVersionTables(collections, new Set(['articles', 'authors']));
		const shadow = tables.find((table) => table.table === 'directus_shadow_articles')!;

		expect(shadow.columns.map((column) => column.name)).toContain('version_ref_author');
		expect(shadow.columns.map((column) => column.name)).not.toContain('tags');

		expect(shadow.foreignKeys).toEqual(
			expect.arrayContaining([
				{ column: 'author', foreign_key_table: 'authors', foreign_key_column: 'id', on_delete: 'SET NULL' },
				{
					column: 'version_ref_author',
					foreign_key_table: 'directus_shadow_authors',
					foreign_key_column: 'version_id',
					on_delete: 'SET NULL',
				},
			]),
		);
	});

	test('does not reference versions of unversioned related collections', () => {
		const tables = planVersionTables(collections, new Set(['articles']));
		const shadow = tables.find((table) => table.table === 'directus_shadow_articles')!;

		expect(shadow.columns.map((column) => column.name)).not.toContain('version_ref_author');
	});

	test('creates link tables for collections pointing to versioned collections', () => {
		const tables = planVersionTables(collections, new Set(['articles']));

		expect(tables.map((table) => table.table).sort()).toEqual([
			'directus_link_comments',
			'directus_link_tags',
			'directus_shadow_articles',
		]);

		const link = tables.find((table) => table.table === 'directus_link_tags')!;

		expect(link.columns).toEqual([
			{ kind: 'mirror', name: 'id', source: columns.tags[0], primary: true },
			{ kind: 'reference', name: 'article' },
		]);

		expect(link.foreignKeys).toEqual([
			{ column: 'id', foreign_key_table: 'tags', foreign_key_column: 'id', on_delete: 'CASCADE' },
			{
				column: 'article',
				foreign_key_table: 'directus_shadow_articles',
				foreign_key_column: 'version_id',
				on_delete: 'SET NULL',
			},
		]);
	});

	test('does not add foreign keys for a2o references', () => {
		const tables = planVersionTables(collections, new Set(['authors']));
		const link = tables.find((table) => table.table === 'directus_link_comments')!;

		expect(link.columns.map((column) => column.name)).toEqual(['id', 'item']);
		expect(link.foreignKeys.map((foreignKey) => foreignKey.column)).toEqual(['id']);
	});

	test('throws when a live field conflicts with a version field', () => {
		const conflicting: LiveCollection[] = [
			{
				collection: 'authors',
				columns: [column('authors', 'id'), column('authors', 'version_name', 'varchar')],
				relations: [],
			},
		];

		expect(() => planVersionTables(conflicting, new Set(['authors']))).toThrow('conflicts with the versioning field');
	});

	test('only plans the version tables of the given collections', () => {
		const tables = planVersionTables([collections[2]!], new Set(['articles', 'tags']));

		expect(tables.map((table) => table.table)).toEqual(['directus_shadow_tags', 'directus_link_tags']);
	});
});
