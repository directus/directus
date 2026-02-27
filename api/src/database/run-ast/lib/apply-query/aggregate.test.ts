import { SchemaBuilder } from '@directus/schema-builder';
import knex from 'knex';
import { expect, test, vi } from 'vitest';
import { applyAggregate } from './aggregate.js';
import { Client_SQLite3 } from './mock.js';

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('author').m2o('users');
	})
	.build();

test('aggregate empty', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(schema, queryBuilder, {}, 'articles', true);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select *`);
	expect(rawQuery.bindings).toEqual([]);
});

test('aggregate counting id and title', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(
		schema,
		queryBuilder,
		{
			count: ['id', 'title'],
		},
		'articles',
		true,
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select count("articles"."id") as "count->id", count("articles"."title") as "count->title"`,
	);

	expect(rawQuery.bindings).toEqual([]);
});

test('aggregate counting * without joins', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(
		schema,
		queryBuilder,
		{
			count: ['*'],
		},
		'articles',
		false,
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select count(*) as "count"`);
	expect(rawQuery.bindings).toEqual([]);
});

test('aggregate counting * with joins uses regular count (deduplication handled upstream)', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(
		schema,
		queryBuilder,
		{
			count: ['*'],
		},
		'articles',
		true,
	);

	const rawQuery = queryBuilder.toSQL();

	// applyAggregate now always uses regular count(*) - deduplication is handled in getDBQuery
	expect(rawQuery.sql).toEqual(`select count(*) as "count"`);
	expect(rawQuery.bindings).toEqual([]);
});

test('aggregate countDistinct title', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(
		schema,
		queryBuilder,
		{
			countDistinct: ['title'],
		},
		'articles',
		false,
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select count(distinct "articles"."title") as "countDistinct->title"`);
	expect(rawQuery.bindings).toEqual([]);
});

test('aggregate countDistinct id as it is unique', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(
		schema,
		queryBuilder,
		{
			countDistinct: ['id'],
		},
		'articles',
		false,
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select count("articles"."id") as "countDistinct->id"`);
	expect(rawQuery.bindings).toEqual([]);
});

test('aggregate countAll', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(
		schema,
		queryBuilder,
		{
			countAll: ['*'],
		},
		'articles',
		false,
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select count(*) as "countAll"`);
	expect(rawQuery.bindings).toEqual([]);
});

test('aggregate count o2m', async () => {
	const o2mSchema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('title').string();
			c.field('links').o2m('link_list', 'article_id');
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(
		o2mSchema,
		queryBuilder,
		{
			count: ['links'],
		},
		'articles',
		false,
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select count("articles"."links") as "count->links"`);
	expect(rawQuery.bindings).toEqual([]);
});
