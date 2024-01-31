import { test, expect, beforeEach } from 'vitest';
import { limit } from './limit.js';
import { randomIdentifier, randomInteger } from '@directus/random';
import type { AbstractSqlClauses } from '@directus/data-sql';

let sample: AbstractSqlClauses;

beforeEach(() => {
	sample = {
		select: [],
		from: {
			tableName: randomIdentifier(),
			tableIndex: randomInteger(0, 100),
		},
	};
});

test('Empty parametrized statement when limit is not defined', () => {
	expect(limit(sample)).toStrictEqual(null);
});

test('Returns limit part with one parameter', () => {
	const parameterIndex = randomInteger(0, 100);
	sample.limit = { type: 'value', parameterIndex };
	expect(limit(sample)).toStrictEqual(`LIMIT $${parameterIndex + 1}`);
});
