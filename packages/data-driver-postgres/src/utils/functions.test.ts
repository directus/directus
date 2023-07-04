import { expect, test } from 'vitest';
import { extractDateTime } from './functions.js';
import type { AbstractSqlQueryFnNode } from '@directus/data-sql';
import { randomIdentifier } from '@directus/random';

test('Extraction from timestamp column', () => {
	const randomTableName = randomIdentifier();
	const wrappedColumn = `"${randomTableName}"."${randomIdentifier()}"`;

	const fnNode: AbstractSqlQueryFnNode = {
		type: 'fn',
		table: randomTableName,
		column: randomIdentifier(),
		fn: 'year',
		isTimestampType: false,
	};

	expect(extractDateTime(fnNode, wrappedColumn)).toStrictEqual(`EXTRACT(YEAR FROM ${wrappedColumn})`);
});

test('Extraction from other type column', () => {
	const randomTableName = randomIdentifier();
	const wrappedColumn = `"${randomTableName}"."${randomIdentifier()}"`;

	const fnNode: AbstractSqlQueryFnNode = {
		type: 'fn',
		table: randomTableName,
		column: randomIdentifier(),
		fn: 'year',
		isTimestampType: true,
	};

	expect(extractDateTime(fnNode, wrappedColumn)).toStrictEqual(
		`EXTRACT(YEAR FROM ${wrappedColumn} AT TIME ZONE 'UTC')`
	);
});
