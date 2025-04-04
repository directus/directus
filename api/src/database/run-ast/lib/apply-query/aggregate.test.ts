import { SchemaBuilder } from "@directus/schema-builder";
import knex from "knex";
import { expect, test, vi } from "vitest";
import { Client_SQLite3 } from "./mock.js";
import { applyAggregate } from "./aggregate.js";
import { createTracker } from "knex-mock-client";

test('aggregate empty', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id()
			c.field('author').m2o('users')
		}).build()

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(schema, queryBuilder, {}, 'articles', true)

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual(`select *`)
	expect(rawQuery.bindings).toEqual([])
})

test('aggregate counting id and title', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id()
			c.field('title').string()
			c.field('author').m2o('users')
		}).build()

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(schema, queryBuilder, {
		count: ['id', 'title']
	}, 'articles', true)

	const tracker = createTracker(db);
	tracker.on.select('count').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual(`select count("articles"."id") as "count->id", count("articles"."title") as "count->title"`)
	expect(rawQuery.bindings).toEqual([])
})

test('aggregate counting *', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id()
			c.field('title').string()
			c.field('author').m2o('users')
		}).build()

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(schema, queryBuilder, {
		count: ['*']
	}, 'articles', true)

	const tracker = createTracker(db);
	tracker.on.select('count').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual(`select count(*) as "count"`)
	expect(rawQuery.bindings).toEqual([])
})

test('aggregate countDistinct title', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id()
			c.field('title').string()
			c.field('author').m2o('users')
		}).build()

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(schema, queryBuilder, {
		countDistinct: ['title']
	}, 'articles', false)

	const tracker = createTracker(db);
	tracker.on.select('count').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual(`select count(distinct "articles"."title") as "countDistinct->title"`)
	expect(rawQuery.bindings).toEqual([])
})

test('aggregate countDistinct id as it is unique', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id()
			c.field('title').string()
			c.field('author').m2o('users')
		}).build()

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(schema, queryBuilder, {
		countDistinct: ['id']
	}, 'articles', false)

	const tracker = createTracker(db);
	tracker.on.select('count').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual(`select count("articles"."id") as "countDistinct->id"`)
	expect(rawQuery.bindings).toEqual([])
})

test('aggregate countAll', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id()
			c.field('title').string()
			c.field('author').m2o('users')
		}).build()

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(schema, queryBuilder, {
		countAll: ['*']
	}, 'articles', false)

	const tracker = createTracker(db);
	tracker.on.select('count').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual(`select count(*) as "countAll"`)
	expect(rawQuery.bindings).toEqual([])
})
