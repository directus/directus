import type { AbstractSqlQuery } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { select } from './select.js';
import { randomIdentifier } from '@directus/random';

let sample: {
	statement: AbstractSqlQuery;
};

const randomTable1 = randomIdentifier();
const randomTable2 = randomIdentifier();
const randomColumn1 = randomIdentifier();
const randomColumn2 = randomIdentifier();
const randomAlias = randomIdentifier();

beforeEach(() => {
	sample = {
		statement: {
			select: [
				{
					type: 'primitive',
					table: randomTable1,
					column: randomColumn1,
					as: randomAlias,
				},
				{
					type: 'primitive',
					table: randomTable2,
					column: randomColumn2,
				},
			],
			from: randomIdentifier(),
			parameters: [],
			type: 'query'
		},
	};
});

test('With multiple provided fields and an alias', () => {
	const res = select(sample.statement);
	const expected = `SELECT "${randomTable1}"."${randomColumn1}" AS "${randomAlias}", "${randomTable2}"."${randomColumn2}"`;
	expect(res).toStrictEqual(expected);
});

test('With a count', () => {
	const randomTable = randomIdentifier();

	sample.statement.select = [
		{
			type: 'fn',
			fn: 'count',
			field: {
				type: 'primitive',
				table: randomTable,
				column: '*',
			},
		},
	];

	const res = select(sample.statement);

	const expected = `SELECT COUNT("${randomTable}"."*")`;

	expect(res).toStrictEqual(expected);
});
