import type { SqlStatement } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { constructSql } from './index.js';
import { randomIdentifier, randomInteger } from '@directus/random';

let sample: {
	statement: SqlStatement;
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
	expect(constructSql(sample.statement)).toEqual({
		statement: `SELECT "${sample.statement.select[0]!.table}"."${sample.statement.select[0]!.column}", "${
			sample.statement.select[1]!.table
		}"."${sample.statement.select[1]!.column}" FROM "${sample.statement.from}";`,
		parameters: [],
	});
});

test('statement with a limit', () => {
	sample.statement.limit = 0;
	sample.statement.parameters = [randomInteger(1, 100)];

	expect(constructSql(sample.statement)).toEqual({
		statement: `SELECT "${sample.statement.select[0]!.table}"."${sample.statement.select[0]!.column}", "${
			sample.statement.select[1]!.table
		}"."${sample.statement.select[1]!.column}" FROM "${sample.statement.from}" LIMIT $1;`,
		parameters: sample.statement.parameters,
	});
});

test('statement with a limit and an offset', () => {
	sample.statement.limit = 0;
	sample.statement.offset = 1;
	sample.statement.parameters = [randomInteger(1, 100), randomInteger(1, 100)];

	expect(constructSql(sample.statement)).toEqual({
		statement: `SELECT "${sample.statement.select[0]!.table}"."${sample.statement.select[0]!.column}", "${
			sample.statement.select[1]!.table
		}"."${sample.statement.select[1]!.column}" FROM "${sample.statement.from}" LIMIT $1 OFFSET $2;`,
		parameters: sample.statement.parameters,
	});
});
