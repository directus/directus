import type { AbstractSqlClauses } from '@directus/data-sql';
import { randomIdentifier, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { orderBy } from './orderBy.js';

let sample: AbstractSqlClauses;

const tableName = randomIdentifier();
const tableIndex = randomInteger(0, 100);

beforeEach(() => {
	sample = {
		select: [],
		from: { tableName, tableIndex },
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
				columnName: field,
				tableIndex: tableIndex,
			},
			type: 'order',
			direction: 'ASC',
		},
	];

	const expected = `ORDER BY "t${tableIndex}"."${field}" ASC`;
	expect(orderBy(sample)).toStrictEqual(expected);
});

test('Returns order part for multiple primitive fields', () => {
	const columnName1 = randomIdentifier();
	const columnName2 = randomIdentifier();

	sample.order = [
		{
			orderBy: {
				type: 'primitive',
				columnName: columnName1,
				tableIndex,
			},
			type: 'order',
			direction: 'ASC',
		},
		{
			orderBy: {
				type: 'primitive',
				columnName: columnName2,
				tableIndex,
			},
			type: 'order',
			direction: 'DESC',
		},
	];

	const expected = `ORDER BY "t${tableIndex}"."${columnName1}" ASC, "t${tableIndex}"."${columnName2}" DESC`;
	expect(orderBy(sample)).toStrictEqual(expected);
});

test('Returns order part when a function was applied', () => {
	const columnName = randomIdentifier();

	sample.order = [
		{
			orderBy: {
				type: 'fn',
				columnName,
				tableIndex,
				fn: {
					type: 'arrayFn',
					fn: 'count',
				},
			},
			type: 'order',
			direction: 'ASC',
		},
	];

	const expected = `ORDER BY COUNT("t${tableIndex}"."${columnName}") ASC`;
	expect(orderBy(sample)).toStrictEqual(expected);
});

test('Returns order part for a json target', () => {
	const columnName = randomIdentifier();
	const pathIndex = randomInteger(0, 100);

	sample.order = [
		{
			orderBy: {
				type: 'json',
				columnName,
				tableIndex,
				path: [pathIndex],
			},
			type: 'order',
			direction: 'ASC',
		},
	];

	const expected = `ORDER BY "t${tableIndex}"."${columnName}" -> $${pathIndex + 1} ASC`;
	expect(orderBy(sample)).toStrictEqual(expected);
});
