import { expect, test, describe, beforeEach } from 'vitest';
import { applyFunction } from './functions.js';
import type { AbstractSqlQueryFnNode } from '@directus/data-sql';
import { randomIdentifier } from '@directus/random';

let randomTable: string;
let randomColumn: string;
let sample: AbstractSqlQueryFnNode;

beforeEach(() => {
	randomTable = randomIdentifier();
	randomColumn = randomIdentifier();

	sample = {
		type: 'fn',
		table: randomTable,
		column: randomColumn,
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
		const expected = `EXTRACT(YEAR FROM "${randomTable}"."${randomColumn}")`;
		expect(res).toStrictEqual(expected);
	});

	test('On non timestamp column', () => {
		// @ts-ignore
		sample.fn.isTimestampType = true;
		const res = applyFunction(sample);
		const expected = `EXTRACT(YEAR FROM "${randomTable}"."${randomColumn}" AT TIME ZONE 'UTC')`;
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
		table: randomTable,
		column: '*',
	};

	const res = applyFunction(sample);
	const expected = `COUNT("${randomTable}"."*")`;
	expect(res).toStrictEqual(expected);
});
