import type { AbstractQueryTargetNestedOne, ConditionNumberNode, ConditionStringNode } from '@directus/data';
import { randomAlpha, randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { createIndexGenerators } from '../../utils/create-index-generators.js';
import { convertNestedOneTarget, convertTarget, type TargetConversionResult } from './target.js';

test('convert primitive target', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValue = randomAlpha(10);

	const condition: ConditionStringNode = {
		type: 'condition-string',
		operation: 'eq',
		target: {
			type: 'primitive',
			field: columnName,
		},
		compareTo: columnValue,
	};

	const expectedResult: TargetConversionResult = {
		value: {
			type: 'primitive',
			tableIndex,
			columnName,
		},
		joins: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertTarget(condition.target, tableIndex, indexGen);

	expect(result).toStrictEqual(expectedResult);
});

test('convert function target', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValue = randomInteger(1, 100);

	const condition: ConditionNumberNode = {
		type: 'condition-number',
		operation: 'eq',
		target: {
			type: 'fn',
			field: columnName,
			fn: {
				type: 'extractFn',
				fn: 'year',
				isTimestampType: false,
			},
		},
		compareTo: columnValue,
	};

	const expectedResult: TargetConversionResult = {
		value: {
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'year',
				isTimestampType: false,
			},
			tableIndex,
			columnName,
		},
		joins: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertTarget(condition.target, tableIndex, indexGen);

	expect(result).toStrictEqual(expectedResult);
});

test('convert nested target', () => {
	const tableIndex = randomInteger(0, 100);
	const foreignKeyColumnName = randomIdentifier();

	const externalStore = randomIdentifier();
	const externalTableName = randomIdentifier();
	const externalTableIndex = 0;
	const externalColumnName = randomIdentifier();
	const externalKeyColumnName = randomIdentifier();

	const nestedTarget: AbstractQueryTargetNestedOne = {
		type: 'nested-one-target',
		field: {
			type: 'primitive',
			field: externalColumnName,
		},
		nesting: {
			type: 'relational-many',
			local: {
				fields: [foreignKeyColumnName],
			},
			foreign: {
				store: externalStore,
				collection: externalTableName,
				fields: [externalKeyColumnName],
			},
		},
	};

	const expectedResult: TargetConversionResult = {
		value: {
			type: 'primitive',
			tableIndex: externalTableIndex,
			columnName: externalColumnName,
		},
		joins: [
			{
				type: 'join',
				tableName: externalTableName,
				tableIndex: externalTableIndex,
				on: {
					type: 'condition',
					negate: false,
					condition: {
						type: 'condition-field',
						target: {
							type: 'primitive',
							tableIndex,
							columnName: foreignKeyColumnName,
						},
						operation: 'eq',
						compareTo: {
							type: 'primitive',
							tableIndex: externalTableIndex,
							columnName: externalKeyColumnName,
						},
					},
				},
			},
		],
	};

	const indexGen = createIndexGenerators();
	const result = convertNestedOneTarget(nestedTarget, tableIndex, indexGen);

	expect(result).toStrictEqual(expectedResult);
});
