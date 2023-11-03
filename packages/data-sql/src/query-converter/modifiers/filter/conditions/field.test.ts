import type { ConditionFieldNode } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { expect, test } from 'vitest';
import { convertFieldCondition } from './field.js';
import type { AbstractSqlQueryConditionNode } from '../../../../types/clauses/where/index.js';
import type { FilterResult } from '../filter.js';

test('convert field condition', () => {
	const randomCollection1 = randomIdentifier();
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

	const expectedWhere: AbstractSqlQueryConditionNode = {
		type: 'condition',
		negate: false,
		condition: {
			type: 'condition-field',
			target: {
				type: 'primitive',
				table: randomCollection1,
				column: randomField1,
			},
			operation: 'eq',
			compareTo: {
				type: 'primitive',
				table: randomCollection2,
				column: randomField2,
			},
		},
	};

	const expectedResult: FilterResult = {
		clauses: {
			where: expectedWhere,
			joins: [],
		},
		parameters: [],
	};

	expect(convertFieldCondition(con, randomCollection1, false)).toStrictEqual(expectedResult);
});
