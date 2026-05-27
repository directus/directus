import { SchemaBuilder } from '@directus/schema-builder';
import knex from 'knex';
import { createTracker } from 'knex-mock-client';
import { expect, test, vi } from 'vitest';
import { Client_SQLite3 } from './mock.js';

const { applySort } = await import('./sort.js');

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('links').o2m('link_list', 'article_id');
	})
	.build();

const schemaWithJson = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('metadata').json();
		c.field('category_id').m2o('categories');
	})
	.collection('categories', (c) => {
		c.field('id').id();
		c.field('metadata').json();
	})
	.build();

test('no sorting', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(db, schema, queryBuilder, [], 'articles', {});

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

	applySort(db, schema, queryBuilder, ['id'], 'articles', {});

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

	applySort(db, schema, queryBuilder, ['-id'], 'articles', {});

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

	applySort(db, schema, queryBuilder, ['id', 'title'], 'articles', {});

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

	applySort(db, schema, queryBuilder, ['title'], 'articles', {}, { aggregate: { count: ['*'] } });

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

	applySort(db, schema, queryBuilder, ['count'], 'articles', {}, { aggregate: { count: ['*'] } });

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

	applySort(db, schema, queryBuilder, ['count(links)'], 'articles', {});

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

	applySort(db, schema, queryBuilder, ['links'], 'articles', {}, { aggregate: { count: ['links'] } });

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(
		`select * left join "link_list" as "qljec" on "articles"."id" = "qljec"."article_id" order by "qljec"."id" asc`,
	);

	expect(rawQuery.bindings).toEqual([]);
});

test('sort by json() function asc', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(db, schemaWithJson, queryBuilder, ['json(metadata, color)'], 'articles', {});

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(`select * order by json_extract("articles"."metadata", ?) asc`);
	expect(rawQuery.bindings).toEqual(['$.color']);
});

test('sort by json() function desc', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(db, schemaWithJson, queryBuilder, ['-json(metadata, color)'], 'articles', {});

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(`select * order by json_extract("articles"."metadata", ?) desc`);
	expect(rawQuery.bindings).toEqual(['$.color']);
});

test('sort by json() with dotted path does not break tokenisation', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(db, schemaWithJson, queryBuilder, ['json(metadata, settings.theme)'], 'articles', {});

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(`select * order by json_extract("articles"."metadata", ?) asc`);
	expect(rawQuery.bindings).toEqual(['$.settings.theme']);
});

test('sort by alias resolving to json()', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(
		db,
		schemaWithJson,
		queryBuilder,
		['myColor'],
		'articles',
		{},
		{
			fieldAliasMap: { myColor: 'json(metadata, color)' },
		},
	);

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(`select * order by json_extract("articles"."metadata", ?) asc`);
	expect(rawQuery.bindings).toEqual(['$.color']);
});

test('sort desc by alias resolving to json()', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(
		db,
		schemaWithJson,
		queryBuilder,
		['-myColor'],
		'articles',
		{},
		{
			fieldAliasMap: { myColor: 'json(metadata, color)' },
		},
	);

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(`select * order by json_extract("articles"."metadata", ?) desc`);
	expect(rawQuery.bindings).toEqual(['$.color']);
});

test('sort by auto-generated json alias regenerates extraction expression', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(
		db,
		schemaWithJson,
		queryBuilder,
		['metadata_color_json'],
		'articles',
		{},
		{
			fieldAliasMap: { metadata_color_json: 'json(metadata, color)' },
		},
	);

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	expect(rawQuery.sql).toEqual(`select * order by json_extract("articles"."metadata", ?) asc`);
	expect(rawQuery.bindings).toEqual(['$.color']);
});

test('relational sort with json() generates JOIN and extraction expression', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySort(db, schemaWithJson, queryBuilder, ['category_id.json(metadata, color)'], 'articles', {});

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!;

	// Alias is deterministic based on collection/path/relationType — computed from generateJoinAlias
	expect(rawQuery.sql).toEqual(
		`select * left join "categories" as "augiz" on "articles"."category_id" = "augiz"."id" order by json_extract("augiz"."metadata", ?) asc`,
	);

	expect(rawQuery.bindings).toEqual(['$.color']);
});
