import { test, expect, beforeEach } from 'vitest';
import { offset } from './offset.js';
import { randomIdentifier } from '@directus/random';
import type { AbstractSqlClauses } from '@directus/data-sql';

let sample: AbstractSqlClauses;

beforeEach(() => {
	sample = {
		select: [],
		from: randomIdentifier(),
	};
});

test('Empty string when offset is not defined', () => {
	expect(offset(sample)).toStrictEqual(null);
});

test('Returns offset', () => {
	sample.offset = { type: 'value', parameterIndex: 0 };
	expect(offset(sample)).toStrictEqual(`OFFSET $1`);
});
