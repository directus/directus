import type { AbstractQueryFilterNode } from '@directus/data';
import { randomAlpha, randomIdentifier, randomInteger } from '@directus/random';
import { describe, expect, test } from 'vitest';
import { createIndexGenerators } from '../../../utils/create-index-generators.js';
import { convertFilter } from './filter.js';
import type { FilterResult } from './utils.js';

test('Convert single filter', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValue = randomInteger(1, 100);

	const filter: AbstractQueryFilterNode = {
		type: 'condition',
		condition: {
			type: 'condition-number',
			target: {
				type: 'primitive',
				field: columnName,
			},
			operation: 'gt',
			compareTo: columnValue,
		},
	};

	const expectedResult: FilterResult = {
		clauses: {
			where: {
				type: 'condition',
				negate: true,
				condition: {
					type: 'condition-number',
					target: {
						type: 'primitive',
						tableIndex,
						columnName,
					},
					operation: 'gt',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
			joins: [],
		},
		parameters: [columnValue],
	};

	const indexGen = createIndexGenerators();
	const result = convertFilter(filter, tableIndex, indexGen, true);

	expect(result).toStrictEqual(expectedResult);
});

describe('convert multiple conditions', () => {
	test('Convert logical node with two conditions', () => {
		const tableIndex = randomInteger(0, 100);
		const column1Name = randomIdentifier();
		const column1Value = randomInteger(1, 100);
		const column2Name = randomIdentifier();
		const column2Value = randomAlpha(10);

		const filter: AbstractQueryFilterNode = {
			type: 'logical',
			operator: 'and',
			childNodes: [
				{
					type: 'condition',
					condition: {
						type: 'condition-number',
						target: {
							type: 'primitive',
							field: column1Name,
						},
						operation: 'eq',
						compareTo: column1Value,
					},
				},
				{
					type: 'condition',
					condition: {
						type: 'condition-string',
						target: {
							type: 'primitive',
							field: column2Name,
						},
						operation: 'starts_with',
						compareTo: column2Value,
					},
				},
			],
		};

		const expectedResult: FilterResult = {
			clauses: {
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
									columnName: column1Name,
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
									tableIndex,
									columnName: column2Name,
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
				joins: [],
			},
			parameters: [column1Value, column2Value],
		};

		const indexGen = createIndexGenerators();
		const result = convertFilter(filter, tableIndex, indexGen);

		expect(result).toStrictEqual(expectedResult);
	});

	test('Convert logical node with nested conditions and with negation', () => {
		const tableIndex = randomInteger(0, 100);
		const column1Name = randomIdentifier();
		const column1Value = randomInteger(1, 100);
		const column2Name = randomIdentifier();
		const column2Value = randomAlpha(10);
		const column3Name = randomIdentifier();
		const column3Value = randomInteger(1, 100);
		const column4Name = randomIdentifier();
		const column4Value = randomInteger(1, 100);

		// "column1" > 1 OR NOT "column2" = 2 OR NOT (NOT "column3" < 3 AND NOT (NOT ("column4" = 4)))
		const filter: AbstractQueryFilterNode = {
			type: 'logical',
			operator: 'or',
			childNodes: [
				{
					type: 'condition',
					condition: {
						type: 'condition-number',
						target: {
							type: 'primitive',
							field: column1Name,
						},
						operation: 'gt',
						compareTo: column1Value,
					},
				},
				{
					type: 'negate',
					childNode: {
						type: 'condition',
						condition: {
							type: 'condition-string',
							target: {
								type: 'primitive',
								field: column2Name,
							},
							operation: 'starts_with',
							compareTo: column2Value,
						},
					},
				},
				{
					type: 'negate',
					childNode: {
						type: 'logical',
						operator: 'and',
						childNodes: [
							{
								type: 'negate',
								childNode: {
									type: 'condition',
									condition: {
										type: 'condition-number',
										target: {
											type: 'primitive',
											field: column3Name,
										},
										operation: 'lt',
										compareTo: column3Value,
									},
								},
							},
							{
								type: 'negate',
								childNode: {
									type: 'negate',
									childNode: {
										type: 'condition',
										condition: {
											type: 'condition-number',
											target: {
												type: 'primitive',
												field: column4Name,
											},
											operation: 'eq',
											compareTo: column4Value,
										},
									},
								},
							},
						],
					},
				},
			],
		};

		const expectedResult: FilterResult = {
			clauses: {
				where: {
					type: 'logical',
					operator: 'or',
					negate: false,
					childNodes: [
						{
							type: 'condition',
							negate: false,
							condition: {
								type: 'condition-number',
								target: {
									type: 'primitive',
									tableIndex,
									columnName: column1Name,
								},
								operation: 'gt',
								compareTo: {
									type: 'value',
									parameterIndex: 0,
								},
							},
						},
						{
							type: 'condition',
							negate: true,
							condition: {
								type: 'condition-string',
								target: {
									type: 'primitive',
									tableIndex,
									columnName: column2Name,
								},
								operation: 'starts_with',
								compareTo: {
									type: 'value',
									parameterIndex: 1,
								},
							},
						},
						{
							type: 'logical',
							operator: 'and',
							negate: true,
							childNodes: [
								{
									type: 'condition',
									negate: true,
									condition: {
										type: 'condition-number',
										target: {
											type: 'primitive',
											tableIndex,
											columnName: column3Name,
										},
										operation: 'lt',
										compareTo: {
											type: 'value',
											parameterIndex: 2,
										},
									},
								},
								{
									type: 'condition',
									negate: false,
									condition: {
										type: 'condition-number',
										target: {
											type: 'primitive',
											tableIndex,
											columnName: column4Name,
										},
										operation: 'eq',
										compareTo: {
											type: 'value',
											parameterIndex: 3,
										},
									},
								},
							],
						},
					],
				},
				joins: [],
			},
			parameters: [column1Value, column2Value, column3Value, column4Value],
		};

		const indexGen = createIndexGenerators();
		const result = convertFilter(filter, tableIndex, indexGen);

		expect(result).toStrictEqual(expectedResult);
	});
});
