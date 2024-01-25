import { expect, test } from 'vitest';
import { convertJson } from './json-select.js';
import type { AbstractQueryFieldNodeNestedSingleOne } from '@directus/data';
import { randomInteger } from '@directus/random';
import type { AbstractSqlQuerySelectJsonNode } from '../../../index.js';

test('json select', () => {
	const tableIndex = randomInteger(0, 100);
	const columnIndex = randomInteger(0, 100);

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

	const result = convertJson(jsonField, tableIndex, columnIndex);

	const expected: AbstractSqlQuerySelectJsonNode = {
		type: 'json',
		tableIndex,
		columnIndex,
		path: [
			['author', 'name', 'first'],
			['author', 'age'],
		],
	};

	expect(result).toStrictEqual(expected);
});
