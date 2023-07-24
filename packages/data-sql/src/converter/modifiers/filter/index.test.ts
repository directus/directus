import type {
	AbstractQueryFieldNodePrimitive,
	AbstractQueryFilterNode,
	AbstractQueryConditionNode,
} from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '../../../types.js';
import { parameterIndexGenerator } from '../../../utils/param-index-generator.js';
import { convertFilter } from './index.js';

let sample: {
	condition: AbstractQueryConditionNode;
	randomCollection: string;
};

let randomCompareTo: number;

beforeEach(() => {
	randomCompareTo = randomInteger(1, 100);

	sample = {
		condition: {
			type: 'condition',
			condition: {
				type: 'condition-number',
				target: {
					type: 'primitive',
					field: randomIdentifier(),
				},
				operation: 'gt',
				compareTo: randomCompareTo,
			},
		},
		randomCollection: randomIdentifier(),
	};
});

test.skip('Convert filter with one parameter and negation', () => {
	// sample.condition.negate = true;
	const idGen = parameterIndexGenerator();

	const expectedWhere: AbstractSqlQueryConditionNode = {
		type: 'condition',
		negate: true,
		condition: {
			type: 'condition-number',
			target: {
				column: (sample.condition.condition.target as AbstractQueryFieldNodePrimitive).field,
				table: sample.randomCollection,
				type: 'primitive',
			},
			operation: 'gt',
			compareTo: {
				type: 'value',
				parameterIndex: 0,
			},
		},
	};

	expect(convertFilter(sample.condition, sample.randomCollection, idGen)).toStrictEqual({
		where: expectedWhere,
		parameters: [randomCompareTo],
	});
});

test('Convert filter with logical', () => {
	const idGen = parameterIndexGenerator();

	const randomCollection = randomIdentifier();

	const firstField = randomIdentifier();
	const secondField = randomIdentifier();
	const firstValue = randomInteger(1, 100);
	const secondValue = randomInteger(1, 100);

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
						field: firstField,
					},
					operation: 'gt',
					compareTo: firstValue,
				},
			},
			{
				type: 'condition',
				condition: {
					type: 'condition-number',
					target: {
						type: 'primitive',
						field: secondField,
					},
					operation: 'eq',
					compareTo: secondValue,
				},
			},
		],
	};

	const result = convertFilter(filter, randomCollection, idGen);

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
						column: firstField,
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
				negate: false,
				condition: {
					type: 'condition-number',
					target: {
						type: 'primitive',
						table: randomCollection,
						column: secondField,
					},
					operation: 'eq',
					compareTo: {
						type: 'value',
						parameterIndex: 1,
					},
				},
			},
		],
	};

	expect(result).toStrictEqual({
		where: expectedWhere,
		parameters: [firstValue, secondValue],
	});
});

test('Convert filter nested and with negation', () => {
	const idGen = parameterIndexGenerator();

	const randomCollection = randomIdentifier();

	const firstField = randomIdentifier();
	const secondField = randomIdentifier();
	const thirdField = randomIdentifier();
	const fourthField = randomIdentifier();

	const firstValue = randomInteger(1, 100);
	const secondValue = randomInteger(1, 100);
	const thirdValue = randomInteger(1, 100);
	const fourthValue = randomInteger(1, 100);

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
						field: firstField,
					},
					operation: 'gt',
					compareTo: firstValue,
				},
			},
			{
				type: 'negate',
				childNode: {
					type: 'condition',
					condition: {
						type: 'condition-number',
						target: {
							type: 'primitive',
							field: secondField,
						},
						operation: 'eq',
						compareTo: secondValue,
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
										field: thirdField,
									},
									operation: 'lt',
									compareTo: thirdValue,
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
											field: fourthField,
										},
										operation: 'eq',
										compareTo: fourthValue,
									},
								},
							},
						},
					],
				},
			},
		],
	};

	const result = convertFilter(filter, randomCollection, idGen);

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
						column: firstField,
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
					type: 'condition-number',
					target: {
						type: 'primitive',
						table: randomCollection,
						column: secondField,
					},
					operation: 'eq',
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
								column: thirdField,
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
								column: fourthField,
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
		parameters: [firstValue, secondValue, thirdValue, fourthValue],
	});
});
