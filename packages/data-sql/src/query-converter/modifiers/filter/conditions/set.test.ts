import type { ConditionSetNode } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import type { AbstractSqlQueryConditionNode } from '../../../../types/clauses/where/index.js';
import { parameterIndexGenerator } from '../../../param-index-generator.js';
import { convertSetCondition } from './set.js';
import type { FilterResult } from '../utils.js';

test('convert set condition', () => {
	const idGen = parameterIndexGenerator();
	const randomCollection = randomIdentifier();
	const randomField = randomIdentifier();
	const randomValues: number[] = [randomInteger(1, 100), randomInteger(1, 100), randomInteger(1, 100)];

	const con: ConditionSetNode = {
		type: 'condition-set',
		target: {
			type: 'primitive',
			field: randomField,
		},
		operation: 'in',
		compareTo: randomValues,
	};

	const expectedWhere: AbstractSqlQueryConditionNode = {
		type: 'condition',
		condition: {
			type: 'condition-set',
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

	const expectedResult: FilterResult = {
		clauses: {
			where: expectedWhere,
			joins: [],
		},
		parameters: randomValues,
	};

	expect(convertSetCondition(con, randomCollection, idGen, false)).toStrictEqual(expectedResult);
});
