import { expect, test, describe } from 'vitest';
import { convertGeoFn, convertDateTimeFn, convertCount } from './functions.js';
import type { AbstractSqlQueryFnNode, AbstractSqlQueryConditionNode } from '@directus/data-sql';
import { randomIdentifier } from '@directus/random';

describe('Extract date time', () => {
	test('From timestamp column', () => {
		const randomTableName = randomIdentifier();
		const wrappedColumn = `"${randomTableName}"."${randomIdentifier()}"`;

		const fnNode: AbstractSqlQueryFnNode = {
			type: 'fn',
			input: {
				type: 'primitive',
				table: randomTableName,
				column: randomIdentifier(),
			},
			fn: 'year',
			isTimestampType: false,
		};

		expect(convertDateTimeFn(fnNode, wrappedColumn)).toStrictEqual(`EXTRACT(YEAR FROM ${wrappedColumn})`);
	});

	test('From non timestamp column', () => {
		const randomTableName = randomIdentifier();
		const wrappedColumn = `"${randomTableName}"."${randomIdentifier()}"`;

		const fnNode: AbstractSqlQueryFnNode = {
			type: 'fn',
			input: {
				type: 'primitive',
				table: randomTableName,
				column: randomIdentifier(),
			},
			fn: 'year',
			isTimestampType: true,
		};

		expect(convertDateTimeFn(fnNode, wrappedColumn)).toStrictEqual(
			`EXTRACT(YEAR FROM ${wrappedColumn} AT TIME ZONE 'UTC')`
		);
	});
});

describe('Intersects', () => {
	test('st intersects', () => {
		const randomTable = randomIdentifier();
		const randomColumn = randomIdentifier();

		const where: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			target: {
				type: 'primitive',
				table: randomTable,
				column: randomColumn,
			},
			operation: 'intersects',
			compareTo: {
				type: 'value',
				parameterIndexes: [0],
			},
		};

		const wrappedCol = `${randomTable}"."${randomColumn}`;

		expect(convertGeoFn(where, wrappedCol)).toStrictEqual(`ST_Intersects(${wrappedCol}, $1)`);
	});
});

describe('Count', () => {
	const randomTable = 'sldfjlk';
	const randomColumn = 'oiioii';

	test('on an actual column', () => {
		const fnNode: AbstractSqlQueryFnNode = {
			type: 'fn',
			fn: 'count',
			input: {
				type: 'primitive',
				table: randomTable,
				column: randomColumn,
			},
		};

		const res = convertCount(fnNode);
		expect(res).toStrictEqual(`COUNT("${randomTable}"."${randomColumn}")`);
	});

	test('without a specific column', () => {

		const fnNode: AbstractSqlQueryFnNode = {
			type: 'fn',
			fn: 'count',
			input: {
				type: 'primitive',
				table: randomTable,
				column: "*",
			},
		};

		const res = convertCount(fnNode);
		expect(res).toStrictEqual(`COUNT("${randomTable}"."*")`);
	});
});
