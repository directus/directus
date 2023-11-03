import { expect, test, vi } from 'vitest';
import { convertNestedOneTarget, convertTarget } from './utils.js';
import type { AbstractQueryFieldNodeNestedTarget, ConditionNumberNode, ConditionStringNode } from '@directus/data';
import { parameterIndexGenerator } from '../../../param-index-generator.js';
import { randomIdentifier, randomInteger } from '@directus/random';

vi.mock('../../../../orm/create-unique-alias.js', () => ({
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

	const expected = {
		type: 'primitive',
		column: conditionTargetField,
		table: collection,
	};

	const idGen = parameterIndexGenerator();
	const result = convertTarget(stringCondition, collection, idGen);
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

	const expected = {
		type: 'fn',
		fn: {
			type: 'extractFn',
			fn: 'year',
			isTimestampType: false,
		},
		column: conditionTargetField,
		table: collection,
	};

	const idGen = parameterIndexGenerator();
	const result = convertTarget(condition, collection, idGen);
	expect(result).toStrictEqual(expected);
});

test('convert nested target', () => {
	const leftCollection = randomIdentifier();
	const leftIdentifierField = randomIdentifier();
	const rightIdentifierField = randomIdentifier();
	const store = randomIdentifier();
	const filterField = randomIdentifier();
	const foreignCollection = randomIdentifier();

	const sample: AbstractQueryFieldNodeNestedTarget = {
		type: 'nested-one-target',
		field: {
			type: 'primitive',
			field: filterField,
		},
		meta: {
			type: 'm2o',
			join: {
				local: {
					fields: [leftIdentifierField],
				},
				foreign: {
					store,
					collection: foreignCollection,
					fields: [rightIdentifierField],
				},
			},
		},
	};

	const res = convertNestedOneTarget(leftCollection, sample);

	const expected = {
		join: {
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
		target: {
			type: 'primitive',
			table: foreignCollection,
			column: filterField,
		},
	};

	expect(res).toStrictEqual(expected);
});
