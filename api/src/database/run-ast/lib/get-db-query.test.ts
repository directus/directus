import { SchemaBuilder } from '@directus/schema-builder';
import type { Filter, Query } from '@directus/types';
import knex from 'knex';
import { describe, expect, test, vi } from 'vitest';
import type { FieldNode } from '../../../types/ast.js';
import { Client_SQLite3 } from './apply-query/mock.js';
import { getDBQuery } from './get-db-query.js';

describe('getDBQuery aggregate pagination + relational filters', () => {
	test('does not apply pagination to the inner DISTINCT PK query', async () => {
		// Ensure default limit doesn't interfere with the test
		process.env.QUERY_LIMIT_DEFAULT = '10';

		const schema = new SchemaBuilder()
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('status').string();
				c.field('categories').m2m('categories_list');
			})
			.collection('categories_list', (c) => {
				c.field('id').id();
				c.field('name').string();
			})
			.build();

		const statusNode: FieldNode = {
			type: 'field',
			name: 'status',
			fieldKey: 'status',
			alias: false,
			whenCase: [],
		};

		// Filter with an M2M relational path to force JOINs and trigger the wrapper query logic.
		const filter: Filter = {
			categories: {
				// For M2M, the junction column uses the other collection name + `_id`
				categories_list_id: {
					id: { _eq: 1 },
				},
			},
		} as any;

		const query: Query = {
			aggregate: { count: ['*'] },
			group: ['status'],
			filter,
			limit: 1,
		};

		const db = vi.mocked(knex.default({ client: Client_SQLite3 }));

		const sqlQuery = getDBQuery(
			{
				table: 'articles',
				fieldNodes: [statusNode],
				o2mNodes: [],
				query,
				cases: [],
				permissions: [],
			},
			{ schema, knex: db as any },
		).toSQL();

		const sql = sqlQuery.sql.toLowerCase();

		// If pagination was incorrectly applied to the inner DISTINCT PK subquery,
		// we would see more than one `limit` token in the compiled SQL.
		expect((sql.match(/\blimit\b/g) ?? []).length).toBe(1);
	});

	test('does not apply pagination to inner DISTINCT PK for countDistinct (no groupBy)', async () => {
		process.env.QUERY_LIMIT_DEFAULT = '10';

		const schema = new SchemaBuilder()
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('status').string();
				c.field('categories').m2m('categories_list');
			})
			.collection('categories_list', (c) => {
				c.field('id').id();
				c.field('name').string();
			})
			.build();

		const filter: Filter = {
			categories: {
				categories_list_id: {
					id: { _eq: 1 },
				},
			},
		} as any;

		const query: Query = {
			aggregate: { countDistinct: ['status'] },
			filter,
			limit: 1,
		};

		const db = vi.mocked(knex.default({ client: Client_SQLite3 }));

		const sqlQuery = getDBQuery(
			{
				table: 'articles',
				// No fieldNodes are required here since we don't use groupBy.
				fieldNodes: [],
				o2mNodes: [],
				query,
				cases: [],
				permissions: [],
			},
			{ schema, knex: db as any },
		).toSQL();

		const sql = sqlQuery.sql.toLowerCase();

		expect((sql.match(/\blimit\b/g) ?? []).length).toBe(1);
	});

	test('without multi relational filters, does not add wrapper query join', async () => {
		process.env.QUERY_LIMIT_DEFAULT = '10';

		const schema = new SchemaBuilder()
			.collection('articles', (c) => {
				c.field('id').id();
				c.field('status').string();
				c.field('categories').m2m('categories_list');
			})
			.collection('categories_list', (c) => {
				c.field('id').id();
				c.field('name').string();
			})
			.build();

		const statusNode: FieldNode = {
			type: 'field',
			name: 'status',
			fieldKey: 'status',
			alias: false,
			whenCase: [],
		};

		// Primitive filter -> no multi-relational joins -> hasMultiRelationalFilter should remain false.
		const filter: Filter = {
			status: { _eq: 'published' },
		} as any;

		const query: Query = {
			aggregate: { count: ['*'] },
			group: ['status'],
			filter,
			limit: 1,
		};

		const db = vi.mocked(knex.default({ client: Client_SQLite3 }));

		const sqlQuery = getDBQuery(
			{
				table: 'articles',
				fieldNodes: [statusNode],
				o2mNodes: [],
				query,
				cases: [],
				permissions: [],
			},
			{ schema, knex: db as any },
		).toSQL();

		const sql = sqlQuery.sql.toLowerCase();

		// The wrapper logic joins the DISTINCT PK subquery using an `inner` alias.
		// If this is a non-relational query, that wrapper join should not appear.
		expect(sql).not.toMatch(/as\s+(?:"inner"|'inner'|inner)/);
	});
});
