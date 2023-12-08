import type { ConditionStringNode } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { expect, test } from 'vitest';
import type { AbstractSqlQueryConditionNode } from '../../../../types/index.js';
import { createIndexGenerators } from '../../../../utils/create-index-generators.js';
import type { FilterResult } from '../utils.js';
import { convertStringNode } from './string.js';

test('convert string condition', () => {
	const indexGen = createIndexGenerators();
	const randomCollection = randomIdentifier();
	const randomField = randomIdentifier();
	const randomCompareValue = randomIdentifier();

	const con: ConditionStringNode = {
		type: 'condition-string',
		target: {
			type: 'primitive',
			field: randomField,
		},
		operation: 'contains',
		compareTo: randomCompareValue,
	};

	const expectedWhere: AbstractSqlQueryConditionNode = {
		type: 'condition',
		negate: false,
		condition: {
			type: 'condition-string',
			target: {
				type: 'primitive',
				table: randomCollection,
				column: randomField,
			},
			operation: 'contains',
			compareTo: {
				type: 'value',
				parameterIndex: 0,
			},
		},
	};

	const expectedResult: FilterResult = {
		clauses: {
			where: expectedWhere,
			joins: [],
		},
		parameters: [randomCompareValue],
	};

	expect(convertStringNode(con, randomCollection, indexGen, false)).toStrictEqual(expectedResult);
});
