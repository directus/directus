import { Client_SQLite3 } from './mock.js';
import { SchemaBuilder } from '@directus/schema-builder';
import knex from 'knex';
import { createTracker } from 'knex-mock-client';
import { expect, test, vi } from 'vitest';

const { applySort } = await import('./sort.js');

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('links').o2m('link_list', 'article_id');
	})
	.build();

test('no sorting', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(db, schema, queryBuilder, [], null, 'articles', {});

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(`select *`);
	expect(rawQuery.bindings).toEqual([]);
});

test('sorting of id', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(db, schema, queryBuilder, ['id'], null, 'articles', {});

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(`select * order by "articles"."id" asc`);
	expect(rawQuery.bindings).toEqual([]);
});

test('sorting of id desc', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(db, schema, queryBuilder, ['-id'], null, 'articles', {});

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(`select * order by "articles"."id" desc`);
	expect(rawQuery.bindings).toEqual([]);
});

test('sorting of id and title', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(db, schema, queryBuilder, ['id', 'title'], null, 'articles', {});

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(`select * order by "articles"."id" asc, "articles"."title" asc`);
	expect(rawQuery.bindings).toEqual([]);
});

test('sorting of title with unused aggregation', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(
		db,
		schema,
		queryBuilder,
		['title'],
		{
			count: ['*'],
		},
		'articles',
		{},
	);

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(`select * order by "articles"."title" asc`);
	expect(rawQuery.bindings).toEqual([]);
});

test('sorting of count(*) with aggregation', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(
		db,
		schema,
		queryBuilder,
		['count'],
		{
			count: ['*'],
		},
		'articles',
		{},
	);

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(`select * order by "count" asc`);
	expect(rawQuery.bindings).toEqual([]);
});

// TODO: count(id) would get optimized, does this take that case into account?
test('sorting of count(links)', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(db, schema, queryBuilder, ['count(links)'], undefined, 'articles', {});

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(
		`select * order by (select count(*) from "link_list" as "arvsw" where "arvsw"."article_id" = "articles"."id") asc`,
	);

	expect(rawQuery.bindings).toEqual([]);
});

// TODO: Why is this different from the previous test?
test('sorting of count(links) with aggregation', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(
		db,
		schema,
		queryBuilder,
		['links'],
		{
			count: ['links'],
		},
		'articles',
		{},
	);

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(
		`select * left join "link_list" as "qljec" on "articles"."id" = "qljec"."article_id" order by "qljec"."id" asc`,
	);

	expect(rawQuery.bindings).toEqual([]);
});
