import type { Column } from '@directus/schema';
import type { FieldOverview, Relation, SchemaOverview } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { planVersionTables } from './plan-version-tables.js';

function field(name: string, alias = false): FieldOverview {
	return { field: name, alias } as FieldOverview;
}

function column(table: string, name: string, data_type = 'integer'): Column {
	return { table, name, data_type, max_length: null, numeric_precision: null, numeric_scale: null } as Column;
}

function m2o(collection: string, field: string, related: string | null, allowed?: string[]): Relation {
	return {
		collection,
		field,
		related_collection: related,
		schema: related ? ({ on_delete: 'SET NULL' } as Relation['schema']) : null,
		meta: allowed ? ({ one_allowed_collections: allowed } as Relation['meta']) : null,
	};
}

const schema = {
	collections: {
		articles: {
			primary: 'id',
			fields: { id: field('id'), title: field('title'), author: field('author'), tags: field('tags', true) },
		},
		authors: { primary: 'id', fields: { id: field('id'), name: field('name') } },
		tags: { primary: 'id', fields: { id: field('id'), article: field('article') } },
		comments: { primary: 'id', fields: { id: field('id'), item: field('item'), collection: field('collection') } },
		directus_shadow_articles: { primary: 'version_id', fields: { version_id: field('version_id') } },
	},
	relations: [
		m2o('articles', 'author', 'authors'),
		m2o('tags', 'article', 'articles'),
		m2o('comments', 'item', null, ['articles', 'authors']),
		m2o('directus_shadow_articles', 'id', 'articles'),
	],
} as unknown as SchemaOverview;

const columns: Record<string, Record<string, Column>> = {
	articles: {
		id: column('articles', 'id'),
		title: column('articles', 'title', 'varchar'),
		author: column('articles', 'author'),
	},
	authors: { id: column('authors', 'id'), name: column('authors', 'name', 'varchar') },
	tags: { id: column('tags', 'id'), article: column('tags', 'article') },
	comments: {
		id: column('comments', 'id'),
		item: column('comments', 'item', 'varchar'),
		collection: column('comments', 'collection', 'varchar'),
	},
};

describe('planVersionTables', () => {
	test('creates nothing when no collection is versioned', () => {
		expect(planVersionTables(schema, new Set(), columns)).toEqual([]);
	});

	test('creates a shadow table mirroring the live fields', () => {
		const [shadow] = planVersionTables(schema, new Set(['authors']), columns);

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
		const tables = planVersionTables(schema, new Set(['articles', 'authors']), columns);
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
		const tables = planVersionTables(schema, new Set(['articles']), columns);
		const shadow = tables.find((table) => table.table === 'directus_shadow_articles')!;

		expect(shadow.columns.map((column) => column.name)).not.toContain('version_ref_author');
	});

	test('creates link tables for collections pointing to versioned collections', () => {
		const tables = planVersionTables(schema, new Set(['articles']), columns);

		expect(tables.map((table) => table.table).sort()).toEqual([
			'directus_link_comments',
			'directus_link_tags',
			'directus_shadow_articles',
		]);

		const link = tables.find((table) => table.table === 'directus_link_tags')!;

		expect(link.columns).toEqual([
			{ kind: 'mirror', name: 'id', source: columns['tags']!['id'], primary: true },
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
		const tables = planVersionTables(schema, new Set(['authors']), columns);
		const link = tables.find((table) => table.table === 'directus_link_comments')!;

		expect(link.columns.map((column) => column.name)).toEqual(['id', 'item']);
		expect(link.foreignKeys.map((foreignKey) => foreignKey.column)).toEqual(['id']);
	});

	test('throws when a live field conflicts with a version field', () => {
		const conflicting = {
			...schema,
			collections: {
				...schema.collections,
				authors: { primary: 'id', fields: { id: field('id'), version_name: field('version_name') } },
			},
		} as unknown as SchemaOverview;

		expect(() =>
			planVersionTables(conflicting, new Set(['authors']), {
				...columns,
				authors: { id: column('authors', 'id'), version_name: column('authors', 'version_name', 'varchar') },
			}),
		).toThrow('conflicts with the versioning field');
	});
});
