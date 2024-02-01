import { expect, test } from 'vitest';
import { convertJson } from './json-select.js';
import { randomIdentifier, randomInteger } from '@directus/random';
import type { AbstractSqlQuerySelectJsonNode } from '../../../index.js';

test.skip('json select', () => {
	const tableIndex = randomInteger(0, 100);
	const columnIndex = randomInteger(0, 100);
	const jsonColumnName = randomIdentifier();
	const attribute1 = randomIdentifier();
	const attribute2 = randomIdentifier();
	const path = [attribute1, attribute2];

	const result = convertJson(path, tableIndex, jsonColumnName, columnIndex);

	const expected: AbstractSqlQuerySelectJsonNode[] = [
		{
			type: 'json',
			tableIndex,
			columnName: jsonColumnName,
			path: [attribute1, attribute2],
			columnIndex: 0,
		},
	];

	expect(result).toStrictEqual(expected);
});
