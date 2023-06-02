import { expect, test } from 'vitest';
import { PostgresStatement } from './statement.js';
import type { ParameterizedQuery } from '@directus/data/types';

test('a statement as parameterized query', () => {
	const statement = new PostgresStatement('articles');
	const result = statement.toParameterizedQuery();

	const expected: ParameterizedQuery = {
		statement: 'SELECT "articles".* FROM "articles";',
		values: [],
	};

	expect(result).toStrictEqual(expected);
});
