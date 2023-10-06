import type { AbstractQueryFilterNode } from '@directus/data';
import { randomIdentifier, randomInteger, randomAlpha } from '@directus/random';
import { beforeEach, expect, test, describe } from 'vitest';
import { parameterIndexGenerator } from '../../param-index-generator.js';
import { convertFilter } from './filter.js';
import type { AbstractSqlQueryLogicalNode, AbstractSqlQueryConditionNode } from '../../../types/clauses/where/index.js';

let randomCollection: string;
let randomField1: string;
let randomField2: string;
let randomNumber1: number;
let randomString1: string;
let idxGen: Generator<number, number, number>;
let randomCompareTo: number;

beforeEach(() => {
	randomCompareTo = randomInteger(1, 100);
	randomCollection = randomIdentifier();
	randomField1 = randomIdentifier();
	randomField2 = randomIdentifier();
	randomNumber1 = randomInteger(1, 100);
	randomString1 = randomAlpha(5);
	idxGen = parameterIndexGenerator();
});

test('Convert single filter', () => {
	const sampleFilter: AbstractQueryFilterNode = {
		type: 'condition',
		condition: {
			type: 'condition-number',
			target: {
				type: 'primitive',
				field: randomField1,
			},
			operation: 'gt',
			compareTo: randomCompareTo,
		},
	};

	const expectedWhere: AbstractSqlQueryConditionNode = {
		type: 'condition',
		negate: true,
		condition: {
			type: 'condition-number',
			target: {
				type: 'primitive',
				column: randomField1,
				table: randomCollection,
			},
			operation: 'gt',
			compareTo: {
				type: 'value',
				parameterIndex: 0,
			},
		},
	};

	expect(convertFilter(sampleFilter, randomCollection, idxGen, true)).toStrictEqual({
		where: expectedWhere,
		parameters: [randomCompareTo],
	});
});

describe('convert multiple conditions', () => {
	test('Convert logical node with two conditions', () => {
		const sampleFilter: AbstractQueryFilterNode = {
			type: 'logical',
			operator: 'and',
			childNodes: [
				{
					type: 'condition',
					condition: {
						type: 'condition-number',
						target: {
							type: 'primitive',
							field: randomField1,
						},
						operation: 'eq',
						compareTo: randomNumber1,
					},
				},
				{
					type: 'condition',
					condition: {
						type: 'condition-string',
						target: {
							type: 'primitive',
							field: randomField2,
						},
						operation: 'starts_with',
						compareTo: randomString1,
					},
				},
			],
		};

		const expectedWhere: AbstractSqlQueryLogicalNode = {
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
							column: randomField1,
							table: randomCollection,
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
							column: randomField2,
							table: randomCollection,
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
		};

		expect(convertFilter(sampleFilter, randomCollection, idxGen)).toStrictEqual({
			where: expectedWhere,
			parameters: [randomNumber1, randomString1],
		});
	});

	test('Convert logical node with nested conditions and with negation', () => {
		const randomField3 = randomIdentifier();
		const randomField4 = randomIdentifier();
		const randomNumber2 = randomInteger(1, 100);
		const randomNumber3 = randomInteger(1, 100);

		// "firstField" > 1 OR NOT "secondField" = 2 OR NOT (NOT "thirdField" < 3 AND NOT (NOT ("fourthField" = 4)))
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
							field: randomField1,
						},
						operation: 'gt',
						compareTo: randomNumber1,
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
								field: randomField2,
							},
							operation: 'starts_with',
							compareTo: randomString1,
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
											field: randomField3,
										},
										operation: 'lt',
										compareTo: randomNumber2,
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
												field: randomField4,
											},
											operation: 'eq',
											compareTo: randomNumber3,
										},
									},
								},
							},
						],
					},
				},
			],
		};

		const result = convertFilter(filter, randomCollection, idxGen);

		const expectedWhere: AbstractSqlQueryLogicalNode = {
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
							table: randomCollection,
							column: randomField1,
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
							table: randomCollection,
							column: randomField2,
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
									table: randomCollection,
									column: randomField3,
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
									table: randomCollection,
									column: randomField4,
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
		};

		expect(result).toStrictEqual({
			where: expectedWhere,
			parameters: [randomNumber1, randomString1, randomNumber2, randomNumber3],
		});
	});
});
