import { test, expect } from 'vitest';
import { limit } from './limit-offset.js';
import { randomInteger, randomIdentifier } from '@directus/random';
import type { SqlStatement } from '@directus/data-sql';

test('Returns empty parametrized statement when limit is not defined', () => {
	const query: SqlStatement = {
		select: [],
		from: randomIdentifier(),
	};

	expect(limit(query)).toStrictEqual({
		statement: '',
		values: [],
	});
});

test('Returns LIMIT statement with parameterized limit', () => {
	const query: SqlStatement = {
		select: [],
		from: randomIdentifier(),
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
		from: randomIdentifier(),
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
		from: randomIdentifier(),
		offset: randomInteger(1, 100),
	};

	expect(limit(query)).toStrictEqual({
		statement: ``,
		values: [],
	});
});
