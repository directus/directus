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
		},
	};
});

test('basic statement', () => {
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

test('statement with a limit and an offset', () => {
	sample.statement.limit = randomInteger(1, 100);
	sample.statement.offset = randomInteger(1, 100);

	expect(constructSql(sample.statement)).toEqual({
		statement: `SELECT "${sample.statement.select[0]!.table}"."${sample.statement.select[0]!.column}", "${
			sample.statement.select[1]!.table
		}"."${sample.statement.select[1]!.column}" FROM "${sample.statement.from}" LIMIT $1 OFFSET $2;`,
		values: [sample.statement.limit, sample.statement.offset],
	});
});
