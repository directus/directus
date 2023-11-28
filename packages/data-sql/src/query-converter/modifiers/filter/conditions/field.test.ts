import type { ConditionFieldNode } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { expect, test } from 'vitest';
import { parameterIndexGenerator } from '../../../param-index-generator.js';
import type { FilterResult } from '../utils.js';
import { convertFieldCondition } from './field.js';

test('convert field condition', () => {
	const idGen = parameterIndexGenerator();
	const randomCollection2 = randomIdentifier();
	const randomField1 = randomIdentifier();
	const randomField2 = randomIdentifier();

	const con: ConditionFieldNode = {
		type: 'condition-field',
		target: {
			type: 'primitive',
			field: randomField1,
		},
		operation: 'eq',
		compareTo: {
			type: 'primitive',
			field: randomField2,
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
						table: randomCollection2,
						column: randomField1,
					},
					operation: 'eq',
					compareTo: {
						type: 'primitive',
						table: randomCollection2,
						column: randomField2,
					},
				},
			},
			joins: [],
		},
		parameters: [],
	};

	expect(convertFieldCondition(con, randomCollection2, idGen, false)).toStrictEqual(expectedResult);
});
