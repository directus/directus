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

test('countDistinct on a non-unique field uses COUNT(DISTINCT ...)', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(schema, queryBuilder, { countDistinct: ['title'] }, 'articles', {
		hasJoins: false,
		hasMultiRelationalFilter: false,
		hasMultiRelationalSort: false,
	});

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select count(distinct "articles"."title") as "countDistinct->title"`);
	expect(rawQuery.bindings).toEqual([]);
});

test('countDistinct on the primary key optimizes to a plain COUNT when there are no joins', async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyAggregate(schema, queryBuilder, { countDistinct: ['id'] }, 'articles', {
		hasJoins: false,
		hasMultiRelationalFilter: false,
		hasMultiRelationalSort: false,
	});

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select count("articles"."id") as "countDistinct->id"`);
	expect(rawQuery.bindings).toEqual([]);
});
