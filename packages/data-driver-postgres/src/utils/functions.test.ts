import { expect, test, describe } from 'vitest';
import { applyDataTimeFn, convertCount } from './functions.js';
import type { AbstractSqlQueryFnNode } from '@directus/data-sql';
import { randomIdentifier } from '@directus/random';

describe('Extract date time', () => {
	test('From timestamp column', () => {
		const randomTableName = randomIdentifier();
		const wrappedColumn = `"${randomTableName}"."${randomIdentifier()}"`;

		const fnNode: AbstractSqlQueryFnNode = {
			type: 'fn',
			field: {
				type: 'primitive',
				table: randomTableName,
				column: randomIdentifier(),
			},
			fn: 'year',
			isTimestampType: false,
		};

		expect(applyDataTimeFn(fnNode, wrappedColumn)).toStrictEqual(`EXTRACT(YEAR FROM ${wrappedColumn})`);
	});

	test('From non timestamp column', () => {
		const randomTableName = randomIdentifier();
		const wrappedColumn = `"${randomTableName}"."${randomIdentifier()}"`;

		const fnNode: AbstractSqlQueryFnNode = {
			type: 'fn',
			field: {
				type: 'primitive',
				table: randomTableName,
				column: randomIdentifier(),
			},
			fn: 'year',
			isTimestampType: true,
		};

		expect(applyDataTimeFn(fnNode, wrappedColumn)).toStrictEqual(
			`EXTRACT(YEAR FROM ${wrappedColumn} AT TIME ZONE 'UTC')`
		);
	});
});

describe('Count', () => {
	const randomTable = 'sldfjlk';
	const randomColumn = 'oiioii';

	test('on an actual column', () => {
		const fnNode: AbstractSqlQueryFnNode = {
			type: 'fn',
			fn: 'count',
			field: {
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
			field: {
				type: 'primitive',
				table: randomTable,
				column: '*',
			},
		};

		const res = convertCount(fnNode);
		expect(res).toStrictEqual(`COUNT("${randomTable}"."*")`);
	});
});
