import type { AbstractSqlClauses } from '@directus/data-sql';
import { expect, test } from 'vitest';
import { from } from './from.js';
import { randomIdentifier, randomInteger } from '@directus/random';

test('Returns parameterized FROM with escaped identifier', () => {
	const tableIndex = randomInteger(0, 100);
	const tableName = randomIdentifier();

	const sample: AbstractSqlClauses = {
		select: [],
		from: { tableName, tableIndex },
	};

	const expected = `FROM "${tableName}" AS "t${tableIndex}"`;
	expect(from(sample)).toStrictEqual(expected);
});
