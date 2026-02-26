import { InvalidQueryError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import knex from 'knex';
import { expect, test, vi } from 'vitest';
import { Client_SQLite3 } from '../mock.js';

const { applyOperator } = await import('./operator.js');

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('likes').integer();
		c.field('links').o2m('links', 'article_id');
	})
	.build();

for (const { field, operator, value, sql, bindings } of [
	{
		field: 'articles.title',
		operator: '_eq',
		value: 1,
		sql: `select * where "articles"."title" = ?`,
		bindings: [1],
	},
	{
		field: 'articles.title',
		operator: '_eq',
		value: null,
		sql: `select * where "articles"."title" is null`,
		bindings: [],
	},
	{
		field: 'articles.title',
		operator: '_null',
		value: true,
		sql: `select * where "articles"."title" is null`,
		bindings: [],
	},
	{
		field: 'articles.title',
		operator: '_nnull',
		value: false,
		sql: `select * where "articles"."title" is null`,
		bindings: [],
	},
	{
		field: 'articles.title',
		operator: '_empty',
		value: true,
		sql: `select * where ("articles"."title" is null or "articles"."title" = ?)`,
		bindings: [''],
	},
	{
		field: 'articles.count(links)',
		operator: '_eq',
		value: '123',
		sql: `select * where (select count(*) from "links" as "arvsw" where "arvsw"."article_id" = "articles"."id") = ?`,
		bindings: [123],
	},
	{
		field: 'articles.count(links)',
		operator: '_eq',
		value: ['123', '456'],
		sql: `select * where (select count(*) from "links" as "arvsw" where "arvsw"."article_id" = "articles"."id") = ?`,
		bindings: [[123, 456]],
	},
	{
		field: 'articles.title',
		operator: '_in',
		value: '123,abc,wow111',
		sql: `select * where "articles"."title" in (?, ?, ?)`,
		bindings: ['123', 'abc', 'wow111'],
	},
	{
		field: 'articles.likes',
		operator: '_eq',
		value: '123',
		sql: `select * where "articles"."likes" = ?`,
		bindings: [123],
	},
	{
		field: 'articles.likes',
		operator: '_eq',
		value: ['123', '546'],
		sql: `select * where "articles"."likes" = ?`,
		bindings: [[123, 546]],
	},
	{
		field: 'articles.likes',
		operator: '_eq',
		value: [undefined],
		sql: `select * where "articles"."likes" = ?`,
		bindings: [[]],
	},
]) {
	test(`applyOperator on ${field} ${operator} ${value}`, async () => {
		const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
		const queryBuilder = db.queryBuilder();

		applyOperator(db, queryBuilder, schema, field, operator, value);

		const rawQuery = queryBuilder.toSQL();

		expect(rawQuery.sql).toEqual(sql);
		expect(rawQuery.bindings).toEqual(bindings);
	});
}

test('applyOperator throws InvalidQueryError for non-numeric value on function-based numeric field', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	expect(() => applyOperator(db, queryBuilder, schema, 'articles.count(links)', '_eq', 'not-a-number')).toThrow(
		InvalidQueryError,
	);
});

test('applyOperator throws InvalidQueryError for non-numeric array value on function-based numeric field', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	expect(() => applyOperator(db, queryBuilder, schema, 'articles.count(links)', '_eq', ['abc', '123'])).toThrow(
		InvalidQueryError,
	);
});

test('applyOperator throws InvalidQueryError for non-numeric value on integer field', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	expect(() => applyOperator(db, queryBuilder, schema, 'articles.likes', '_eq', 'not-a-number')).toThrow(
		InvalidQueryError,
	);
});

test('applyOperator throws InvalidQueryError for non-numeric array value on integer field', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	expect(() => applyOperator(db, queryBuilder, schema, 'articles.likes', '_eq', ['abc', '123'])).toThrow(
		InvalidQueryError,
	);
});
