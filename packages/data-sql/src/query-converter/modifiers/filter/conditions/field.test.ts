import type { ConditionFieldNode } from '@directus/data';
import { expect, test } from 'vitest';
import { convertFieldCondition } from './field.js';
import type { FilterResult } from '../filter.js';
import { randomIdentifier } from '@directus/random';

test('convert field condition', () => {
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

	expect(convertFieldCondition(con, randomCollection2, false)).toStrictEqual(expectedResult);
});
