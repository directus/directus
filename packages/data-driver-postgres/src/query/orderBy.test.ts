import type { AbstractSqlClauses } from '@directus/data-sql';
import { randomIdentifier } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { orderBy } from './orderBy.js';

let sample: AbstractSqlClauses;

const randomTable = randomIdentifier();

beforeEach(() => {
	sample = {
		select: [],
		from: randomTable,
	};
});

test('Empty parametrized statement when order is not defined', () => {
	expect(orderBy(sample)).toStrictEqual(null);
});

test('Returns order part for one primitive field', () => {
	const field = randomIdentifier();

	sample.order = [
		{
			orderBy: {
				type: 'primitive',
				column: field,
				table: randomTable,
			},
			type: 'order',
			direction: 'ASC',
		},
	];

	const expected = `ORDER BY "${randomTable}"."${field}" ASC`;

	expect(orderBy(sample)).toStrictEqual(expected);
});

test('Returns order part for multiple primitive fields', () => {
	const field1 = randomIdentifier();
	const field2 = randomIdentifier();

	sample.order = [
		{
			orderBy: {
				type: 'primitive',
				column: field1,
				table: randomTable,
			},
			type: 'order',
			direction: 'ASC',
		},
		{
			orderBy: {
				type: 'primitive',
				column: field2,
				table: randomTable,
			},
			type: 'order',
			direction: 'DESC',
		},
	];

	const expected = `ORDER BY "${randomTable}"."${field1}" ASC, "${randomTable}"."${field2}" DESC`;

	expect(orderBy(sample)).toStrictEqual(expected);
});
