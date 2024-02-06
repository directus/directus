import type { AbstractSqlQuerySelectJsonNode } from '@directus/data-sql';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { json } from './json.js';

test('Convert json node to array syntax', () => {
	const tableIndex = randomInteger(0, 100);
	const jsonColumnName = randomIdentifier();
	const attribute1 = randomIdentifier();
	const attribute2 = randomIdentifier();
	const columnIndex = randomInteger(0, 100);

	const sample: AbstractSqlQuerySelectJsonNode = {
		type: 'json',
		tableIndex,
		columnName: jsonColumnName,
		path: [attribute1, attribute2],
		columnIndex,
	};

	const expected = `"t${tableIndex}"."${jsonColumnName}" -> "${attribute1}" ->> "${attribute2}" AS "c${columnIndex}"`;

	expect(json(sample)).toBe(expected);
});
