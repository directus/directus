import type { AbstractSqlClauses } from '@directus/data-sql';
import { expect, test } from 'vitest';
import { select } from './select.js';
import { randomIdentifier, randomInteger } from '@directus/random';

test('With multiple provided fields', () => {
	const tableName1 = randomIdentifier();
	const tableIndex1 = randomInteger(0, 100);
	const tableIndex2 = randomInteger(0, 100);
	const columnName1 = randomIdentifier();
	const columnIndex1 = randomInteger(0, 100);
	const columnIndex2 = randomInteger(0, 100);
	const columnName2 = randomIdentifier();

	const sample: AbstractSqlClauses = {
		select: [
			{
				type: 'primitive',
				tableIndex: tableIndex1,
				columnIndex: columnIndex1,
				columnName: columnName1,
			},
			{
				type: 'primitive',
				tableIndex: tableIndex2,
				columnName: columnName2,
				columnIndex: columnIndex2,
			},
		],
		from: {
			tableName: tableName1,
			tableIndex: tableIndex1,
		},
	};

	const res = select(sample);
	const expected = `SELECT "t${tableIndex1}"."${columnName1}" AS "c${columnIndex1}", "t${tableIndex2}"."${columnName2}" AS "c${columnIndex2}"`;
	expect(res).toStrictEqual(expected);
});

test('With a count', () => {
	const tableName = randomIdentifier();
	const tableIndex = randomInteger(0, 100);
	const columnIndex = randomInteger(0, 100);

	const sample: AbstractSqlClauses = {
		select: [
			{
				type: 'fn',
				fn: {
					type: 'arrayFn',
					fn: 'count',
				},
				tableIndex,
				columnName: '*',
				columnIndex: columnIndex,
			},
		],
		from: {
			tableName,
			tableIndex,
		},
	};

	const res = select(sample);
	const expected = `SELECT COUNT("t${tableIndex}"."*") AS "c${columnIndex}"`;
	expect(res).toStrictEqual(expected);
});
