import type { AtLeastOneElement } from '@directus/data';
import { randomAlpha, randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { convertLogical } from './logical.js';
import type { FilterResult } from './utils.js';

test('Convert logical node with two conditions', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValue = randomInteger(1, 100);

	const externalTableName = randomIdentifier();
	const externalTableIndex = randomInteger(0, 100);
	const externalColumnName = randomIdentifier();
	const externalColumnValue = randomAlpha(5);

	const children: AtLeastOneElement<FilterResult> = [
		{
			clauses: {
				where: {
					type: 'condition',
					condition: {
						type: 'condition-number',
						target: {
							type: 'primitive',
							tableIndex,
							columnName,
						},
						operation: 'eq',
						compareTo: {
							type: 'value',
							parameterIndex: 0,
						},
					},
					negate: false,
				},
				joins: [
					{
						type: 'join',
						tableName: externalTableName,
						tableIndex: externalTableIndex,
						on: {
							type: 'condition',
							condition: {
								type: 'condition-field',
								target: {
									type: 'primitive',
									tableIndex,
									columnName,
								},
								operation: 'eq',
								compareTo: {
									type: 'primitive',
									tableIndex: externalTableIndex,
									columnName: externalColumnName,
								},
							},
							negate: false,
						},
					},
				],
			},
			parameters: [columnValue],
		},
		{
			clauses: {
				where: {
					type: 'condition',
					condition: {
						type: 'condition-string',
						target: {
							type: 'primitive',
							tableIndex: externalTableIndex,
							columnName: externalColumnName,
						},
						operation: 'starts_with',
						compareTo: {
							type: 'value',
							parameterIndex: 1,
						},
					},
					negate: false,
				},
				joins: [],
			},
			parameters: [externalColumnValue],
		},
	];

	const expectedResult: FilterResult = {
		clauses: {
			joins: [
				{
					type: 'join',
					tableName: externalTableName,
					tableIndex: externalTableIndex,
					on: {
						type: 'condition',
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								tableIndex,
								columnName,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								tableIndex: externalTableIndex,
								columnName: externalColumnName,
							},
						},
						negate: false,
					},
				},
			],
			where: {
				type: 'logical',
				negate: false,
				operator: 'and',
				childNodes: [
					{
						type: 'condition',
						condition: {
							type: 'condition-number',
							target: {
								type: 'primitive',
								tableIndex,
								columnName,
							},
							operation: 'eq',
							compareTo: {
								type: 'value',
								parameterIndex: 0,
							},
						},
						negate: false,
					},
					{
						type: 'condition',
						condition: {
							type: 'condition-string',
							target: {
								type: 'primitive',
								tableIndex: externalTableIndex,
								columnName: externalColumnName,
							},
							operation: 'starts_with',
							compareTo: {
								type: 'value',
								parameterIndex: 1,
							},
						},
						negate: false,
					},
				],
			},
		},
		parameters: [columnValue, externalColumnValue],
	};

	const result = convertLogical(children, 'and', false);

	expect(result).toStrictEqual(expectedResult);
});
