import { SchemaBuilder } from '@directus/schema-builder';
import knex from 'knex';
import { expect, test, vi } from 'vitest';
import { Client_SQLite3 } from '../lib/apply-query/mock.js';

const { getColumn } = await import('./get-column.js');

test('column for simple field', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));

	const rawQuery = getColumn(db, 'articles', 'id', undefined, schema).toSQL();

	expect(rawQuery.sql).toEqual(`"articles"."id"`);
	expect(rawQuery.bindings).toEqual([]);
});

test('column for alias', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));

	const rawQuery = getColumn(db, 'articles', 'id', 'alias', schema).toSQL();

	expect(rawQuery.sql).toEqual(`"articles"."id" as "alias"`);
	expect(rawQuery.bindings).toEqual([]);
});

test('column for count function', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('links').o2m('links', 'article_id');
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));

	const rawQuery = getColumn(db, 'articles', 'count(links)', undefined, schema).toSQL();

	expect(rawQuery.sql).toEqual(
		`(select count(*) from "links" as "arvsw" where "arvsw"."article_id" = "articles"."id") AS "links_count"`,
	);

	expect(rawQuery.bindings).toEqual([]);
});

test('column for date function', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('created').date();
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));

	const rawQuery = getColumn(db, 'articles', 'day(created)', undefined, schema).toSQL();

	expect(rawQuery.sql).toEqual(
		`CAST(strftime('%d', "articles"."created" / 1000, 'unixepoch', 'localtime') AS INTEGER) AS "created_day"`,
	);

	expect(rawQuery.bindings).toEqual([]);
});

test('column for invalid function', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('created').date();
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));

	expect(() => {
		getColumn(db, 'articles', 'invalid(created)', undefined, schema).toSQL();
	}).toThrowError(`Invalid query. Invalid function specified "invalid".`);
});
