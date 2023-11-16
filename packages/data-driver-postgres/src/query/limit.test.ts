import { test, expect, beforeEach } from 'vitest';
import { limit } from './limit.js';
import { randomIdentifier } from '@directus/random';
import type { AbstractSqlClauses } from '@directus/data-sql';

let sample: AbstractSqlClauses;

beforeEach(() => {
	sample = {
		select: [],
		from: randomIdentifier(),
	};
});

test('Empty parametrized statement when limit is not defined', () => {
	expect(limit(sample)).toStrictEqual(null);
});

test('Returns limit part with one parameter', () => {
	sample.limit = { type: 'value', parameterIndex: 0 };
	expect(limit(sample)).toStrictEqual(`LIMIT $1`);
});
