import type { AbstractQueryConditionNode } from '@directus/data';
import { randomAlpha, randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { createIndexGenerators } from '../../../utils/create-index-generators.js';
import type { FilterResult } from '../utils.js';
import { convertCondition } from './conditions.js';

test('Convert string condition', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValue = randomAlpha(10);

	const condition: AbstractQueryConditionNode = {
		type: 'condition',

		condition: {
			type: 'condition-string',

			operation: 'eq',
			target: {
				type: 'primitive',
				field: columnName,
			},
			compareTo: columnValue,
		},
	};

	const expectedResult: FilterResult = {
		clauses: {
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-string',
					operation: 'eq',
					target: {
						type: 'primitive',
						tableIndex,
						columnName,
					},
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
	const result = convertCondition(condition, tableIndex, indexGen, false);

	expect(result).toStrictEqual(expectedResult);
});

test('Convert number condition', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValue = randomInteger(1, 100);

	const condition: AbstractQueryConditionNode = {
		type: 'condition',

		condition: {
			type: 'condition-number',

			operation: 'eq',
			target: {
				type: 'primitive',
				field: columnName,
			},
			compareTo: columnValue,
		},
	};

	const expectedResult: FilterResult = {
		clauses: {
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-number',
					operation: 'eq',
					target: {
						type: 'primitive',
						tableIndex,
						columnName,
					},
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
	const result = convertCondition(condition, tableIndex, indexGen, false);

	expect(result).toStrictEqual(expectedResult);
});

test('Convert set condition', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValue = randomAlpha(10);

	const condition: AbstractQueryConditionNode = {
		type: 'condition',

		condition: {
			type: 'condition-set-string',
			operation: 'in',
			target: {
				type: 'primitive',
				field: columnName,
			},
			compareTo: [columnValue],
		},
	};

	const expectedResult: FilterResult = {
		clauses: {
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-set-string',
					operation: 'in',
					target: {
						type: 'primitive',
						tableIndex,
						columnName,
					},
					compareTo: {
						type: 'values',
						parameterIndexes: [0],
					},
				},
			},
			joins: [],
		},
		parameters: [columnValue],
	};

	const indexGen = createIndexGenerators();
	const result = convertCondition(condition, tableIndex, indexGen, false);

	expect(result).toStrictEqual(expectedResult);
});

test('Convert geo points and lines condition', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValueCoordinateX = randomInteger(0, 100);
	const columnValueCoordinateY = randomInteger(0, 100);

	const condition: AbstractQueryConditionNode = {
		type: 'condition',

		condition: {
			type: 'condition-geo-intersects',

			operation: 'intersects',
			target: {
				type: 'primitive',
				field: columnName,
			},
			compareTo: {
				type: 'Point',
				coordinates: [columnValueCoordinateX, columnValueCoordinateY],
			},
		},
	};

	const expectedResult: FilterResult = {
		clauses: {
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-geo',
					operation: 'intersects',
					target: {
						type: 'primitive',
						tableIndex,
						columnName,
					},
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
			joins: [],
		},
		parameters: [
			{
				type: 'Point',
				coordinates: [columnValueCoordinateX, columnValueCoordinateY],
			},
		],
	};

	const indexGen = createIndexGenerators();
	const result = convertCondition(condition, tableIndex, indexGen, false);

	expect(result).toStrictEqual(expectedResult);
});
