import { expect, test } from 'vitest';
import { convertJson } from './json-select.js';
import type { AbstractQueryFieldNodeNestedSingleOne } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import type { AbstractSqlQuerySelectJsonNode } from '../../../index.js';
import { numberGenerator } from '../../utils/number-generator.js';

test('json select', () => {
	const tableIndex = randomInteger(0, 100);
	const jsonColumnName = randomIdentifier();
	const jsonColumnNameAlias = randomIdentifier();
	const attribute1 = randomIdentifier();
	const attribute1Alias = randomIdentifier();
	const attribute2 = randomIdentifier();
	const attribute2Alias = randomIdentifier();
	const attribute3 = randomIdentifier();
	const attribute3Alias = randomIdentifier();

	const jsonField: AbstractQueryFieldNodeNestedSingleOne = {
		type: 'nested-single-one',
		nesting: {
			type: 'object-many',
			fieldName: jsonColumnName,
		},
		fields: [
			{
				type: 'nested-single-one',
				nesting: {
					type: 'object-many',
					fieldName: attribute1,
				},
				fields: [
					{
						type: 'primitive',
						field: attribute2,
						alias: attribute2Alias,
					},
				],
				alias: attribute1Alias,
			},
			{
				type: 'primitive',
				field: attribute3,
				alias: attribute3Alias,
			},
		],
		alias: jsonColumnNameAlias,
	};

	const colIndxGenerator = numberGenerator();

	const result = convertJson(jsonField, tableIndex, colIndxGenerator);

	const expected: AbstractSqlQuerySelectJsonNode[] = [
		{
			type: 'json',
			tableIndex,
			columnName: jsonColumnName,
			path: [attribute1, attribute2],
			columnIndex: 0,
		},
		{
			type: 'json',
			tableIndex,
			columnName: jsonColumnName,
			path: [attribute3],
			columnIndex: 1,
		},
	];

	expect(result).toStrictEqual(expected);
});
