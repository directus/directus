import type { ConditionStringNode } from '@directus/data';
import { randomAlpha, randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { createIndexGenerators } from '../../../../utils/create-index-generators.js';
import type { FilterResult } from '../utils.js';
import { convertStringNode } from './string.js';

test('convert string condition', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValue = randomAlpha(10);

	const condition: ConditionStringNode = {
		type: 'condition-string',
		target: {
			type: 'primitive',
			field: columnName,
		},
		operation: 'contains',
		compareTo: columnValue,
	};

	const expectedResult: FilterResult = {
		clauses: {
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-string',
					target: {
						type: 'primitive',
						tableIndex,
						columnName,
					},
					operation: 'contains',
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
	const result = convertStringNode(condition, tableIndex, indexGen, false);

	expect(result).toStrictEqual(expectedResult);
});
