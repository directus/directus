import type { SqlStatement } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { select } from './select.js';
import { getRandomIdentifier } from '@directus/data';

let sample: {
	statement: SqlStatement;
};

beforeEach(() => {
	sample = {
		statement: {
			select: [
				{
					type: 'primitive',
					column: getRandomIdentifier(),
					table: getRandomIdentifier(),
					as: getRandomIdentifier(),
				},
				{ type: 'primitive', column: getRandomIdentifier(), table: getRandomIdentifier() },
			],
			from: getRandomIdentifier(),
		},
	};
});

test('With multiple provided fields and an alias', () => {
	const res = select(sample.statement);

	const expected = `SELECT "${sample.statement.select[0]!.table}"."${sample.statement.select[0]!.column}" AS "${
		sample.statement.select[0]!.as
	}", "${sample.statement.select[1]!.table}"."${sample.statement.select[1]!.column}"`;

	expect(res).toStrictEqual(expected);
});
