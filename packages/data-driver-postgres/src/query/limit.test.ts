import { test, expect } from 'vitest';
import { limit } from './limit.js';
import { randomInteger, randomIdentifier } from '@directus/random';
import type { SqlStatement } from '@directus/data-sql';

test('Empty parametrized statement when limit is not defined', () => {
	const query: SqlStatement = {
		select: [],
		from: randomIdentifier(),
		parameters: [],
	};

	expect(limit(query)).toStrictEqual('');
});

test('Returns limit part with one parameter', () => {
	const query: SqlStatement = {
		select: [],
		from: randomIdentifier(),
		limit: 0,
		parameters: [randomInteger(1, 100)],
	};

	expect(limit(query)).toStrictEqual(`LIMIT $1`);
});
