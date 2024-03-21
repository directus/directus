import type { ConditionSetNumberNode } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { createIndexGenerators } from '../../../utils/create-index-generators.js';
import type { FilterResult } from '../utils.js';
import { convertSetNumberCondition } from './set-number.js';

test('convert set number condition', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValues = [randomInteger(1, 100), randomInteger(1, 100), randomInteger(1, 100)];

	const condition: ConditionSetNumberNode = {
		type: 'condition-set-number',
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
					type: 'condition-set-number',
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
	const result = convertSetNumberCondition(condition, tableIndex, indexGen, false);

	expect(result).toStrictEqual(expectedResult);
});
