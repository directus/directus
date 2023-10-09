import type { AbstractQueryFieldNodePrimitive } from '@directus/data';
import type { AbstractSqlClauses } from '@directus/data-sql';
import { randomIdentifier } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { orderBy } from './orderBy.js';

let sample: AbstractSqlClauses;

beforeEach(() => {
	sample = {
		select: [],
		from: randomIdentifier(),
	};
});

test('Empty parametrized statement when order is not defined', () => {
	expect(orderBy(sample)).toStrictEqual(null);
});

test('Returns order part for one primitive field', () => {
	sample.order = [
		{
			orderBy: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			type: 'order',
			direction: 'ASC',
		},
	];

	const expected = `ORDER BY "${(sample.order[0]!.orderBy as AbstractQueryFieldNodePrimitive).field}" ASC`;

	expect(orderBy(sample)).toStrictEqual(expected);
});

test('Returns order part for multiple primitive fields', () => {
	sample.order = [
		{
			orderBy: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			type: 'order',
			direction: 'ASC',
		},
		{
			orderBy: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			type: 'order',
			direction: 'DESC',
		},
	];

	const expected = `ORDER BY "${(sample.order[0]!.orderBy as AbstractQueryFieldNodePrimitive).field}" ASC, "${
		(sample.order[1]!.orderBy as AbstractQueryFieldNodePrimitive).field
	}" DESC`;

	expect(orderBy(sample)).toStrictEqual(expected);
});
