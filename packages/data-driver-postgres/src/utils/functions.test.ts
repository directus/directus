import { expect, test, describe, beforeEach } from 'vitest';
import { applyFunction, applySelectFunction } from './functions.js';
import type { AbstractSqlQueryFnNode, AbstractSqlQuerySelectFnNode } from '@directus/data-sql';
import { randomIdentifier, randomInteger } from '@directus/random';

let tableIndex: number;
let columnName: string;
let sample: AbstractSqlQueryFnNode | AbstractSqlQuerySelectFnNode;

beforeEach(() => {
	tableIndex = randomInteger(1, 100);
	columnName = randomIdentifier();

	sample = {
		type: 'fn',
		tableIndex,
		columnName,
		fn: {
			type: 'extractFn',
			fn: 'year',
			isTimestampType: false,
		},
	};
});

describe('Apply date time function', () => {
	test('On timestamp column', () => {
		const res = applyFunction(sample);
		const expected = `EXTRACT(YEAR FROM "t${tableIndex}"."${columnName}")`;
		expect(res).toStrictEqual(expected);
	});

	test('On non timestamp column', () => {
		// @ts-ignore
		sample.fn.isTimestampType = true;
		const res = applyFunction(sample);
		const expected = `EXTRACT(YEAR FROM "t${tableIndex}"."${columnName}" AT TIME ZONE 'UTC')`;
		expect(res).toStrictEqual(expected);
	});
});

test('Apply count', () => {
	sample = {
		type: 'fn',
		fn: {
			type: 'arrayFn',
			fn: 'count',
		},
		tableIndex,
		columnName: '*',
	};

	const res = applyFunction(sample);
	const expected = `COUNT("t${tableIndex}"."*")`;
	expect(res).toStrictEqual(expected);
});

test('Apply count with as', () => {
	sample = {
		type: 'fn',
		fn: {
			type: 'arrayFn',
			fn: 'count',
		},
		tableIndex,
		columnName: '*',
		columnIndex: 1,
	};

	const res = applySelectFunction(sample);
	const expected = `COUNT("t${tableIndex}"."*") AS "c1"`;
	expect(res).toStrictEqual(expected);
});
