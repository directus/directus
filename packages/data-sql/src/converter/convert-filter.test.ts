import type {
	AbstractQueryFieldNodePrimitive,
	AbstractQueryFilterNode,
	AbstractQueryNodeCondition,
	AbstractQueryNodeConditionValue,
} from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test, beforeEach } from 'vitest';
import { convertFilter } from './convert-filter.js';
import type { AbstractSqlQueryWhereConditionNode, AbstractSqlQueryWhereLogicalNode } from '../types.js';
import { parameterIndexGenerator } from '../utils/param-index-generator.js';

let sample: {
	condition: AbstractQueryNodeCondition;
	randomCollection: string;
};

beforeEach(() => {
	sample = {
		condition: {
			type: 'condition',
			target: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			operation: 'gt',
			compareTo: {
				type: 'value',
				value: randomInteger(1, 100),
			},
		},
		randomCollection: randomIdentifier(),
	};
});

test('Convert filter with one parameter', () => {
	const idGen = parameterIndexGenerator();

	const expectedWhere: AbstractSqlQueryWhereConditionNode = {
		type: 'condition',
		negate: false,
		target: {
			column: (sample.condition.target as AbstractQueryFieldNodePrimitive).field,
			table: sample.randomCollection,
			type: 'primitive',
		},
		operation: 'gt',
		compareTo: {
			type: 'value',
			parameterIndexes: [0],
		},
	};

	expect(convertFilter(sample.condition, sample.randomCollection, idGen)).toStrictEqual({
		where: expectedWhere,
		parameters: [(sample.condition.compareTo as AbstractQueryNodeConditionValue).value],
	});
});

test.skip('Convert filter with one parameter and negation', () => {
	// sample.condition.negate = true;
	const idGen = parameterIndexGenerator();

	const expectedWhere: AbstractSqlQueryWhereConditionNode = {
		type: 'condition',
		negate: true,
		target: {
			column: (sample.condition.target as AbstractQueryFieldNodePrimitive).field,
			table: sample.randomCollection,
			type: 'primitive',
		},
		operation: 'gt',
		compareTo: {
			type: 'value',
			parameterIndexes: [0],
		},
	};

	expect(convertFilter(sample.condition, sample.randomCollection, idGen)).toStrictEqual({
		where: expectedWhere,
		parameters: [(sample.condition.compareTo as AbstractQueryNodeConditionValue).value],
	});
});

test.skip('Convert filter with two parameters', () => {
	// sample.condition.operation = 'between';
	const idGen = parameterIndexGenerator();

	expect(convertFilter(sample.condition, sample.randomCollection, idGen)).toStrictEqual({
		where: {
			type: 'condition',
			negation: false,
			target: {
				column: (sample.condition.target as AbstractQueryFieldNodePrimitive).field,
				table: sample.randomCollection,
				type: 'primitive',
			},
			operation: 'between',
			compareTo: {
				type: 'value',
				parameterIndexes: [0, 1],
			},
		},
		parameters: [(sample.condition.compareTo as AbstractQueryNodeConditionValue).value],
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
				target: {
					type: 'primitive',
					field: firstField,
				},
				operation: 'gt',
				compareTo: {
					type: 'value',
					value: firstValue,
				},
			},
			{
				type: 'condition',
				target: {
					type: 'primitive',
					field: secondField,
				},
				operation: 'eq',
				compareTo: {
					type: 'value',
					value: secondValue,
				},
			},
		],
	};

	const result = convertFilter(filter, randomCollection, idGen);

	const expectedWhere: AbstractSqlQueryWhereLogicalNode = {
		type: 'logical',
		operator: 'or',
		negate: false,
		childNodes: [
			{
				type: 'condition',
				negate: false,
				target: {
					type: 'primitive',
					table: randomCollection,
					column: firstField,
				},
				operation: 'gt',
				compareTo: {
					type: 'value',
					parameterIndexes: [0],
				},
			},
			{
				type: 'condition',
				negate: false,
				target: {
					type: 'primitive',
					table: randomCollection,
					column: secondField,
				},
				operation: 'eq',
				compareTo: {
					type: 'value',
					parameterIndexes: [1],
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
				target: {
					type: 'primitive',
					field: firstField,
				},
				operation: 'gt',
				compareTo: {
					type: 'value',
					value: firstValue,
				},
			},
			{
				type: 'negate',
				childNode: {
					type: 'condition',
					target: {
						type: 'primitive',
						field: secondField,
					},
					operation: 'eq',
					compareTo: {
						type: 'value',
						value: secondValue,
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
								target: {
									type: 'primitive',
									field: thirdField,
								},
								operation: 'lt',
								compareTo: {
									type: 'value',
									value: thirdValue,
								},
							},
						},
						{
							type: 'negate',
							childNode: {
								type: 'negate',
								childNode: {
									type: 'condition',
									target: {
										type: 'primitive',
										field: fourthField,
									},
									operation: 'eq',
									compareTo: {
										type: 'value',
										value: fourthValue,
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

	const expectedWhere: AbstractSqlQueryWhereLogicalNode = {
		type: 'logical',
		operator: 'or',
		negate: false,
		childNodes: [
			{
				type: 'condition',
				negate: false,
				target: {
					type: 'primitive',
					table: randomCollection,
					column: firstField,
				},
				operation: 'gt',
				compareTo: {
					type: 'value',
					parameterIndexes: [0],
				},
			},
			{
				type: 'condition',
				negate: true,
				target: {
					type: 'primitive',
					table: randomCollection,
					column: secondField,
				},
				operation: 'eq',
				compareTo: {
					type: 'value',
					parameterIndexes: [1],
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
						target: {
							type: 'primitive',
							table: randomCollection,
							column: thirdField,
						},
						operation: 'lt',
						compareTo: {
							type: 'value',
							parameterIndexes: [2],
						},
					},
					{
						type: 'condition',
						negate: false,
						target: {
							type: 'primitive',
							table: randomCollection,
							column: fourthField,
						},
						operation: 'eq',
						compareTo: {
							type: 'value',
							parameterIndexes: [3],
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
