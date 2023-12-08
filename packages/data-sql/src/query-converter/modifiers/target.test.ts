import type { AbstractQueryTargetNestedOne, ConditionNumberNode, ConditionStringNode } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test, vi } from 'vitest';
import { createIndexGenerators } from '../../utils/create-index-generators.js';
import { convertNestedOneTarget, convertTarget, type TargetConversionResult } from './target.js';

vi.mock('../../utils/create-unique-alias.js', () => ({
	createUniqueAlias: vi.fn().mockImplementation((i) => `${i}_RANDOM`),
}));

test('convert primitive target', () => {
	const conditionTargetField = randomIdentifier();
	const compareValue = randomIdentifier();
	const collection = randomIdentifier();

	const stringCondition: ConditionStringNode = {
		type: 'condition-string',
		operation: 'eq',
		target: {
			type: 'primitive',
			field: conditionTargetField,
		},
		compareTo: compareValue,
	};

	const expected: TargetConversionResult = {
		value: {
			type: 'primitive',
			column: conditionTargetField,
			table: collection,
		},
		joins: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertTarget(stringCondition.target, collection, indexGen);
	expect(result).toStrictEqual(expected);
});

test('convert function target', () => {
	const conditionTargetField = randomIdentifier();
	const compareValue = randomInteger(2, 500);
	const collection = randomIdentifier();

	const condition: ConditionNumberNode = {
		type: 'condition-number',
		operation: 'eq',
		target: {
			type: 'fn',
			field: conditionTargetField,
			fn: {
				type: 'extractFn',
				fn: 'year',
				isTimestampType: false,
			},
		},
		compareTo: compareValue,
	};

	const expected: TargetConversionResult = {
		value: {
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'year',
				isTimestampType: false,
			},
			column: conditionTargetField,
			table: collection,
		},
		joins: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertTarget(condition.target, collection, indexGen);
	expect(result).toStrictEqual(expected);
});

test('convert nested target', () => {
	const leftCollection = randomIdentifier();
	const leftIdentifierField = randomIdentifier();
	const rightIdentifierField = randomIdentifier();
	const store = randomIdentifier();
	const filterField = randomIdentifier();
	const foreignCollection = randomIdentifier();

	const sample: AbstractQueryTargetNestedOne = {
		type: 'nested-one-target',
		field: {
			type: 'primitive',
			field: filterField,
		},
		nesting: {
			type: 'relational-many',
			local: {
				fields: [leftIdentifierField],
			},
			foreign: {
				store,
				collection: foreignCollection,
				fields: [rightIdentifierField],
			},
		},
	};

	const indexGen = createIndexGenerators();
	const res = convertNestedOneTarget(leftCollection, sample, indexGen);

	const expected = {
		value: {
			type: 'primitive',
			table: foreignCollection + '_RANDOM',
			column: filterField,
		},
		joins: [
			{
				type: 'join',
				table: foreignCollection,
				as: foreignCollection + '_RANDOM',
				on: {
					type: 'condition',
					negate: false,
					condition: {
						type: 'condition-field',
						target: {
							type: 'primitive',
							table: leftCollection,
							column: leftIdentifierField,
						},
						operation: 'eq',
						compareTo: {
							type: 'primitive',
							table: foreignCollection + '_RANDOM',
							column: rightIdentifierField,
						},
					},
				},
			},
		],
	};

	expect(res).toStrictEqual(expected);
});
