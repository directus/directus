import { useEnv } from '@directus/env';
import { SchemaBuilder } from '@directus/schema-builder';
import knex from 'knex';
import { expect, test, vi } from 'vitest';
import { Client_SQLite3 } from './mock.js';
import { applySearch } from './search.js';

const schema = new SchemaBuilder()
	.collection('test', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('o2m_relation').o2m('o2m_related', 'test_id');
		c.field('translations').translations();
		c.field('m2m_relation').m2m('m2m_related');
	})
	.collection('m2m_related', (c) => {
		c.field('id').id();
		c.field('name').string();
		c.field('m2m_relation_sub').o2m('m2m_relation_sub', 'm2m_related_id');
	})
	.collection('m2m_relation_sub', (c) => {
		c.field('id').id();
		c.field('name').string();
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

test('Relational search should be disabled if SEARCH_RELATION_MAX_DEPTH = 0', async () => {
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, 'foo', 'test', {}, []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where (LOWER("test"."title") LIKE ?)`);
});

test('Relational search should only include searchable relations', async () => {
	Object.assign(useEnv(), { SEARCH_RELATION_MAX_DEPTH: Infinity });
	schema.collections['test']!.fields['translations']!.searchable = false;
	schema.collections['test']!.fields['m2m_relation']!.searchable = false;

	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, 'foo', 'test', {}, []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * where (LOWER("test"."title") LIKE ? or exists (select * from "o2m_related" where "o2m_related"."test_id" = "test"."id" and ((LOWER("o2m_related"."name") LIKE ? or exists (select * from "o2m_related_sub" where "o2m_related_sub"."o2m_related_id" = "o2m_related"."id" and ((LOWER("o2m_related_sub"."name") LIKE ?)))))))`,
	);
});

test('Relational search should handle o2m relations', async () => {
	Object.assign(useEnv(), { SEARCH_RELATION_MAX_DEPTH: Infinity });

	schema.collections['test']!.fields['translations']!.searchable = true;

	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, 'foo', 'test', {}, []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * where (LOWER("test"."title") LIKE ? or exists (select * from "o2m_related" where "o2m_related"."test_id" = "test"."id" and ((LOWER("o2m_related"."name") LIKE ? or exists (select * from "o2m_related_sub" where "o2m_related_sub"."o2m_related_id" = "o2m_related"."id" and ((LOWER("o2m_related_sub"."name") LIKE ?)))))) or exists (select * from "test_translations" where "test_translations"."test_id" = "test"."id" and ((LOWER("test_translations"."name") LIKE ?))))`,
	);
});

test('Relational search should handle nested m2m/o2m relations', async () => {
	Object.assign(useEnv(), { SEARCH_RELATION_MAX_DEPTH: Infinity });

	schema.collections['test']!.fields['m2m_relation']!.searchable = true;

	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, 'foo', 'test', {}, []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * where (LOWER("test"."title") LIKE ? or exists (select * from "o2m_related" where "o2m_related"."test_id" = "test"."id" and ((LOWER("o2m_related"."name") LIKE ? or exists (select * from "o2m_related_sub" where "o2m_related_sub"."o2m_related_id" = "o2m_related"."id" and ((LOWER("o2m_related_sub"."name") LIKE ?)))))) or exists (select * from "test_translations" where "test_translations"."test_id" = "test"."id" and ((LOWER("test_translations"."name") LIKE ?))) or exists (select * from "m2m_related" where "m2m_related"."id" in (select "test_m2m_related_junction"."m2m_related_id" from "test_m2m_related_junction" where "test_m2m_related_junction"."test_id" = "test"."id") and ((LOWER("m2m_related"."name") LIKE ? or exists (select * from "m2m_relation_sub" where "m2m_relation_sub"."m2m_related_id" = "m2m_related"."id" and ((LOWER("m2m_relation_sub"."name") LIKE ?)))))))`,
	);
});

test('Relational search should respect SEARCH_RELATION_MAX_DEPTH', async () => {
	Object.assign(useEnv(), { SEARCH_RELATION_MAX_DEPTH: 1 });
	const queryBuilder = db.queryBuilder();
	applySearch(db as any, schema, queryBuilder, 'foo', 'test', {}, []);
	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * where (LOWER("test"."title") LIKE ? or exists (select * from "o2m_related" where "o2m_related"."test_id" = "test"."id" and ((LOWER("o2m_related"."name") LIKE ?))) or exists (select * from "test_translations" where "test_translations"."test_id" = "test"."id" and ((LOWER("test_translations"."name") LIKE ?))) or exists (select * from "m2m_related" where "m2m_related"."id" in (select "test_m2m_related_junction"."m2m_related_id" from "test_m2m_related_junction" where "test_m2m_related_junction"."test_id" = "test"."id") and ((LOWER("m2m_related"."name") LIKE ?))))`,
	);

	Object.assign(useEnv(), { SEARCH_RELATION_MAX_DEPTH: 2 });
	const queryBuilder2 = db.queryBuilder();
	applySearch(db as any, schema, queryBuilder2, 'foo', 'test', {}, []);
	const rawQuery2 = queryBuilder2.toSQL();

	expect(rawQuery2.sql).toEqual(
		`select * where (LOWER("test"."title") LIKE ? or exists (select * from "o2m_related" where "o2m_related"."test_id" = "test"."id" and ((LOWER("o2m_related"."name") LIKE ? or exists (select * from "o2m_related_sub" where "o2m_related_sub"."o2m_related_id" = "o2m_related"."id" and ((LOWER("o2m_related_sub"."name") LIKE ?)))))) or exists (select * from "test_translations" where "test_translations"."test_id" = "test"."id" and ((LOWER("test_translations"."name") LIKE ?))) or exists (select * from "m2m_related" where "m2m_related"."id" in (select "test_m2m_related_junction"."m2m_related_id" from "test_m2m_related_junction" where "test_m2m_related_junction"."test_id" = "test"."id") and ((LOWER("m2m_related"."name") LIKE ? or exists (select * from "m2m_relation_sub" where "m2m_relation_sub"."m2m_related_id" = "m2m_related"."id" and ((LOWER("m2m_relation_sub"."name") LIKE ?)))))))`,
	);
});

test('Relational search should respect persmissions', async () => {
	Object.assign(useEnv(), { SEARCH_RELATION_MAX_DEPTH: Infinity });

	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, 'foo', 'test', {}, [
		{
			collection: 'o2m_related',
			fields: ['id'],
			action: 'read',
			permissions: null,
			policy: null,
			presets: null,
			validation: null,
		},
	]);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * where (LOWER("test"."title") LIKE ? or exists (select * from "o2m_related" where "o2m_related"."test_id" = "test"."id" and ((1 = 0))) or exists (select * from "test_translations" where "test_translations"."test_id" = "test"."id" and ((LOWER("test_translations"."name") LIKE ?))) or exists (select * from "m2m_related" where "m2m_related"."id" in (select "test_m2m_related_junction"."m2m_related_id" from "test_m2m_related_junction" where "test_m2m_related_junction"."test_id" = "test"."id") and ((LOWER("m2m_related"."name") LIKE ? or exists (select * from "m2m_relation_sub" where "m2m_relation_sub"."m2m_related_id" = "m2m_related"."id" and ((LOWER("m2m_relation_sub"."name") LIKE ?)))))))`,
	);
});
