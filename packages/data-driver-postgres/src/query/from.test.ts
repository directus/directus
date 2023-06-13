import type { SqlStatement } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { from } from './from.js';
import { randomIdentifier } from '@directus/random';

let sample: {
	statement: SqlStatement;
};

beforeEach(() => {
	sample = {
		statement: {
			select: [],
			from: randomIdentifier(),
		},
	};
});

test('Returns parameterized FROM with escaped identifier', () => {
	expect(from(sample.statement)).toStrictEqual(`FROM "${sample.statement.from}"`);
});
