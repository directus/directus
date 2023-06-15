import { test, expect } from 'vitest';
import { limitOffset } from './limit-offset.js';
import { randomInteger, randomIdentifier } from '@directus/random';
import type { SqlStatement } from '@directus/data-sql';

test('Returns empty parametrized statement when limit is not defined', () => {
	const query: SqlStatement = {
		select: [],
		from: randomIdentifier(),
		parameters: [],
	};

	expect(limitOffset(query)).toStrictEqual('');
});

test('Returns limit part with one parameter', () => {
	const query: SqlStatement = {
		select: [],
		from: randomIdentifier(),
		limit: 0,
		parameters: [randomInteger(1, 100)],
	};

	expect(limitOffset(query)).toStrictEqual(`LIMIT $1`);
});

test('Returns limit and offset part with their parameters', () => {
	const query: SqlStatement = {
		select: [],
		from: randomIdentifier(),
		limit: 0,
		offset: 1,
		parameters: [randomInteger(1, 100), randomInteger(1, 100)],
	};

	expect(limitOffset(query)).toStrictEqual(`LIMIT $1 OFFSET $2`);
});

test('No limit and offset if only offset is provided', () => {
	const query: SqlStatement = {
		select: [],
		from: randomIdentifier(),
		offset: randomInteger(1, 100),
		parameters: [],
	};

	expect(limitOffset(query)).toStrictEqual('');
});
