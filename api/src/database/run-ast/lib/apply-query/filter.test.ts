import { SchemaBuilder } from '@directus/schema-builder';
import knex from 'knex';
import { describe, expect, test, vi } from 'vitest';
import { applyFilter } from './filter.js';
import { Client_SQLite3 } from './mock.js';

describe('boolean filter operators', () => {
	const operators = [
		{
			filterOperator: 'null',
			sqlWhereClause: {
				true: '$column is null',
				false: '$column is not null',
			},
		},
		{
			filterOperator: 'empty',
			sqlWhereClause: {
				true: '($column is null or $column = ?)',
				false: '($column is not null and $column != ?)',
			},
		},
	];

	const withReverseOperators = operators.reduce((acc, cur) => {
		const reverse = {
			filterOperator: `n${cur.filterOperator}`,
			sqlWhereClause: {
				true: cur.sqlWhereClause.false,
				false: cur.sqlWhereClause.true,
			},
		};

		acc.push(reverse);
		return acc;
	}, operators);

	const schema = new SchemaBuilder()
		.collection('test', (c) => {
			c.field('id').uuid().primary()
			c.field('text').text()
			c.field('string').string()
			c.field('float').float()
			c.field('integer').integer()
		}).build()

	for (const { filterOperator, sqlWhereClause } of withReverseOperators) {
		for (const filterValue of [true, '', false]) {
			test(`${filterOperator} with value ${filterValue}`, async () => {
				const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
				const queryBuilder = db.queryBuilder();

				const collection = 'test';
				const field = 'text';

				const rootFilter = {
					_and: [{ [field]: { [`_${filterOperator}`]: filterValue } }],
				};

				applyFilter(db, schema, queryBuilder, rootFilter, collection, {}, [], []);

				const rawQuery = queryBuilder.toSQL();

				const expectedSql = sqlWhereClause[filterValue === false ? 'false' : 'true'].replaceAll(
					'$column',
					`"${collection}"."${field}"`,
				);

				expect(rawQuery.sql).toEqual(`select * where (${expectedSql})`);
			});
		}
	}
});

test(`filter values on bigint fields are correctly passed as such to db query`, async () => {
	const collection = 'test';
	const field = 'bigInteger';

	const schema = new SchemaBuilder()
		.collection(collection, (c) => {
			c.field("id").id()
			c.field(field).bigInteger()
		}).build()

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	// testing with value greater than Number.MAX_SAFE_INTEGER
	const bigintId = 9007199254740991477n;

	const rootFilter = {
		[field]: {
			_eq: bigintId.toString(),
		},
	};

	applyFilter(db, schema, queryBuilder, rootFilter, collection, {}, [], []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where "${collection}"."${field}" = ?`);
	expect(rawQuery.bindings).toEqual([bigintId.toString()]);
});

test.each([
	{ operator: '_eq', replacement: '_null', sqlOutput: 'null' },
	{ operator: '_neq', replacement: '_nnull', sqlOutput: 'not null' },
])('$operator = null should behave as $replacement = true', async ({ operator, sqlOutput: sql }) => {
	const collection = 'test';
	const field = 'string';

	const schema = new SchemaBuilder()
		.collection(collection, (c) => {
			c.field("id").id()
			c.field(field).string()
		}).build()

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	const rootFilter = {
		[field]: {
			[operator]: null,
		},
	};

	applyFilter(db, schema, queryBuilder, rootFilter, collection, {}, [], []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where "${collection}"."${field}" is ${sql}`);
	expect(rawQuery.bindings).toEqual([]);

});
