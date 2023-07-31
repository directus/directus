import { expect, test, beforeEach } from 'vitest';
import { convertLogical } from './logical.js';
import type { AbstractSqlQueryLogicalNode } from '../../../index.js';
import { randomAlpha, randomIdentifier, randomInteger } from '@directus/random';
import type { AbstractQueryFilterNode, AbstractQueryNodeLogical } from '@directus/data';
import { parameterIndexGenerator } from '../../param-index-generator.js';

let sample: AbstractQueryNodeLogical;
let randomCollection: string;
let randomField1: string;
let randomField2: string;
let randomNumber1: number;
let randomString1: string;
let idxGen: Generator<number, number, number>;

beforeEach(() => {
	randomCollection = randomIdentifier();
	randomField1 = randomIdentifier();
	randomField2 = randomIdentifier();
	randomNumber1 = randomInteger(1, 100);
	randomString1 = randomAlpha(5);
	idxGen = parameterIndexGenerator();
});

test('Convert logical node with two conditions', () => {
	sample = {
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

	expect(convertLogical(sample, randomCollection, idxGen, false)).toStrictEqual({
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

	const result = convertLogical(filter, randomCollection, idxGen, false);

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
