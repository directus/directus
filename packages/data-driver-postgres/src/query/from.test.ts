import type { AbstractSqlQuery } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { from } from './from.js';
import { randomIdentifier } from '@directus/random';

let sample: {
	statement: AbstractSqlQuery;
};

beforeEach(() => {
	sample = {
		statement: {
			select: [],
			from: randomIdentifier(),
			parameters: [],
		},
	};
});

test('Returns parameterized FROM with escaped identifier', () => {
	expect(from(sample.statement)).toStrictEqual(`FROM "${sample.statement.from}"`);
});
