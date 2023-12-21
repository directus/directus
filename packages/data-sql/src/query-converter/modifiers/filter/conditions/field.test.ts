import type { ConditionFieldNode } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { createIndexGenerators } from '../../../../utils/create-index-generators.js';
import type { FilterResult } from '../utils.js';
import { convertFieldCondition } from './field.js';

test('convert field condition', () => {
	const tableIndex = randomInteger(0, 100);
	const column1Name = randomIdentifier();
	const column2Name = randomIdentifier();

	const condition: ConditionFieldNode = {
		type: 'condition-field',
		target: {
			type: 'primitive',
			field: column1Name,
		},
		operation: 'eq',
		compareTo: {
			type: 'primitive',
			field: column2Name,
		},
	};

	const expectedResult: FilterResult = {
		clauses: {
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-field',
					target: {
						type: 'primitive',
						tableIndex,
						columnName: column1Name,
					},
					operation: 'eq',
					compareTo: {
						type: 'primitive',
						tableIndex,
						columnName: column2Name,
					},
				},
			},
			joins: [],
		},
		parameters: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertFieldCondition(condition, tableIndex, indexGen, false);

	expect(result).toStrictEqual(expectedResult);
});
