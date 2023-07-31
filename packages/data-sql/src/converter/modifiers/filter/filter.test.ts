import type {
	AbstractQueryFieldNodePrimitive,
	AbstractQueryFilterNode,
	AbstractQueryConditionNode,
} from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import type { AbstractSqlQueryConditionNode } from '../../../types/modifiers/index.js';
import { parameterIndexGenerator } from '../../param-index-generator.js';
import { convertFilter } from './filter.js';

let sample: {
	condition: AbstractQueryConditionNode;
	randomCollection: string;
};

let randomCompareTo: number;

beforeEach(() => {
	randomCompareTo = randomInteger(1, 100);

	sample = {
		condition: {
			type: 'condition',
			condition: {
				type: 'condition-number',
				target: {
					type: 'primitive',
					field: randomIdentifier(),
				},
				operation: 'gt',
				compareTo: randomCompareTo,
			},
		},
		randomCollection: randomIdentifier(),
	};
});

test.skip('Convert filter with one parameter and negation', () => {
	// sample.condition.negate = true;
	const idGen = parameterIndexGenerator();

	const expectedWhere: AbstractSqlQueryConditionNode = {
		type: 'condition',
		negate: true,
		condition: {
			type: 'condition-number',
			target: {
				column: (sample.condition.condition.target as AbstractQueryFieldNodePrimitive).field,
				table: sample.randomCollection,
				type: 'primitive',
			},
			operation: 'gt',
			compareTo: {
				type: 'value',
				parameterIndex: 0,
			},
		},
	};

	expect(convertFilter(sample.condition, sample.randomCollection, idGen)).toStrictEqual({
		where: expectedWhere,
		parameters: [randomCompareTo],
	});
});
