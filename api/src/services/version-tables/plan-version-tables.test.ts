import type { Column } from '@directus/schema';
import type { Relation } from '@directus/types';
import type { Knex } from 'knex';
import { keyBy } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import type { SchemaHelper } from '../../database/helpers/schema/types.js';
import { VersioningHelper } from '../../database/helpers/versioning/types.js';
import { type LiveCollection, type LiveCollections, planVersionTables } from './plan-version-tables.js';

const helper = new VersioningHelper({} as Knex, {} as SchemaHelper);

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

function m2o(
	collection: string,
	field: string,
	related: string | null,
	options: { allowed?: string[]; oneField?: string } = {},
): Relation {
	return {
		collection,
		field,
		related_collection: related,
		schema: related ? ({ on_delete: 'SET NULL', foreign_key_column: 'id' } as Relation['schema']) : null,
		meta: {
			one_allowed_collections: options.allowed ?? null,
			one_field: options.oneField ?? null,
		} as Relation['meta'],
	};
}

const columns = {
	articles: [column('articles', 'id'), column('articles', 'title', 'varchar'), column('articles', 'author')],
	authors: [column('authors', 'id'), column('authors', 'name', 'varchar')],
	tags: [column('tags', 'id'), column('tags', 'article')],
	comments: [
		column('comments', 'id'),
		column('comments', 'article'),
		column('comments', 'item', 'varchar'),
		column('comments', 'collection', 'varchar'),
	],
};

const collectionList: LiveCollection[] = [
	{ collection: 'articles', columns: columns.articles, relations: [m2o('articles', 'author', 'authors')] },
	{ collection: 'authors', columns: columns.authors, relations: [] },
	{
		collection: 'tags',
		columns: columns.tags,
		relations: [m2o('tags', 'article', 'articles', { oneField: 'tags' })],
	},
	{
		collection: 'comments',
		columns: columns.comments,
		relations: [
			m2o('comments', 'article', 'articles', { oneField: 'comments' }),
			m2o('comments', 'item', null, { allowed: ['articles', 'authors'] }),
		],
	},
	// Version tables are ignored
	{
		collection: 'directus_shadow_articles',
		columns: [column('directus_shadow_articles', 'version_id')],
		relations: [m2o('directus_shadow_articles', 'id', 'articles')],
	},
];

const collections: LiveCollections = keyBy(collectionList, 'collection');

describe('planVersionTables', () => {
	test('creates nothing when no collection is versioned', () => {
		expect(planVersionTables(collections, new Set(), helper)).toEqual({});
	});

	test('creates a shadow table mirroring the live fields', () => {
		const tables = planVersionTables(collections, new Set(['authors']), helper);
		const shadow = tables['directus_shadow_authors'];

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
		const tables = planVersionTables(collections, new Set(['articles', 'authors']), helper);
		const shadow = tables['directus_shadow_articles']!;

		expect(shadow.columns.map((column) => column.name)).toContain('version_ref_author');
		expect(shadow.columns.map((column) => column.name)).not.toContain('tags');

		expect(shadow.foreignKeys).toEqual(
			expect.arrayContaining([
				{
					column: 'author',
					foreign_key_table: 'authors',
					foreign_key_column: 'id',
					on_delete: 'SET NULL',
					on_update: null,
				},
				{
					column: 'version_ref_author',
					foreign_key_table: 'directus_shadow_authors',
					foreign_key_column: 'version_id',
					on_delete: 'SET NULL',
					on_update: null,
				},
			]),
		);
	});

	test('does not reference versions of unversioned related collections', () => {
		const tables = planVersionTables(collections, new Set(['articles']), helper);
		const shadow = tables['directus_shadow_articles']!;

		expect(shadow.columns.map((column) => column.name)).not.toContain('version_ref_author');
	});

	test('creates link tables for collections pointing to versioned collections', () => {
		const tables = planVersionTables(collections, new Set(['articles']), helper);

		expect(Object.keys(tables).sort()).toEqual([
			'directus_link_comments',
			'directus_link_tags',
			'directus_shadow_articles',
		]);

		const link = tables['directus_link_tags']!;

		expect(link.columns).toEqual([
			{ kind: 'mirror', name: 'id', source: columns.tags[0], primary: true },
			{ kind: 'reference', name: 'article' },
		]);

		expect(link.foreignKeys).toEqual([
			{ column: 'id', foreign_key_table: 'tags', foreign_key_column: 'id', on_delete: 'CASCADE', on_update: null },
			{
				column: 'article',
				foreign_key_table: 'directus_shadow_articles',
				foreign_key_column: 'version_id',
				on_delete: 'SET NULL',
				on_update: null,
			},
		]);
	});

	test('does not create link tables for m2o relations without an o2m on the versioned collection', () => {
		const tables = planVersionTables(collections, new Set(['authors']), helper);

		expect(Object.keys(tables)).toEqual(['directus_shadow_authors']);
	});

	test('does not create link tables for a2o relations alone', () => {
		const tables = planVersionTables(collections, new Set(['authors']), helper);

		expect(tables['directus_link_comments']).toBeUndefined();
	});

	test('does not create link tables for o2m relations on unversioned collections', () => {
		const tables = planVersionTables(collections, new Set(['tags']), helper);

		expect(Object.keys(tables)).toEqual(['directus_shadow_tags']);
	});

	test('references all versioned collections once a link table is needed', () => {
		const junction: LiveCollections = {
			junction: {
				collection: 'junction',
				columns: [column('junction', 'id'), column('junction', 'articles_id'), column('junction', 'authors_id')],
				relations: [
					m2o('junction', 'articles_id', 'articles', { oneField: 'authors' }),
					m2o('junction', 'authors_id', 'authors'),
				],
			},
		};

		const tables = planVersionTables(junction, new Set(['articles', 'authors']), helper);

		expect(tables['directus_link_junction']!.columns.map((column) => column.name)).toEqual([
			'id',
			'articles_id',
			'authors_id',
		]);
	});

	test('does not add foreign keys for a2o references', () => {
		const tables = planVersionTables(collections, new Set(['articles', 'authors']), helper);
		const link = tables['directus_link_comments']!;

		expect(link.columns.map((column) => column.name)).toEqual(['id', 'article', 'item']);
		expect(link.foreignKeys.map((foreignKey) => foreignKey.column)).toEqual(['id', 'article']);
	});

	test('throws when a live field conflicts with a version field', () => {
		const conflicting: LiveCollections = {
			authors: {
				collection: 'authors',
				columns: [column('authors', 'id'), column('authors', 'version_name', 'varchar')],
				relations: [],
			},
		};

		expect(() => planVersionTables(conflicting, new Set(['authors']), helper)).toThrow(
			'conflicts with the versioning field',
		);
	});

	test('copies the on update action of relational constraints', () => {
		const relation = m2o('articles', 'author', 'authors');
		relation.schema!.on_update = 'CASCADE';

		const tables = planVersionTables(
			{ articles: { ...collections['articles']!, relations: [relation] } },
			new Set(['articles']),
			helper,
		);

		expect(tables['directus_shadow_articles']!.foreignKeys).toContainEqual(
			expect.objectContaining({ column: 'author', on_update: 'CASCADE' }),
		);
	});

	test('only plans the version tables of the given collections', () => {
		const tables = planVersionTables({ tags: collections['tags']! }, new Set(['articles', 'tags']), helper);

		expect(Object.keys(tables)).toEqual(['directus_shadow_tags', 'directus_link_tags']);
	});
});
