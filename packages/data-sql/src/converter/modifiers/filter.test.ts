import type {
	AbstractQueryFieldNodePrimitive,
	AbstractQueryFilterNode,
	AbstractQueryConditionNode,
} from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { beforeEach, describe, expect, test } from 'vitest';
import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '../../types.js';
import { parameterIndexGenerator } from '../../utils/param-index-generator.js';
import { convertCondition, convertFilter } from './filter.js';
import type { GeoJSONGeometry } from 'wellknown';

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
				type: 'number-condition',
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

describe('Convert condition', () => {
	test('number', () => {
		const idGen = parameterIndexGenerator();
		const randomCollection = randomIdentifier();
		const randomField = randomIdentifier();

		const con: AbstractQueryConditionNode = {
			type: 'condition',
			condition: {
				type: 'number-condition',
				target: {
					type: 'primitive',
					field: randomField,
				},
				operation: 'gt',
				compareTo: 6,
			},
		};

		const expectedWhere: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'number-condition',
				target: {
					type: 'primitive',
					table: randomCollection,
					column: randomField,
				},
				operation: 'gt',
				compareTo: {
					type: 'value',
					parameterIndex: 0,
				},
			},
		};

		expect(convertCondition(con, randomCollection, idGen, false)).toStrictEqual({
			where: expectedWhere,
			parameters: [con.condition.compareTo],
		});
	});

	test('number with function', () => {
		const idGen = parameterIndexGenerator();
		const randomCollection = randomIdentifier();
		const randomField = randomIdentifier();
		const randomValue = randomInteger(1, 100);

		const con: AbstractQueryConditionNode = {
			type: 'condition',
			condition: {
				type: 'number-condition',
				target: {
					type: 'fn',
					targetNode: {
						type: 'primitive',
						field: randomField,
					},
					fn: 'month',
				},
				operation: 'gt',
				compareTo: randomValue,
			},
		};

		const expectedWhere: AbstractSqlQueryConditionNode = {
			type: 'condition',
			condition: {
				type: 'number-condition',
				target: {
					type: 'fn',
					field: {
						type: 'primitive',
						table: randomCollection,
						column: randomField,
					},
					fn: 'month',
				},
				operation: 'gt',
				compareTo: {
					type: 'value',
					parameterIndex: 0,
				},
			},
			negate: false,
		};

		expect(convertCondition(con, randomCollection, idGen, false)).toStrictEqual({
			where: expectedWhere,
			parameters: [randomValue],
		});
	});

	test('set', () => {
		const idGen = parameterIndexGenerator();
		const randomCollection = randomIdentifier();
		const randomField = randomIdentifier();
		const randomValues: number[] = [randomInteger(1, 100), randomInteger(1, 100), randomInteger(1, 100)];

		const con: AbstractQueryConditionNode = {
			type: 'condition',
			condition: {
				type: 'set-condition',
				target: {
					type: 'primitive',
					field: randomField,
				},
				operation: 'in',
				compareTo: randomValues,
			},
		};

		const expectedWhere: AbstractSqlQueryConditionNode = {
			type: 'condition',
			condition: {
				type: 'set-condition',
				target: {
					type: 'primitive',
					table: randomCollection,
					column: randomField,
				},
				operation: 'in',
				compareTo: {
					type: 'values',
					parameterIndexes: [0, 1, 2],
				},
			},
			negate: false,
		};

		expect(convertCondition(con, randomCollection, idGen, false)).toStrictEqual({
			where: expectedWhere,
			parameters: randomValues,
		});
	});

	test('geo', () => {
		const idGen = parameterIndexGenerator();
		const randomCollection = randomIdentifier();
		const randomField = randomIdentifier();

		const gisValue: GeoJSONGeometry = {
			type: 'MultiPolygon',
			coordinates: [
				[
					[
						[102.0, 2.0],
						[103.0, 2.0],
						[103.0, 3.0],
						[102.0, 3.0],
						[102.0, 2.0],
					],
				],
				[
					[
						[100.0, 0.0],
						[101.0, 0.0],
						[101.0, 1.0],
						[100.0, 1.0],
						[100.0, 0.0],
					],
					[
						[100.2, 0.2],
						[100.2, 0.8],
						[100.8, 0.8],
						[100.8, 0.2],
						[100.2, 0.2],
					],
				],
			],
		};

		const con: AbstractQueryConditionNode = {
			type: 'condition',
			condition: {
				type: 'geo-condition',
				target: {
					type: 'primitive',
					field: randomField,
				},
				operation: 'intersects',
				compareTo: gisValue,
			},
		};

		const expectedWhere: AbstractSqlQueryConditionNode = {
			type: 'condition',
			condition: {
				type: 'geo-condition',
				target: {
					type: 'primitive',
					table: randomCollection,
					column: randomField,
				},
				operation: 'intersects',
				compareTo: {
					type: 'value',
					parameterIndex: 0,
				},
			},
			negate: false,
		};

		expect(convertCondition(con, randomCollection, idGen, false)).toStrictEqual({
			where: expectedWhere,
			parameters: [gisValue],
		});
	});
});

test.skip('Convert filter with one parameter and negation', () => {
	// sample.condition.negate = true;
	const idGen = parameterIndexGenerator();

	const expectedWhere: AbstractSqlQueryConditionNode = {
		type: 'condition',
		negate: true,
		condition: {
			type: 'number-condition',
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
					type: 'number-condition',
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
					type: 'number-condition',
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
					type: 'number-condition',
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
					type: 'number-condition',
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
					type: 'number-condition',
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
						type: 'number-condition',
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
									type: 'number-condition',
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
										type: 'number-condition',
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
					type: 'number-condition',
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
					type: 'number-condition',
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
							type: 'number-condition',
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
							type: 'number-condition',
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
