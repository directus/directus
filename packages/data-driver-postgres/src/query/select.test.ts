import type { AbstractSqlClauses } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { select } from './select.js';
import { randomIdentifier } from '@directus/random';

let randomTable: string;

beforeEach(() => {
	randomTable = randomIdentifier();
});

test('With multiple provided fields and an alias', () => {
	const randomTable2 = randomIdentifier();
	const randomColumn1 = randomIdentifier();
	const randomColumn2 = randomIdentifier();
	const randomAlias = randomIdentifier();

	const sample: AbstractSqlClauses = {
		select: [
			{
				type: 'primitive',
				table: randomTable,
				column: randomColumn1,
				as: randomAlias,
			},
			{
				type: 'primitive',
				table: randomTable2,
				column: randomColumn2,
			},
		],
		from: randomTable,
	};

	const res = select(sample);
	const expected = `SELECT "${randomTable}"."${randomColumn1}" AS "${randomAlias}", "${randomTable2}"."${randomColumn2}"`;
	expect(res).toStrictEqual(expected);
});

test('With a count', () => {
	const randomTable = randomIdentifier();

	const sample: AbstractSqlClauses = {
		select: [
			{
				type: 'fn',
				fn: {
					type: 'arrayFn',
					fn: 'count',
				},
				table: randomTable,
				column: '*',
			},
		],
		from: randomTable,
	};

	const res = select(sample);
	const expected = `SELECT COUNT("${randomTable}"."*")`;
	expect(res).toStrictEqual(expected);
});
