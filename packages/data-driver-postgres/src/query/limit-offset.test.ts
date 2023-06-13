import { test, expect } from 'vitest';
import { limit } from './limit-offset.js';
import { randomAlpha, randomInteger } from '@directus/random';
import type { SqlStatement } from '@directus/data-sql';

test('Returns empty parametrized statement when limit is not defined', () => {
	const query: SqlStatement = {
		select: [],
		from: randomAlpha(randomInteger(3, 25)),
	};

	expect(limit(query)).toStrictEqual({
		statement: '',
		values: [],
	});
});

test('Returns LIMIT statement with parameterized limit', () => {
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

test('Returns LIMIT with offset', () => {
	const query: SqlStatement = {
		select: [],
		from: randomAlpha(randomInteger(3, 25)),
		limit: randomInteger(1, 100),
		offset: randomInteger(1, 100),
	};

	expect(limit(query)).toStrictEqual({
		statement: `LIMIT ? OFFSET ?`,
		values: [query.limit, query.offset],
	});
});

test('Ignore limit if only offset is provided', () => {
	const query: SqlStatement = {
		select: [],
		from: randomAlpha(randomInteger(3, 25)),
		offset: randomInteger(1, 100),
	};

	expect(limit(query)).toStrictEqual({
		statement: ``,
		values: [],
	});
});
