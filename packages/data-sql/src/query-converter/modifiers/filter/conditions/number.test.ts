import type { ConditionNumberNode } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { createIndexGenerators } from '../../../../utils/create-index-generators.js';
import type { FilterResult } from '../utils.js';
import { convertNumberNode } from './number.js';

test('convert number condition', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValue = randomInteger(1, 100);

	const condition: ConditionNumberNode = {
		type: 'condition-number',
		target: {
			type: 'primitive',
			field: columnName,
		},
		operation: 'gt',
		compareTo: columnValue,
	};

	const expectedResult: FilterResult = {
		clauses: {
			where: {
				type: 'condition',
				negate: false,
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
	const result = convertNumberNode(condition, tableIndex, indexGen, false);

	expect(result).toStrictEqual(expectedResult);
});

test('convert number condition with function', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValue = randomInteger(1, 100);

	const con: ConditionNumberNode = {
		type: 'condition-number',
		target: {
			type: 'fn',
			field: columnName,
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
		},
		operation: 'gt',
		compareTo: columnValue,
	};

	const expectedResult: FilterResult = {
		clauses: {
			where: {
				type: 'condition',
				condition: {
					type: 'condition-number',
					target: {
						type: 'fn',
						tableIndex,
						columnName,
						fn: {
							type: 'extractFn',
							fn: 'month',
						},
					},
					operation: 'gt',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
				negate: false,
			},
			joins: [],
		},
		parameters: [columnValue],
	};

	const indexGen = createIndexGenerators();
	const result = convertNumberNode(con, tableIndex, indexGen, false);

	expect(result).toStrictEqual(expectedResult);
});
