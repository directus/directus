import type { AbstractSqlClauses, AbstractSqlQuerySelectJsonNode } from '@directus/data-sql';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { json, select } from './select.js';

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

test('Convert json node to array syntax', () => {
	const tableIndex = randomInteger(0, 100);
	const jsonColumnName = randomIdentifier();
	const columnIndex = randomInteger(0, 100);

	const sample: AbstractSqlQuerySelectJsonNode = {
		type: 'json',
		tableIndex,
		columnName: jsonColumnName,
		path: [0, 1],
		columnIndex,
	};

	const expected = `"t${tableIndex}"."${jsonColumnName}" -> $1 -> $2 AS "c${columnIndex}"`;
	expect(json(sample)).toBe(expected);
});

test('With json', () => {
	const tableName = randomIdentifier();
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const jsonColumnName = randomIdentifier();

	const sample: AbstractSqlClauses = {
		select: [
			{
				type: 'primitive',
				tableIndex,
				columnName: columnName,
				columnIndex: 0,
			},
			{
				type: 'json',
				tableIndex,
				columnName: jsonColumnName,
				path: [0],
				columnIndex: 1,
			},
			{
				type: 'json',
				tableIndex,
				columnName: jsonColumnName,
				path: [1, 2],
				columnIndex: 2,
			},
		],
		from: {
			tableName,
			tableIndex,
		},
	};

	const res = select(sample);
	const expected = `SELECT "t${tableIndex}"."${columnName}" AS "c0", "t${tableIndex}"."${jsonColumnName}" -> $1 AS "c1", "t${tableIndex}"."${jsonColumnName}" -> $2 -> $3 AS "c2"`;
	expect(res).toStrictEqual(expected);
});
