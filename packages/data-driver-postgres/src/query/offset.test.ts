import { test, expect, beforeEach } from 'vitest';
import { offset } from './offset.js';
import { randomIdentifier, randomInteger } from '@directus/random';
import type { AbstractSqlClauses } from '@directus/data-sql';

let sample: AbstractSqlClauses;

beforeEach(() => {
	sample = {
		select: [],
		from: {
			tableName: randomIdentifier(),
			tableIndex: 0,
		},
	};
});

test('Empty string when offset is not defined', () => {
	expect(offset(sample)).toStrictEqual(null);
});

test('Returns offset', () => {
	const parameterIndex = randomInteger(0, 100);
	sample.offset = { type: 'value', parameterIndex };
	expect(offset(sample)).toStrictEqual(`OFFSET $${parameterIndex + 1}`);
});
