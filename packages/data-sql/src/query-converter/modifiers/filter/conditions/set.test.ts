import type { ConditionSetNode } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { createIndexGenerators } from '../../../../utils/create-index-generators.js';
import type { FilterResult } from '../utils.js';
import { convertSetCondition } from './set.js';

test('convert set condition', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValues = [randomInteger(1, 100), randomInteger(1, 100), randomInteger(1, 100)];

	const condition: ConditionSetNode = {
		type: 'condition-set',
		target: {
			type: 'primitive',
			field: columnName,
		},
		operation: 'in',
		compareTo: columnValues,
	};

	const expectedResult: FilterResult = {
		clauses: {
			where: {
				type: 'condition',
				condition: {
					type: 'condition-set',
					target: {
						type: 'primitive',
						tableIndex,
						columnName,
					},
					operation: 'in',
					compareTo: {
						type: 'values',
						parameterIndexes: [0, 1, 2],
					},
				},
				negate: false,
			},
			joins: [],
		},
		parameters: columnValues,
	};

	const indexGen = createIndexGenerators();
	const result = convertSetCondition(condition, tableIndex, indexGen, false);

	expect(result).toStrictEqual(expectedResult);
});
