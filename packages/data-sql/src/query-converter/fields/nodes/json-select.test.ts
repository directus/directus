import { expect, test } from 'vitest';
import { convertJson } from './json-select.js';
import type { AbstractQueryFieldNodeNestedSingleOne } from '@directus/data';
import { randomInteger } from '@directus/random';
import type { AbstractSqlQuerySelectJsonNode } from '../../../index.js';
import { numberGenerator } from '../../utils/number-generator.js';

test('json select', () => {
	const tableIndex = randomInteger(0, 100);

	/**
	 * Assuming the json value in the database looks like this:
	 *
	 * {
	 *	author: {
	 *		name: {
	 *			first: 'John',
	 *			last: 'Doe',
	 *		},
	 *		age: 42,
	 *	},
	 * }
	 */

	const jsonField: AbstractQueryFieldNodeNestedSingleOne = {
		type: 'nested-single-one',
		nesting: {
			type: 'object-many',
			fieldName: 'author',
		},
		fields: [
			{
				type: 'nested-single-one',
				nesting: {
					type: 'object-many',
					fieldName: 'name',
				},
				fields: [
					{
						type: 'primitive',
						field: 'first',
						alias: 'derErste',
					},
				],
				alias: 'derName',
			},
			{
				type: 'primitive',
				field: 'age',
				alias: 'age',
			},
		],
		alias: 'derAuthor',
	};

	const colIndxGenerator = numberGenerator();

	const result = convertJson(jsonField, tableIndex, colIndxGenerator);

	const expected: AbstractSqlQuerySelectJsonNode = {
		type: 'json',
		tableIndex,
		paths: [
			{
				path: ['author', 'name', 'first'],
				columnIndex: 0,
			},
			{
				path: ['author', 'age'],
				columnIndex: 1,
			},
		],
	};

	expect(result).toStrictEqual(expected);
});
