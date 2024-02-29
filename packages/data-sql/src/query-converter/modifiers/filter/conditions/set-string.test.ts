import type { ConditionSetStringNode } from '@directus/data';
import { randomAlpha, randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { createIndexGenerators } from '../../../utils/create-index-generators.js';
import type { FilterResult } from '../utils.js';
import { convertSetStringCondition } from './set-string.js';

test('convert set string condition', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValues = [randomAlpha(10), randomAlpha(10), randomAlpha(10)];

	const condition: ConditionSetStringNode = {
		type: 'condition-set-string',
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
					type: 'condition-set-string',
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
	const result = convertSetStringCondition(condition, tableIndex, indexGen, false);

	expect(result).toStrictEqual(expectedResult);
});
