import { test, expect } from 'vitest';
import { limitOffset } from './limit-offset.js';
import { randomInteger, randomIdentifier } from '@directus/random';
import type { SqlStatement } from '@directus/data-sql';

test('Returns empty parametrized statement when limit is not defined', () => {
	const query: SqlStatement = {
		select: [],
		from: randomIdentifier(),
	};

	expect(limitOffset(query)).toStrictEqual({
		statement: '',
		values: [],
	});
});

test('Returns limit part with one parameter', () => {
	const query: SqlStatement = {
		select: [],
		from: randomIdentifier(),
		limit: randomInteger(1, 100),
	};

	expect(limitOffset(query)).toStrictEqual({
		statement: `LIMIT ?`,
		values: [query.limit],
	});
});

test('Returns limit and offset part with their parameters', () => {
	const query: SqlStatement = {
		select: [],
		from: randomIdentifier(),
		limit: randomInteger(1, 100),
		offset: randomInteger(1, 100),
	};

	expect(limitOffset(query)).toStrictEqual({
		statement: `LIMIT ? OFFSET ?`,
		values: [query.limit, query.offset],
	});
});

test('No limit and offset if only offset is provided', () => {
	const query: SqlStatement = {
		select: [],
		from: randomIdentifier(),
		offset: randomInteger(1, 100),
	};

	expect(limitOffset(query)).toStrictEqual({
		statement: ``,
		values: [],
	});
});
