import type { AbstractSqlQuery } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { constructSqlQuery } from './index.js';
import { randomIdentifier, randomInteger } from '@directus/random';

let sample: {
	statement: AbstractSqlQuery;
};

beforeEach(() => {
	sample = {
		statement: {
			select: [
				{ type: 'primitive', column: randomIdentifier(), table: randomIdentifier() },
				{ type: 'primitive', column: randomIdentifier(), table: randomIdentifier() },
			],
			from: randomIdentifier(),
			parameters: [],
		},
	};
});

test('basic statement', () => {
	expect(constructSqlQuery(sample.statement)).toEqual({
		statement: `SELECT "${sample.statement.select[0]!.table}"."${sample.statement.select[0]!.column}", "${
			sample.statement.select[1]!.table
		}"."${sample.statement.select[1]!.column}" FROM "${sample.statement.from}";`,
		parameters: [],
	});
});

test('statement with a limit', () => {
	sample.statement.limit = { parameterIndex: 0 };
	sample.statement.parameters = [randomInteger(1, 100)];

	expect(constructSqlQuery(sample.statement)).toEqual({
		statement: `SELECT "${sample.statement.select[0]!.table}"."${sample.statement.select[0]!.column}", "${
			sample.statement.select[1]!.table
		}"."${sample.statement.select[1]!.column}" FROM "${sample.statement.from}" LIMIT $1;`,
		parameters: sample.statement.parameters,
	});
});

test('statement with limit and offset', () => {
	sample.statement.limit = { parameterIndex: 0 };
	sample.statement.offset = { parameterIndex: 1 };
	sample.statement.parameters = [randomInteger(1, 100), randomInteger(1, 100)];

	expect(constructSqlQuery(sample.statement)).toEqual({
		statement: `SELECT "${sample.statement.select[0]!.table}"."${sample.statement.select[0]!.column}", "${
			sample.statement.select[1]!.table
		}"."${sample.statement.select[1]!.column}" FROM "${sample.statement.from}" LIMIT $1 OFFSET $2;`,
		parameters: sample.statement.parameters,
	});
});

test('statement with order', () => {
	sample.statement.order = [
		{
			orderBy: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			direction: 'ASC',
		},
	];

	expect(constructSqlQuery(sample.statement)).toEqual({
		statement: `SELECT "${sample.statement.select[0]!.table}"."${sample.statement.select[0]!.column}", "${
			sample.statement.select[1]!.table
		}"."${sample.statement.select[1]!.column}" FROM "${sample.statement.from}" ORDER BY "${
			// @ts-ignore
			sample.statement.order[0].orderBy.field
		}" ASC;`,
		parameters: sample.statement.parameters,
	});
});
