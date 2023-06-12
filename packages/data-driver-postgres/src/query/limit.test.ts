import { test, expect } from 'vitest';
import { limit } from './limit.js';
import { randomAlpha, randomInteger } from '@directus/random';
import type { SqlStatement } from '@directus/data-sql';

test('Returns empty parametrized statement when limit is not defined', () => {
	const query: SqlStatement = {
		select: [],
		from: randomAlpha(randomInteger(3, 25)),
		limit: randomInteger(1, 100),
	};

	expect(limit(query)).toStrictEqual({
		statement: `LIMIT ?`,
		values: [query.limit],
	});
});

test('Returns LIMIT statement with parameterized limit', () => {
	const query: SqlStatement = {
		select: [],
		from: randomAlpha(randomInteger(3, 25)),
	};

	expect(limit(query)).toStrictEqual({
		statement: '',
		values: [],
	});
});
