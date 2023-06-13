import type { SqlStatement } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { from } from './from.js';
import { getRandomIdentifier } from '@directus/data';

let sample: {
	statement: SqlStatement;
};

beforeEach(() => {
	sample = {
		statement: {
			select: [],
			from: getRandomIdentifier(),
		},
	};
});

test('Returns parameterized FROM with escaped identifier', () => {
	expect(from(sample.statement)).toStrictEqual(`FROM "${sample.statement.from}"`);
});
