import type { AbstractQueryFieldNodePrimitive } from '@directus/data';
import type { AbstractSqlQuery } from '@directus/data-sql';
import { randomIdentifier } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { orderBy } from './orderBy.js';

let sample: {
	statement: AbstractSqlQuery;
};

beforeEach(() => {
	sample = {
		statement: {
			select: [
				{
					type: 'primitive',
					column: randomIdentifier(),
					table: randomIdentifier(),
					as: randomIdentifier(),
				},
				{ type: 'primitive', column: randomIdentifier(), table: randomIdentifier() },
			],
			from: randomIdentifier(),
			parameters: [],
		},
	};
});

test('Empty parametrized statement when order is not defined', () => {
	expect(orderBy(sample.statement)).toStrictEqual(null);
});

test('Returns order part for one primitive field', () => {
	sample.statement.order = [
		{
			orderBy: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			type: 'order',
			direction: 'ASC',
		},
	];

	const expected = `ORDER BY "${(sample.statement.order[0]!.orderBy as AbstractQueryFieldNodePrimitive).field}" ASC`;

	expect(orderBy(sample.statement)).toStrictEqual(expected);
});

test('Returns order part for multiple primitive fields', () => {
	sample.statement.order = [
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

	const expected = `ORDER BY "${(sample.statement.order[0]!.orderBy as AbstractQueryFieldNodePrimitive).field}" ASC, "${
		(sample.statement.order[1]!.orderBy as AbstractQueryFieldNodePrimitive).field
	}" DESC`;

	expect(orderBy(sample.statement)).toStrictEqual(expected);
});
