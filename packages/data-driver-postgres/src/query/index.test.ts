import type { SqlStatement } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { constructSql } from './index.js';
import { randomIdentifier } from '@directus/random';

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

test('very simple statement', () => {
	expect(constructSql(sample.statement)).toEqual(
		`SELECT "${sample.statement.select[0]!.table}"."${sample.statement.select[0]!.column}", "${
			sample.statement.select[1]!.table
		}"."${sample.statement.select[1]!.column}" FROM "${sample.statement.from}";`
	);
});
