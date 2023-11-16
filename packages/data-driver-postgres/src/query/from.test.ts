import type { AbstractSqlClauses } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { from } from './from.js';
import { randomIdentifier } from '@directus/random';

let sample: AbstractSqlClauses;

beforeEach(() => {
	sample = {
		select: [],
		from: randomIdentifier(),
	};
});

test('Returns parameterized FROM with escaped identifier', () => {
	expect(from(sample)).toStrictEqual(`FROM "${sample.from}"`);
});
