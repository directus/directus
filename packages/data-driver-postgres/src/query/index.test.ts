import type { SqlStatement } from '@directus/data-sql';
import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { constructSql } from './index.js';

let sample: {
	statement: SqlStatement;
};

beforeEach(() => {
	sample = {
		statement: {
			select: [
				{ type: 'primitive', column: randomAlpha(randomInteger(3, 25)), table: randomAlpha(randomInteger(3, 25)) },
				{ type: 'primitive', column: randomAlpha(randomInteger(3, 25)), table: randomAlpha(randomInteger(3, 25)) },
			],
			from: randomAlpha(randomInteger(3, 25)),
		},
	};
});

test('very simple statement', () => {
	expect(constructSql(sample.statement)).toEqual({
		statement: `SELECT "${sample.statement.select[0]!.table}"."${sample.statement.select[0]!.column}", "${
			sample.statement.select[1]!.table
		}"."${sample.statement.select[1]!.column}" FROM "${sample.statement.from}";`,
		values: [],
	});
});

test('statement with a limit', () => {
	sample.statement.limit = randomInteger(1, 100);

	expect(constructSql(sample.statement)).toEqual({
		statement: `SELECT "${sample.statement.select[0]!.table}"."${sample.statement.select[0]!.column}", "${
			sample.statement.select[1]!.table
		}"."${sample.statement.select[1]!.column}" FROM "${sample.statement.from}" LIMIT $1;`,
		values: [sample.statement.limit],
	});
});

test('statement with a limit', () => {
	sample.statement.limit = randomInteger(1, 100);
	sample.statement.offset = randomInteger(1, 100);

	expect(constructSql(sample.statement)).toEqual({
		statement: `SELECT "${sample.statement.select[0]!.table}"."${sample.statement.select[0]!.column}", "${
			sample.statement.select[1]!.table
		}"."${sample.statement.select[1]!.column}" FROM "${sample.statement.from}" LIMIT $1 OFFSET $2;`,
		values: [sample.statement.limit, sample.statement.offset],
	});
});
