import { SchemaBuilder } from '@directus/schema-builder';
import knex from 'knex';
import { expect, test, vi } from 'vitest';
import { Client_SQLite3 } from './mock.js';
import { applySearch } from './search.js';

test('Search includes fields from relations', async () => {
	const schema = new SchemaBuilder()
		.collection('test', (c) => {
			c.field('id').id();
			c.field('title').string();
			c.field('o2m_relation').o2m('o2m_related', 'test_id');
			// c.field('translations').translations();
			// c.field('m2m_relation').m2m('m2m_related')
		})
		.collection('m2m_related', (c) => {
			c.field('id').id();
			c.field('name').string();
		})
		.collection('test_m2m_related', (c) => {
			c.field('id').id();
			c.field('test_id').integer();
			c.field('m2m_related_id').integer();
		})
		.collection('o2m_related', (c) => {
			c.field('id').id();
			c.field('test_id').integer();
			c.field('name').string();
			c.field('o2m_sub_relation').o2m('o2m_related_sub', 'o2m_related_id');
		})
		.collection('o2m_related_sub', (c) => {
			c.field('id').id();
			c.field('o2m_related_id').integer();
			c.field('name').string();
		})
		.collection('test_translations', (c) => {
			c.field('id').id();
			c.field('test_id').integer();
			c.field('name').string();
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, 'foo', 'test', {}, []);

	const rawQuery = queryBuilder.toSQL();

	// It should search through nested relations and translations using exists subqueries
	expect(rawQuery.sql).toEqual(
		`select * where (LOWER("test"."title") LIKE ? or exists (select * from "o2m_related" where "o2m_related"."test_id" = "test"."id" and ((LOWER("o2m_related"."name") LIKE ? or exists (select * from "o2m_related_sub" where "o2m_related_sub"."o2m_related_id" = "o2m_related"."id" and ((LOWER("o2m_related_sub"."name") LIKE ?)))))))`,
	);
});
