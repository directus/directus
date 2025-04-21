import { SchemaBuilder } from '@directus/schema-builder';
import type { Permission } from '@directus/types';
import knex from 'knex';
import { expect, test, vi } from 'vitest';
import { Client_SQLite3 } from './mock.js';
import { applySearch } from './search.js';

const schema = new SchemaBuilder()
	.collection('test', (c) => {
		c.field('id').uuid().primary();
		c.field('text').text();
		c.field('string').string();
		c.field('float').float();
		c.field('integer').integer();
	})
	.build();

const permissions = [
	{
		collection: 'test',
		action: 'read',
		fields: ['text', 'float', 'integer', 'id'],
		permissions: {
			text: {},
		},
	},
] as unknown as Permission[];

for (const number of ['0x56071c902718e681e274DB0AaC9B4Ed2d027924d', '0b11111', '0.42e3', 'Infinity', '42.000']) {
	test(`Prevent ${number} from being cast to number`, async () => {
		const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
		const queryBuilder = db.queryBuilder();

		applySearch(db as any, schema, queryBuilder, number, 'test', {}, permissions);

		const rawQuery = queryBuilder.toSQL();

		expect(rawQuery.sql).toEqual(`select * where ((LOWER("test"."text") LIKE ?))`);
		expect(rawQuery.bindings).toEqual([`%${number.toLowerCase()}%`]);
	});
}

for (const number of ['1234', '-128', '12.34']) {
	test(`Casting number ${number}`, async () => {
		const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
		const queryBuilder = db.queryBuilder();

		applySearch(db as any, schema, queryBuilder, number, 'test', {}, permissions);

		const rawQuery = queryBuilder.toSQL();

		expect(rawQuery.sql).toEqual(
			`select * where ((LOWER("test"."text") LIKE ?) or ("test"."float" = ?) or ("test"."integer" = ?))`,
		);

		expect(rawQuery.bindings).toEqual([`%${number.toLowerCase()}%`, Number(number), Number(number)]);
	});
}

test(`Query is falsy if no other clause is added`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	const schema = new SchemaBuilder()
		.collection('test', (c) => {
			c.field('id').uuid().primary();
			c.field('string').string();
			c.field('float').float();
			c.field('integer').integer();
		})
		.build();

	applySearch(db as any, schema, queryBuilder, 'searchstring', 'test', {}, permissions);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where (1 = 0)`);
	expect(rawQuery.bindings).toEqual([]);
});

test(`Exclude non uuid searchable field(s) when searchQuery has valid uuid value`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, '4b9adc65-4ad8-4242-9144-fbfc58400d74', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['id', 'text'],
			permissions: null,
		} as unknown as Permission,
	]);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where (("test"."id" = ?) or (LOWER("test"."text") LIKE ?))`);
	expect(rawQuery.bindings).toEqual(['4b9adc65-4ad8-4242-9144-fbfc58400d74', '%4b9adc65-4ad8-4242-9144-fbfc58400d74%']);
});

test(`Remove forbidden field(s) from search`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, 'directus', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['string'],
			permissions: {
				text: {},
			},
		} as unknown as Permission,
	]);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where ((LOWER("test"."string") LIKE ?))`);
	expect(rawQuery.bindings).toEqual(['%directus%']);
});

test(`Add all fields for * field rule`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, '1', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['*'],
			permissions: null,
		} as unknown as Permission,
	]);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * where (LOWER("test"."text") LIKE ? or LOWER("test"."string") LIKE ? or "test"."float" = ? or "test"."integer" = ?)`,
	);

	expect(rawQuery.bindings).toEqual(['%1%', '%1%', 1, 1]);
});

test(`Add all fields when * is present in field rule with permission rule present`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, '1', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['*', 'text'],
			permissions: {
				text: {},
			},
		} as unknown as Permission,
	]);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * where (LOWER("test"."text") LIKE ? or LOWER("test"."string") LIKE ? or "test"."float" = ? or "test"."integer" = ?)`,
	);

	expect(rawQuery.bindings).toEqual(['%1%', '%1%', 1, 1]);
});

test(`All field(s) are searched for admin`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, '1', 'test', {}, []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * where (LOWER("test"."text") LIKE ? or LOWER("test"."string") LIKE ? or "test"."float" = ? or "test"."integer" = ?)`,
	);

	expect(rawQuery.bindings).toEqual(['%1%', '%1%', 1, 1]);
});
