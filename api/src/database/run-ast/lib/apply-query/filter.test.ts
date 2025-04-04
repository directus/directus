import type { SchemaOverview } from '@directus/types';
import knex from 'knex';
import { MockClient, createTracker } from 'knex-mock-client';
import { describe, expect, test, vi } from 'vitest';
import { applyFilter } from './filter.js';

const FAKE_SCHEMA: SchemaOverview = {
	collections: {
		test: {
			collection: 'test',
			primary: 'id',
			singleton: false,
			sortField: null,
			note: null,
			accountability: null,
			fields: {
				text: {
					field: 'text',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'text',
					dbType: null,
					precision: null,
					scale: null,
					special: [],
					note: null,
					validation: null,
					alias: false,
				},
				string: {
					field: 'string',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'string',
					dbType: null,
					precision: null,
					scale: null,
					special: [],
					note: null,
					validation: null,
					alias: false,
				},
				float: {
					field: 'float',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'float',
					dbType: null,
					precision: null,
					scale: null,
					special: [],
					note: null,
					validation: null,
					alias: false,
				},
				integer: {
					field: 'integer',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'integer',
					dbType: null,
					precision: null,
					scale: null,
					special: [],
					note: null,
					validation: null,
					alias: false,
				},
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'uuid',
					dbType: null,
					precision: null,
					scale: null,
					special: [],
					note: null,
					validation: null,
					alias: false,
				},
			},
		},
	},
	relations: [],
};

class Client_SQLite3 extends MockClient {}

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

				const { query } = applyFilter(db, FAKE_SCHEMA, queryBuilder, rootFilter, collection, {}, [], []);

				const tracker = createTracker(db);
				tracker.on.select('*').response([]);

				await query;

				const sql = tracker.history.select[0]?.sql.match(/select \* where \((.*)\)/)?.[1];

				const expectedSql = sqlWhereClause[filterValue === false ? 'false' : 'true'].replaceAll(
					'$column',
					`"${collection}"."${field}"`,
				);

				expect(sql).toEqual(expectedSql);
			});
		}
	}
});

test(`filter values on bigint fields are correctly passed as such to db query`, async () => {
	const collection = 'test';
	const field = 'bigInteger';

	const BIGINT_FAKE_SCHEMA: SchemaOverview = {
		collections: {
			[collection]: {
				collection: 'test',
				primary: 'id',
				singleton: false,
				sortField: null,
				note: null,
				accountability: null,
				fields: {
					[field]: {
						field: field,
						defaultValue: null,
						nullable: false,
						generated: false,
						type: 'bigInteger',
						dbType: null,
						precision: null,
						scale: null,
						special: [],
						note: null,
						validation: null,
						alias: false,
					},
				},
			},
		},
		relations: [],
	};

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	// testing with value greater than Number.MAX_SAFE_INTEGER
	const bigintId = 9007199254740991477n;

	const rootFilter = {
		[field]: {
			_eq: bigintId.toString(),
		},
	};

	const { query } = applyFilter(db, BIGINT_FAKE_SCHEMA, queryBuilder, rootFilter, collection, {}, [], []);

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await query;

	const resultingSelectQuery = tracker.history.select[0];
	const expectedSql = `select * where "${collection}"."${field}" = ?`;

	expect(resultingSelectQuery?.sql).toEqual(expectedSql);
	expect(resultingSelectQuery?.bindings[0]).toEqual(bigintId.toString());
});

test.each([
	{ operator: '_eq', replacement: '_null', sqlOutput: 'null' },
	{ operator: '_neq', replacement: '_nnull', sqlOutput: 'not null' },
])('$operator = null should behave as $replacement = true', async ({ operator, sqlOutput: sql }) => {
	const collection = 'test';
	const field = 'string';

	const sampleSchema: SchemaOverview = {
		collections: {
			[collection]: {
				collection,
				primary: 'id',
				singleton: false,
				sortField: null,
				note: null,
				accountability: null,
				fields: {
					[field]: {
						field,
						defaultValue: null,
						nullable: false,
						generated: false,
						type: 'string',
						dbType: null,
						precision: null,
						scale: null,
						special: [],
						note: null,
						validation: null,
						alias: false,
					},
				},
			},
		},
		relations: [],
	};

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	const rootFilter = {
		[field]: {
			[operator]: null,
		},
	};

	const { query } = applyFilter(db, sampleSchema, queryBuilder, rootFilter, collection, {}, [], []);

	const tracker = createTracker(db);
	tracker.on.select('*').response([]);

	await query;

	const resultingSelectQuery = tracker.history.select[0];
	const expectedSql = `select * where "${collection}"."${field}" is ${sql}`;

	expect(resultingSelectQuery?.sql).toEqual(expectedSql);
});
