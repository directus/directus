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
		expect(applyFunction(sample)).toStrictEqual(`EXTRACT(YEAR FROM "${randomTable}"."${randomColumn}")`);
	});

	test('On non timestamp column', () => {
		// @ts-ignore
		sample.fn.isTimestampType = true;

		expect(applyFunction(sample)).toStrictEqual(
			`EXTRACT(YEAR FROM "${randomTable}"."${randomColumn}" AT TIME ZONE 'UTC')`
		);
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

	expect(applyFunction(sample)).toStrictEqual(`COUNT("${randomTable}"."*")`);
});
