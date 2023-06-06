import type { SqlStatement } from '@directus/data-sql';
import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { select } from './select.js';

let sample: {
	statement: SqlStatement;
};

beforeEach(() => {
	sample = {
		statement: {
			select: [
				{
					type: 'primitive',
					column: randomAlpha(randomInteger(3, 25)),
					table: randomAlpha(randomInteger(3, 25)),
					as: randomAlpha(randomInteger(3, 25)),
				},
				{ type: 'primitive', column: randomAlpha(randomInteger(3, 25)), table: randomAlpha(randomInteger(3, 25)) },
			],
			from: randomAlpha(randomInteger(3, 25)),
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
