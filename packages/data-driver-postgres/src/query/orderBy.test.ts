import { test, expect, beforeEach } from 'vitest';
import { orderBy } from './orderBy.js';
import { randomIdentifier } from '@directus/random';
import type { AbstractSqlQuery } from '@directus/data-sql';

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
			direction: 'ASC',
		},
	];

	// @ts-ignore
	const expected = `ORDER BY "${sample.statement.order[0].orderBy.field}" ASC`;

	expect(orderBy(sample.statement)).toStrictEqual(expected);
});

test('Returns order part for multiple primitive fields', () => {
	sample.statement.order = [
		{
			orderBy: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			direction: 'ASC',
		},
		{
			orderBy: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			direction: 'DESC',
		},
	];

	// @ts-ignore
	const expected = `ORDER BY "${sample.statement.order[0].orderBy.field}" ASC, "${sample.statement.order[1].orderBy.field}" DESC`;

	expect(orderBy(sample.statement)).toStrictEqual(expected);
});
