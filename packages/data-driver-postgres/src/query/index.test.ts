import type { SqlStatement } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { constructSql } from './index.js';
import { getRandomIdentifier } from '@directus/data';

let sample: {
	statement: SqlStatement;
};

beforeEach(() => {
	sample = {
		statement: {
			select: [
				{ type: 'primitive', column: getRandomIdentifier(), table: getRandomIdentifier() },
				{ type: 'primitive', column: getRandomIdentifier(), table: getRandomIdentifier() },
			],
			from: getRandomIdentifier(),
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
