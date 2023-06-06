import type { SqlStatement } from '@directus/data-sql';
import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { from } from './from.js';

let sample: {
	statement: SqlStatement;
};

beforeEach(() => {
	sample = {
		statement: {
			select: [],
			from: randomAlpha(randomInteger(3, 25)),
		},
	};
});

test('Returns parameterized FROM with escaped identifier', () => {
	expect(from(sample.statement)).toStrictEqual(`FROM "${sample.statement.from}"`);
});
