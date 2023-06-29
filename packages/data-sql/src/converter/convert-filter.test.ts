import type {
	AbstractQueryFieldNodePrimitive,
	AbstractQueryNodeCondition,
	AbstractQueryNodeConditionValue,
} from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test, beforeEach } from 'vitest';
import { convertFilter } from './convert-filter.js';
import type { AbstractSqlQueryWhereNode } from '../types.js';

let sample: {
	condition: AbstractQueryNodeCondition;
	firstIndex: number;
	secondIndex: number | null;
	randomCollection: string;
};

beforeEach(() => {
	const firstIndex = randomInteger(1, 100);

	sample = {
		condition: {
			type: 'condition',
			target: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			operation: 'gt',
			compareTo: {
				type: 'value',
				values: [randomInteger(1, 100)],
			},
			negation: false,
		},
		firstIndex,
		secondIndex: firstIndex + 1,
		randomCollection: randomIdentifier(),
	};
});

test('Convert filter with one parameter', () => {
	const expectedWhere: AbstractSqlQueryWhereNode = {
		type: 'condition',
		negation: false,
		target: {
			column: (sample.condition.target as AbstractQueryFieldNodePrimitive).field,
			table: sample.randomCollection,
			type: 'primitive',
		},
		operation: 'gt',
		compareTo: {
			type: 'value',
			parameterIndexes: [sample.firstIndex],
		},
	};

	expect(convertFilter(sample.condition, sample.randomCollection, sample.firstIndex, null)).toStrictEqual({
		where: expectedWhere,
		parameters: (sample.condition.compareTo as AbstractQueryNodeConditionValue).values,
	});
});

test('Convert filter with one parameter and negation', () => {
	sample.condition.negation = true;

	const expectedWhere: AbstractSqlQueryWhereNode = {
		type: 'condition',
		negation: true,
		target: {
			column: (sample.condition.target as AbstractQueryFieldNodePrimitive).field,
			table: sample.randomCollection,
			type: 'primitive',
		},
		operation: 'gt',
		compareTo: {
			type: 'value',
			parameterIndexes: [sample.firstIndex],
		},
	};

	expect(convertFilter(sample.condition, sample.randomCollection, sample.firstIndex, null)).toStrictEqual({
		where: expectedWhere,
		parameters: (sample.condition.compareTo as AbstractQueryNodeConditionValue).values,
	});
});

test('Convert filter with two parameters', () => {
	sample.condition.operation = 'between';

	expect(convertFilter(sample.condition, sample.randomCollection, sample.firstIndex, sample.secondIndex)).toStrictEqual(
		{
			where: {
				type: 'condition',
				negation: false,
				target: {
					column: (sample.condition.target as AbstractQueryFieldNodePrimitive).field,
					table: sample.randomCollection,
					type: 'primitive',
				},
				operation: 'between',
				compareTo: {
					type: 'value',
					parameterIndexes: [sample.firstIndex, sample.secondIndex],
				},
			},
			parameters: (sample.condition.compareTo as AbstractQueryNodeConditionValue).values,
		}
	);
});
