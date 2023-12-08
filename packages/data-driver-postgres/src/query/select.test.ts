import type { AbstractSqlClauses } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { select } from './select.js';
import { randomIdentifier } from '@directus/random';

let randomTable: string;

beforeEach(() => {
	randomTable = randomIdentifier();
});

test('With multiple provided fields', () => {
	const randomTable2 = randomIdentifier();
	const randomColumn1 = randomIdentifier();
	const randomColumn1As = randomIdentifier();
	const randomColumn2 = randomIdentifier();
	const randomColumn2As = randomIdentifier();

	const sample: AbstractSqlClauses = {
		select: [
			{
				type: 'primitive',
				table: randomTable,
				column: randomColumn1,
				as: randomColumn1As,
			},
			{
				type: 'primitive',
				table: randomTable2,
				column: randomColumn2,
				as: randomColumn2As,
			},
		],
		from: randomTable,
	};

	const res = select(sample);
	const expected = `SELECT "${randomTable}"."${randomColumn1}" AS "${randomColumn1As}", "${randomTable2}"."${randomColumn2}" AS "${randomColumn2As}"`;
	expect(res).toStrictEqual(expected);
});

test('With a count', () => {
	const randomTable = randomIdentifier();
	const randomAs = randomIdentifier();

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
				as: randomAs,
			},
		],
		from: randomTable,
	};

	const res = select(sample);
	const expected = `SELECT COUNT("${randomTable}"."*") AS "${randomAs}"`;
	expect(res).toStrictEqual(expected);
});
