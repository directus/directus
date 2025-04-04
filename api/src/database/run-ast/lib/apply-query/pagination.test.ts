import { expect, test, vi } from "vitest";
import { applyLimit, applyOffset } from "./pagination.js";
import knex from "knex";
import { createTracker } from "knex-mock-client";
import { Client_SQLite3 } from "./mock.js";

test('limit of 0', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyLimit(db, queryBuilder, 0)

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual("select * limit ?")
	expect(rawQuery.bindings).toEqual([0])
})

test('limit of 2 and where id = 1', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyLimit(db, queryBuilder, 2)

	queryBuilder.where('id', 1)

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual(`select * where "id" = ? limit ?`)
	expect(rawQuery.bindings).toEqual([1, 2])
})

test('limit of "50"', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyLimit(db, queryBuilder, "50")

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual("select *")
	expect(rawQuery.bindings).toEqual([])
})

test('offset of 0', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyOffset(db, queryBuilder, 0)

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual("select *")
	expect(rawQuery.bindings).toEqual([])
})

test('offset of 1', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyOffset(db, queryBuilder, 1)

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual("select * offset ?")
	expect(rawQuery.bindings).toEqual([1])
})

test('offset of 2 and where id = 1', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyOffset(db, queryBuilder, 2)

	queryBuilder.where('id', 1)

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual(`select * where "id" = ? offset ?`)
	expect(rawQuery.bindings).toEqual([1, 2])
})

test('offset of "50"', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyOffset(db, queryBuilder, "50")

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual("select *")
	expect(rawQuery.bindings).toEqual([])
})

test('limit and offset of 1', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyLimit(db, queryBuilder, 1)
	applyOffset(db, queryBuilder, 1)

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await queryBuilder;

	const rawQuery = tracker.history.all[0]!

	expect(rawQuery.sql).toEqual("select * limit ? offset ?")
	expect(rawQuery.bindings).toEqual([1, 1])
})
